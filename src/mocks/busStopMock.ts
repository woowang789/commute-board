// 버스 정류장 검색 MOCK 데이터
// 실제 API 연동 후에도 API 키 미설정 시 fallback으로 사용

export interface BusRoute {
  routeNo: string   // 버스 번호 (예: "3417")
  direction: string // 방향 (예: "잠실역방면")
}

export interface BusStopSearchResult {
  arsId: string     // 정류소 번호 (5자리)
  stopName: string
  routes: BusRoute[]
}

export const MOCK_BUS_STOP_DATA: BusStopSearchResult[] = [
  {
    arsId: '23294',
    stopName: '송파구민회관',
    routes: [
      { routeNo: '3417', direction: '잠실역방면' },
      { routeNo: '30', direction: '강남역방면' },
      { routeNo: '302', direction: '군자역방면' },
    ],
  },
  {
    arsId: '23283',
    stopName: '잠실역',
    routes: [
      { routeNo: '240', direction: '여의도방면' },
      { routeNo: '3417', direction: '강동구청방면' },
      { routeNo: '9호선환승버스', direction: '개화방면' },
    ],
  },
  {
    arsId: '23270',
    stopName: '잠실나루역',
    routes: [
      { routeNo: '333', direction: '군자역방면' },
      { routeNo: '420', direction: '잠실역방면' },
    ],
  },
  {
    arsId: '22009',
    stopName: '강남역',
    routes: [
      { routeNo: '140', direction: '서울역방면' },
      { routeNo: '360', direction: '여의도방면' },
      { routeNo: '462', direction: '사당역방면' },
    ],
  },
  {
    arsId: '22168',
    stopName: '강남구청',
    routes: [
      { routeNo: '401', direction: '강남역방면' },
      { routeNo: '3220', direction: '서울역방면' },
    ],
  },
]

// 정류장명 부분 검색 함수 (API 키 미설정 시 fallback)
export function searchBusStops(query: string): BusStopSearchResult[] {
  if (!query.trim()) return []
  return MOCK_BUS_STOP_DATA.filter((s) =>
    s.stopName.includes(query.trim())
  )
}
