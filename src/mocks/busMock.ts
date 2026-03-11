import { type BusStopArrivalData } from '@/types'

const ARRIVAL_TIMES = ['2분 후 도착', '5분 후 도착', '8분 후 도착', '12분 후 도착', '18분 후 도착', '23분 후 도착', '30분 후 도착']

// 정류장명 + 버스 번호 조합으로 고정된 가상 값 생성
function pseudoHash(s: string): number {
  let h = 0
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) & 0xffff
  return h
}

export function getMockBusData(
  busEntries: Array<{ arsId?: string; stopName: string; routeNos: string[] }>
): BusStopArrivalData[] {
  return busEntries.map((entry) => ({
    arsId: entry.arsId ?? '',
    stopName: entry.stopName,
    routes: entry.routeNos.map((routeNo) => {
      const h = pseudoHash(entry.stopName + routeNo)
      return {
        routeNo,
        arrMsg1: ARRIVAL_TIMES[h % ARRIVAL_TIMES.length],
        arrMsg2: ARRIVAL_TIMES[(h + 3) % ARRIVAL_TIMES.length],
      }
    }),
  }))
}
