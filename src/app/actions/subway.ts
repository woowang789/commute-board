'use server'

import { type SubwayArrivalData } from '@/types'
import { logger } from '@/lib/logger'

interface RealtimeArrival {
  updnLine: string
  arvlMsg2: string
  arvlMsg3: string
  trainLineNm: string
  barvlDt: string
  subwayId: string
}

// 호선명 → 서울시 지하철 API subwayId 코드 매핑
const LINE_NAME_TO_ID: Record<string, string> = {
  '1호선': '1001', '2호선': '1002', '3호선': '1003', '4호선': '1004',
  '5호선': '1005', '6호선': '1006', '7호선': '1007', '8호선': '1008',
  '9호선': '1009', '중앙선': '1061', '경의중앙선': '1063',
  'AREX': '1065', '공항철도': '1065', '경춘선': '1067',
  '수인분당선': '1075', '신분당선': '1077', '우이신설선': '1092',
  '서해선': '1093', '경강선': '1081', 'GTX-A': '1032',
}

export async function fetchSubwayAction(
  stationName: string,
  lineNos: string[]
): Promise<SubwayArrivalData> {
  const apiKey = process.env.SEOUL_SUBWAY_API_KEY
  if (!apiKey) {
    logger.error('API', 'SEOUL_SUBWAY_API_KEY 환경변수가 설정되지 않았습니다')
    throw new Error('지하철 API 키가 설정되지 않았습니다')
  }

  // 서울시 API는 역명에 "역" 접미사 없이 사용
  const apiStationName = stationName.endsWith('역')
    ? stationName.slice(0, -1)
    : stationName
  const encodedStation = encodeURIComponent(apiStationName)
  const url = `http://swopenapi.seoul.go.kr/api/subway/${apiKey}/json/realtimeStationArrival/0/30/${encodedStation}`
  const maskedUrl = url.replace(apiKey, '***MASKED***')

  logger.debug('API', '지하철 API 호출 시작', { stationName, lineNos })
  logger.debug('API', '지하철 API 요청 URL', { url: maskedUrl })
  const timer = logger.startTimer()

  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    logger.error('API', '지하철 API HTTP 오류', { status: res.status, stationName })
    throw new Error(`지하철 API 오류: ${res.status}`)
  }

  const json = await res.json()
  const list: RealtimeArrival[] = json.realtimeArrivalList ?? []
  logger.debug('API', '지하철 API 응답', { status: res.status, arrivalCount: list.length, stationName })

  // API 레벨 에러 처리
  const code = json.errorMessage?.code
  if (code && code !== 'INFO-000') {
    if (code === 'INFO-200') {
      logger.info('API', '지하철 도착 정보 없음 (INFO-200)', { stationName })
      return { stationName, lines: [] }
    }
    logger.error('API', '지하철 API 레벨 에러', { code, stationName })
    throw new Error(`지하철 API 에러: ${code}`)
  }

  const lines = lineNos.map((lineNo) => {
    // 호선명("2호선")을 API subwayId("1002")로 변환하여 필터링
    const subwayId = LINE_NAME_TO_ID[lineNo] ?? lineNo
    const lineData = list.filter((i) => i.subwayId === subwayId)
    const upAll = lineData.filter((i) => i.updnLine === '상행' || i.updnLine === '외선')
    const downAll = lineData.filter((i) => i.updnLine === '하행' || i.updnLine === '내선')

    const toTrain = (item: RealtimeArrival) => ({
      arrival: item.arvlMsg2 ?? '정보 없음',
      destination: item.trainLineNm ?? '',
      currentStation: item.arvlMsg3 ?? '',
      arrivalSec: item.barvlDt ? Number(item.barvlDt) : undefined,
    })

    return {
      lineNo,
      upTrains: upAll.slice(0, 2).map(toTrain),
      downTrains: downAll.slice(0, 2).map(toTrain),
    }
  })

  logger.info('PERF', '지하철 API 완료', { stationName, durationMs: timer(), arrivalCount: list.length })
  return { stationName, lines }
}
