// 체감온도 계산 유틸 (캐나다 환경부 Wind Chill 공식 기반)
export function calcWindChill(temp: number, windSpeedMs: number): number {
  const v = windSpeedMs * 3.6 // m/s → km/h 변환
  // 체감온도 공식 유효 범위: 풍속 4.8km/h 이상, 기온 10°C 이하
  if (v < 4.8 || temp > 10) return Math.round(temp * 10) / 10
  const result =
    13.12 +
    0.6215 * temp -
    11.37 * Math.pow(v, 0.16) +
    0.3965 * temp * Math.pow(v, 0.16)
  return Math.round(result * 10) / 10
}
