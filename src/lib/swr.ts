import { logger } from '@/lib/logger'

// SWR 공통 재시도 핸들러 (최대 3회, 5초 간격)
export function createErrorRetryHandler(cardName: string, context: Record<string, unknown>) {
  return (
    err: unknown,
    _key: string,
    _cfg: unknown,
    retry: (o: { retryCount: number }) => void,
    { retryCount }: { retryCount: number }
  ) => {
    if (retryCount >= 3) {
      logger.error('SWR', `${cardName} 최대 재시도 초과 (3회)`, {
        ...context,
        error: err instanceof Error ? err.message : String(err),
      })
      return
    }
    logger.info('SWR', `${cardName} 재시도 (${retryCount + 1}/3)`, context)
    setTimeout(() => retry({ retryCount }), 5000)
  }
}

// SWR 공통 에러 핸들러
export function createErrorHandler(cardName: string, context: Record<string, unknown>) {
  return (err: unknown) => {
    logger.warn('SWR', `${cardName} 데이터 페칭 실패`, {
      ...context,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}

// 갱신 주기 라벨 (30초 → "30초마다 갱신", 10분 → "10분마다 갱신")
export function getRefreshLabel(ms: number): string {
  if (ms < 60000) return `${ms / 1000}초마다 갱신`
  return `${ms / 60000}분마다 갱신`
}
