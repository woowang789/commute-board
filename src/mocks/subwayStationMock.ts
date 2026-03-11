// 지하철역 검색 함수
// 추후 실제 API로 교체 시 searchSubwayStations 함수만 수정
import { SUBWAY_STATIONS } from "@/constants/subwayStations"

export interface SubwayLine {
  lineNo: string // 호선 (예: "2호선")
}

export interface SubwayStationSearchResult {
  stationName: string
  lines: SubwayLine[]
}

// 역명 부분 검색 함수 (추후 실제 API로 교체 시 이 함수만 수정)
export function searchSubwayStations(query: string): SubwayStationSearchResult[] {
  if (!query.trim()) return []
  const q = query.trim()
  return SUBWAY_STATIONS
    .filter((s) => s.stationName.includes(q))
    .map((s) => ({
      stationName: s.stationName,
      lines: s.lines.map((l) => ({ lineNo: l })),
    }))
}
