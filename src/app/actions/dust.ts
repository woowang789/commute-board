'use server'

import { STATION_MAP } from '@/constants/districtDongMap'
import { type AirQualityData } from '@/types'
import { logger } from '@/lib/logger'

const GRADE_MAP: Record<string, string> = {
  '1': '좋음',
  '2': '보통',
  '3': '나쁨',
  '4': '매우나쁨',
}

export async function fetchDustAction(region: string): Promise<AirQualityData> {
  // "서울특별시 영등포구" → "영등포구"
  const districtName = region.split(' ').pop() ?? region
  const stationName = STATION_MAP[districtName]
  if (!stationName) {
    logger.warn('API', '지원하지 않는 미세먼지 지역', { region, districtName })
    throw new Error(`지원하지 않는 지역: ${region}`)
  }

  const apiKey = process.env.AIRKOREA_API_KEY
  if (!apiKey) {
    logger.error('API', 'AIRKOREA_API_KEY 환경변수가 설정되지 않았습니다')
    throw new Error('미세먼지 API 키가 설정되지 않았습니다')
  }

  logger.debug('API', '미세먼지 API 호출 시작', { region, stationName })
  const timer = logger.startTimer()

  const url = new URL(
    'https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty'
  )
  url.searchParams.set('serviceKey', apiKey)
  url.searchParams.set('returnType', 'json')
  url.searchParams.set('numOfRows', '1')
  url.searchParams.set('pageNo', '1')
  url.searchParams.set('stationName', stationName)
  url.searchParams.set('dataTerm', 'DAILY')
  url.searchParams.set('ver', '1.5')

  logger.debug('API', '미세먼지 API 요청 URL', { url: logger.maskUrl(url.toString()) })
  const res = await fetch(url.toString(), { next: { revalidate: 0 } })
  if (!res.ok) {
    logger.error('API', '에어코리아 API 오류', { status: res.status, region })
    throw new Error(`에어코리아 API 오류: ${res.status}`)
  }

  const json = await res.json()
  const items = json?.response?.body?.items
  if (!items || items.length === 0) {
    logger.warn('API', '미세먼지 측정 데이터 없음', { region, stationName })
    throw new Error('측정 데이터 없음')
  }

  const rawItem = items[0]
  logger.debug('API', '미세먼지 API 응답', {
    status: res.status,
    stationName,
    pm10Grade: rawItem?.pm10Grade,
    pm25Grade: rawItem?.pm25Grade,
  })

  const result = {
    pm10Value: Number(rawItem.pm10Value) || 0,
    pm25Value: Number(rawItem.pm25Value) || 0,
    pm10Grade: GRADE_MAP[rawItem.pm10Grade] ?? '알 수 없음',
    pm25Grade: GRADE_MAP[rawItem.pm25Grade] ?? '알 수 없음',
    stationName: rawItem.stationName,
    dataTime: rawItem.dataTime ?? '',
    hasFlag: !!(rawItem.pm10Flag || rawItem.pm25Flag),
  }

  logger.info('PERF', '미세먼지 API 완료', { region, durationMs: timer() })
  return result
}
