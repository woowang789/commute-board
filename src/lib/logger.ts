type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'
type LogCategory = 'API' | 'STORAGE' | 'SWR' | 'UI' | 'PERF'

interface LogEntry {
  timestamp: string
  level: LogLevel
  category: LogCategory
  message: string
  userId?: string
  data?: Record<string, unknown>
  durationMs?: number
}

// 환경 감지 (서버/클라이언트 공통)
const isDev = process.env.NODE_ENV === 'development'

// 레벨 우선순위
const LEVEL_PRIORITY: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
}

// 프로덕션에서는 WARN 이상만 출력
const MIN_LEVEL: LogLevel = isDev ? 'DEBUG' : 'WARN'

// 개발 환경 카테고리 뱃지
const CATEGORY_BADGE: Record<LogCategory, string> = {
  API: '🌐 API',
  STORAGE: '💾 STORAGE',
  SWR: '🔄 SWR',
  UI: '🖱️ UI',
  PERF: '⏱️ PERF',
}

// 사용자 식별자 (클라이언트 측에서 setUserId()로 주입)
let currentUserId: string | null = null

export function setUserId(id: string): void {
  currentUserId = id
}

// API 키 등 민감한 파라미터 마스킹
export function maskUrl(url: string): string {
  return url.replace(
    /([?&])(serviceKey|apiKey|token|key)=([^&]+)/gi,
    '$1$2=***MASKED***'
  )
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[MIN_LEVEL]
}

function createEntry(
  level: LogLevel,
  category: LogCategory,
  message: string,
  data?: Record<string, unknown>
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    ...(currentUserId ? { userId: currentUserId } : {}),
    ...(data ? { data } : {}),
  }
}

function output(entry: LogEntry): void {
  if (!shouldLog(entry.level)) return

  if (isDev) {
    const badge = CATEGORY_BADGE[entry.category]
    const uidPart = entry.userId ? ` [uid:${entry.userId}]` : ''
    const prefix = `[${entry.timestamp}]${uidPart} ${badge}`
    const args = entry.data ? [prefix, entry.message, entry.data] : [prefix, entry.message]

    switch (entry.level) {
      case 'DEBUG': console.debug(...args); break
      case 'INFO':  console.info(...args); break
      case 'WARN':  console.warn(...args); break
      case 'ERROR': console.error(...args); break
    }
  } else {
    // 프로덕션: JSON 한 줄 출력
    const line = JSON.stringify({
      ts: entry.timestamp,
      lvl: entry.level,
      cat: entry.category,
      msg: entry.message,
      ...(entry.userId ? { uid: entry.userId } : {}),
      ...(entry.data ? { data: entry.data } : {}),
      ...(entry.durationMs != null ? { durationMs: entry.durationMs } : {}),
    })
    if (entry.level === 'ERROR') console.error(line)
    else console.warn(line)
  }

}

function debug(category: LogCategory, message: string, data?: Record<string, unknown>): void {
  output(createEntry('DEBUG', category, message, data))
}

function info(category: LogCategory, message: string, data?: Record<string, unknown>): void {
  output(createEntry('INFO', category, message, data))
}

function warn(category: LogCategory, message: string, data?: Record<string, unknown>): void {
  output(createEntry('WARN', category, message, data))
}

function error(category: LogCategory, message: string, data?: Record<string, unknown>): void {
  output(createEntry('ERROR', category, message, data))
}

// 성능 타이머: startTimer() 호출 후 반환된 함수를 호출하면 경과 ms 반환
function startTimer(): () => number {
  const start = typeof performance !== 'undefined' ? performance.now() : Date.now()
  return () => Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - start)
}

export const logger = {
  debug,
  info,
  warn,
  error,
  startTimer,
  maskUrl,
  setUserId,
}
