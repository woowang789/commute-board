'use server'

import { getMockBusData } from '@/mocks/busMock'
import {
  type BusStopArrivalData,
  type BusStopSearchItem,
  type BusRouteByStation,
} from '@/types'
import { logger, maskUrl } from '@/lib/logger'

const BUS_API_BASE = 'http://ws.bus.go.kr/api/rest/stationinfo'
const API_KEY = process.env.SEOUL_BUS_API_KEY ?? ''
const ENCODED_KEY = encodeURIComponent(API_KEY)

// ── 공통 JSON 응답 타입 ──────────────────────────────────────
interface BusApiResponse {
  msgHeader: { headerMsg: string; headerCd: string; itemCount: number }
  msgBody: { itemList: Record<string, string | number | null>[] | null }
}

function checkApiError(json: BusApiResponse): string | null {
  const { headerCd, headerMsg } = json.msgHeader
  if (headerCd && headerCd !== '0') {
    return `API 오류 (코드: ${headerCd}): ${headerMsg}`
  }
  return null
}

function getItemList(json: BusApiResponse): Record<string, string | number | null>[] {
  return json.msgBody?.itemList ?? []
}

function str(value: string | number | null | undefined): string {
  if (value == null) return ''
  return String(value).trim()
}

// ── 1. 정류소명 검색 ──────────────────────────────────────────
export async function searchBusStopsAction(
  query: string
): Promise<BusStopSearchItem[]> {
  if (!query.trim()) return []

  if (!API_KEY) {
    logger.warn('API', '서울 버스 API 키가 설정되지 않았습니다')
    return []
  }

  const url = `${BUS_API_BASE}/getStationByName?serviceKey=${ENCODED_KEY}&stSrch=${encodeURIComponent(query.trim())}&resultType=json`
  logger.debug('API', '정류소 검색 요청', { url: maskUrl(url) })

  const timer = logger.startTimer()

  try {
    const res = await fetch(url, { next: { revalidate: 300 } })
    const json: BusApiResponse = await res.json()
    const elapsed = timer()
    logger.debug('API', `정류소 검색 응답 (${elapsed}ms)`)

    const err = checkApiError(json)
    if (err) {
      logger.warn('API', err)
      return []
    }

    const items = getItemList(json)
    return items
      .map((item) => ({
        stId: str(item.stId),
        stNm: str(item.stNm),
        arsId: str(item.arsId),
        tmX: str(item.tmX),
        tmY: str(item.tmY),
      }))
      .filter((item) => item.arsId && item.arsId !== '0')
  } catch (e) {
    logger.error('API', '정류소 검색 실패', {
      error: e instanceof Error ? e.message : String(e),
    })
    return []
  }
}

// ── 2. 정류소별 경유 노선 조회 ────────────────────────────────
export async function getRoutesByStationAction(
  arsId: string
): Promise<BusRouteByStation[]> {
  if (!arsId) return []

  if (!API_KEY) {
    logger.warn('API', '서울 버스 API 키가 설정되지 않았습니다')
    return []
  }

  const url = `${BUS_API_BASE}/getRouteByStation?serviceKey=${ENCODED_KEY}&arsId=${arsId}&resultType=json`
  logger.debug('API', '경유 노선 조회 요청', { arsId, url: maskUrl(url) })

  const timer = logger.startTimer()

  try {
    const res = await fetch(url, { next: { revalidate: 300 } })
    const json: BusApiResponse = await res.json()
    const elapsed = timer()
    logger.debug('API', `경유 노선 조회 응답 (${elapsed}ms)`)

    const err = checkApiError(json)
    if (err) {
      logger.warn('API', err)
      return []
    }

    const items = getItemList(json)
    return items.map((item) => ({
      busRouteId: str(item.busRouteId),
      busRouteNm: str(item.busRouteNm),
      busRouteAbrv: str(item.busRouteAbrv),
      busRouteType: str(item.busRouteType),
      term: str(item.term),
      nextBus: str(item.nextBus),
      stBegin: str(item.stBegin),
      stEnd: str(item.stEnd),
    }))
  } catch (e) {
    logger.error('API', '경유 노선 조회 실패', {
      error: e instanceof Error ? e.message : String(e),
    })
    return []
  }
}

// ── 2-1. 정류소 방향 힌트 조회 (getStationByUid에서 adirection 추출) ──
export async function getDirectionHintAction(
  arsId: string
): Promise<string> {
  if (!arsId || !API_KEY) return ''

  const url = `${BUS_API_BASE}/getStationByUid?serviceKey=${ENCODED_KEY}&arsId=${arsId}&resultType=json`
  logger.debug('API', '방향 힌트 조회 요청', { arsId, url: maskUrl(url) })

  const timer = logger.startTimer()

  try {
    const res = await fetch(url, { next: { revalidate: 600 } })
    const json: BusApiResponse = await res.json()
    const elapsed = timer()
    logger.debug('API', `방향 힌트 조회 응답 (${elapsed}ms)`, { arsId })

    const err = checkApiError(json)
    if (err) {
      logger.warn('API', err)
      return ''
    }

    const items = getItemList(json)
    const directions = new Map<string, string>()
    for (const item of items) {
      const routeNo = str(item.busRouteAbrv) || str(item.rtNm)
      const dir = str(item.adirection)
      if (routeNo && dir && !directions.has(routeNo)) {
        directions.set(routeNo, dir)
      }
    }

    const entries = Array.from(directions.entries()).slice(0, 3)
    if (entries.length === 0) return ''

    return entries.map(([no, dir]) => `${no} ${dir}`).join(' · ') + ' 방면'
  } catch (e) {
    logger.error('API', '방향 힌트 조회 실패', {
      arsId,
      error: e instanceof Error ? e.message : String(e),
    })
    return ''
  }
}

