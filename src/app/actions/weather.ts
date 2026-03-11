'use server'

import { REGION_GRID_FULL } from '@/constants/regionGridFull'
import { calcWindChill } from '@/lib/windChill'
import { type WeatherData } from '@/types'
import { logger } from '@/lib/logger'

const KMA_BASE = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0'

// 단기예보 발표 시각 (분 단위, API 사용 가능 기준: 발표 후 10분)
const VILAGE_BASE_MINUTES = [130, 310, 490, 670, 850, 1030, 1210, 1390] // 02:10~23:10
const VILAGE_BASE_TIMES = ['0200', '0500', '0800', '1100', '1400', '1700', '2000', '2300']

// 단기예보 base_date, base_time 계산
function getVilageFcstBaseDateTime(): { base_date: string; base_time: string } {
  const now = new Date()
  const totalMinutes = now.getHours() * 60 + now.getMinutes()

  let baseDate = now
  let idx: number

  if (totalMinutes < VILAGE_BASE_MINUTES[0]) {
    // 자정~02:09 → 전날 23:00 사용
    const prev = new Date(now)
    prev.setDate(prev.getDate() - 1)
    baseDate = prev
    idx = VILAGE_BASE_TIMES.length - 1
  } else {
    idx = VILAGE_BASE_MINUTES.filter((t) => t <= totalMinutes).length - 1
  }

  const y = baseDate.getFullYear()
  const m = String(baseDate.getMonth() + 1).padStart(2, '0')
  const d = String(baseDate.getDate()).padStart(2, '0')
  return { base_date: `${y}${m}${d}`, base_time: VILAGE_BASE_TIMES[idx] }
}

// 초단기실황 base_date, base_time 계산 (매 정시, 10분 이후 가용)
function getUltraSrtNcstBaseDateTime(): { base_date: string; base_time: string } {
  const now = new Date()
  const hours = now.getHours()
  const minutes = now.getMinutes()

  // 10분 이전이면 1시간 전 데이터 사용
  const baseHour = minutes < 10 ? (hours - 1 + 24) % 24 : hours
  let baseDate = now
  if (minutes < 10 && hours === 0) {
    // 자정 00:00~00:09 → 전날 23:00
    baseDate = new Date(now)
    baseDate.setDate(baseDate.getDate() - 1)
  }

  const y = baseDate.getFullYear()
  const m = String(baseDate.getMonth() + 1).padStart(2, '0')
  const d = String(baseDate.getDate()).padStart(2, '0')
  return {
    base_date: `${y}${m}${d}`,
    base_time: String(baseHour).padStart(2, '0') + '00',
  }
}

const PTY_LABEL: Record<string, string> = {
  '0': '없음',
  '1': '비',
  '2': '비/눈',
  '3': '눈',
  '4': '소나기',
  '5': '빗방울',
  '6': '빗방울/눈날림',
  '7': '눈날림',
}

export async function fetchWeatherAction(region: string): Promise<WeatherData> {
  const grid = REGION_GRID_FULL[region]
  if (!grid) {
    logger.warn('API', '알 수 없는 지역', { region })
    throw new Error(`알 수 없는 지역: ${region}`)
  }

  const serviceKey = process.env.KMA_API_KEY
  if (!serviceKey) {
    logger.error('API', 'KMA_API_KEY 환경변수가 설정되지 않았습니다')
    throw new Error('날씨 API 키가 설정되지 않았습니다')
  }

  logger.debug('API', '날씨 API 호출 시작', { region, nx: grid.nx, ny: grid.ny })
  const timer = logger.startTimer()
  const commonParams = {
    pageNo: '1',
    dataType: 'JSON',
    nx: String(grid.nx),
    ny: String(grid.ny),
  }

  // 초단기실황 + 단기예보 URL 구성
  const ncstUrl = buildUrl(`${KMA_BASE}/getUltraSrtNcst`, {
    ...commonParams,
    serviceKey,
    numOfRows: '10',
    ...getUltraSrtNcstBaseDateTime(),
  })
  const fcstUrl = buildUrl(`${KMA_BASE}/getVilageFcst`, {
    ...commonParams,
    serviceKey,
    numOfRows: '1000',
    ...getVilageFcstBaseDateTime(),
  })
  logger.debug('API', '날씨 API 요청 URL', {
    ncstUrl: logger.maskUrl(ncstUrl),
    fcstUrl: logger.maskUrl(fcstUrl),
  })

  // 초단기실황 + 단기예보 병렬 호출
  const [ncstRes, fcstRes] = await Promise.all([
    fetch(ncstUrl, { cache: 'no-store' }),
    fetch(fcstUrl, { cache: 'no-store' }),
  ])

  logger.debug('API', '날씨 API 응답', { ncstStatus: ncstRes.status, fcstStatus: fcstRes.status })

  if (!ncstRes.ok) {
    logger.error('API', '초단기실황 API 오류', { status: ncstRes.status, region })
    throw new Error(`초단기실황 API 오류: ${ncstRes.status}`)
  }
  if (!fcstRes.ok) {
    logger.error('API', '단기예보 API 오류', { status: fcstRes.status, region })
    throw new Error(`단기예보 API 오류: ${fcstRes.status}`)
  }

  let ncstJson: unknown, fcstJson: unknown
  try {
    ;[ncstJson, fcstJson] = await Promise.all([ncstRes.json(), fcstRes.json()])
  } catch (err) {
    logger.error('API', '날씨 데이터 파싱 오류', {
      region,
      error: err instanceof Error ? err.message : String(err),
    })
    throw err
  }

  // 초단기실황 파싱
  const ncstItems: Array<{ category: string; obsrValue: string }> =
    (ncstJson as { response: { body: { items: { item: Array<{ category: string; obsrValue: string }> } } } }).response.body.items.item
  const getNcst = (cat: string) =>
    ncstItems.find((i) => i.category === cat)?.obsrValue ?? '0'

  const temp = parseFloat(getNcst('T1H'))
  const windSpeed = parseFloat(getNcst('WSD'))
  const humidity = parseInt(getNcst('REH'), 10)
  const pty = getNcst('PTY')

  // 단기예보 파싱 (가장 가까운 시간대 데이터 우선)
  const fcstItems: Array<{ category: string; fcstValue: string; fcstDate: string; fcstTime: string }> =
    (fcstJson as { response: { body: { items: { item: Array<{ category: string; fcstValue: string; fcstDate: string; fcstTime: string }> } } } }).response.body.items.item
  const getFcst = (cat: string) =>
    fcstItems.find((i) => i.category === cat)?.fcstValue ?? '0'
  const getFcstOrNull = (cat: string) => {
    const val = fcstItems.find((i) => i.category === cat)?.fcstValue
    return val != null ? parseFloat(val) : null
  }

  const sky = getFcst('SKY')
  const pop = parseInt(getFcst('POP'), 10)
  const tempMin = getFcstOrNull('TMN')
  const tempMax = getFcstOrNull('TMX')

  const result = {
    temp,
    feelsLike: calcWindChill(temp, windSpeed),
    precipitation: PTY_LABEL[pty] ?? '없음',
    windSpeed,
    pty,
    sky,
    humidity,
    pop,
    tempMin,
    tempMax,
  }

  logger.debug('API', '날씨 파싱 결과', { region, temp, sky, pop, pty })
  logger.info('PERF', '날씨 API 완료', { region, durationMs: timer() })
  return result
}

function buildUrl(base: string, params: Record<string, string>): string {
  const url = new URL(base)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return url.toString()
}
