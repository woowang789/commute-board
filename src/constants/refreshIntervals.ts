export const REFRESH_INTERVALS = {
  weather: 10 * 60 * 1000, // 초단기실황 갱신 주기 (10분)
  air: 10 * 60 * 1000,
  bus: 30 * 1000,
  subway: 30 * 1000,
} as const