// ── 2-2. 정류소별 노선 방향 조회 (adirection 맵) ──────────────
export async function getRouteDirectionsAction(
  arsId: string
): Promise<Record<string, string>> {
  if (!arsId || !API_KEY) return {}

  const url = `${BUS_API_BASE}/getStationByUid?serviceKey=${ENCODED_KEY}&arsId=${arsId}&resultType=json`
  logger.debug('API', '노선 방향 조회 요청', { arsId, url: maskUrl(url) })

  const timer = logger.startTimer()

  try {
    const res = await fetch(url, { next: { revalidate: 600 } })
    const json: BusApiResponse = await res.json()
    const elapsed = timer()
    logger.debug('API', `노선 방향 조회 응답 (${elapsed}ms)`, { arsId })

    const err = checkApiError(json)
    if (err) {
      logger.warn('API', err)
      return {}
    }

    const items = getItemList(json)
    const directions: Record<string, string> = {}
    for (const item of items) {
      const routeNo = str(item.busRouteAbrv) || str(item.rtNm)
      const dir = str(item.adirection)
      if (routeNo && dir && !directions[routeNo]) {
        directions[routeNo] = dir
      }
    }

    return directions
  } catch (e) {
    logger.error('API', '노선 방향 조회 실패', {
      arsId,
      error: e instanceof Error ? e.message : String(e),
    })
    return {}
  }
}

// ── 3. 실시간 도착 정보 조회 (getStationByUidItem) ────────────
export async function fetchBusArrivalByArsId(
  arsId: string
): Promise<BusStopArrivalData | null> {
  if (!arsId) return null

  if (!API_KEY) {
    logger.warn('API', '서울 버스 API 키가 설정되지 않았습니다')
    return null
  }

  const url = `${BUS_API_BASE}/getStationByUid?serviceKey=${ENCODED_KEY}&arsId=${arsId}&resultType=json`
  logger.debug('API', '실시간 도착 정보 요청', { arsId, url: maskUrl(url) })

  const timer = logger.startTimer()

  try {
    const res = await fetch(url, { cache: 'no-store' })
    const json: BusApiResponse = await res.json()
    const elapsed = timer()
    logger.debug('API', `실시간 도착 정보 응답 (${elapsed}ms)`)

    const err = checkApiError(json)
    if (err) {
      logger.warn('API', err)
      return null
    }

    const items = getItemList(json)
    const stNm = items.length > 0 ? str(items[0].stNm) : ''

    const routes = items.map((item) => ({
      routeNo: str(item.busRouteAbrv) || str(item.rtNm),
      arrMsg1: str(item.arrmsg1) || '정보 없음',
      arrMsg2: str(item.arrmsg2) || '정보 없음',
      direction: str(item.adirection) || undefined,
      routeType: str(item.routeType) || undefined,
      congestion1: Number(item.congestion1) || undefined,
      congestion2: Number(item.congestion2) || undefined,
    }))

    return {
      arsId,
      stopName: stNm || arsId,
      routes,
    }
  } catch (e) {
    logger.error('API', '실시간 도착 정보 실패', {
      arsId,
      error: e instanceof Error ? e.message : String(e),
    })
    return null
  }
}

// ── 4. 버스 카드용 통합 조회 (기존 fetchBusAction 대체) ────────
export async function fetchBusAction(
  busEntries: Array<{ arsId?: string; stopName: string; routeNos: string[] }>
): Promise<BusStopArrivalData[]> {
  // arsId가 없는 항목은 mock 데이터 사용 (하위 호환)
  const hasApi = API_KEY && busEntries.some((e) => e.arsId)

  if (!hasApi) {
    logger.debug('API', '버스 API 호출 (모의 데이터)', {
      stops: busEntries.map((e) => e.stopName),
    })
    return getMockBusData(busEntries)
  }

  const results: BusStopArrivalData[] = []

  for (const entry of busEntries) {
    if (!entry.arsId) {
      // arsId 없으면 mock
      const mock = getMockBusData([entry])
      results.push(...mock)
      continue
    }

    const data = await fetchBusArrivalByArsId(entry.arsId)
    if (!data) {
      // API 실패 시 mock fallback
      logger.warn('API', `실시간 도착 정보 실패, mock fallback: ${entry.stopName}`)
      const mock = getMockBusData([entry])
      results.push(...mock)
      continue
    }

    // 사용자가 선택한 노선만 필터링
    const filteredRoutes = data.routes.filter((r) =>
      entry.routeNos.includes(r.routeNo)
    )

    results.push({
      arsId: entry.arsId,
      stopName: data.stopName,
      routes: filteredRoutes.length > 0 ? filteredRoutes : data.routes.filter((r) =>
        entry.routeNos.some((no) => r.routeNo.includes(no) || no.includes(r.routeNo))
      ),
    })
  }

  return results
}
