'use client'

import useSWR from 'swr'
import { Train, X } from 'lucide-react'
import { fetchSubwayAction } from '@/app/actions/subway'
import { CardSkeleton } from '@/components/ui/CardSkeleton'
import { CardError } from '@/components/ui/CardError'
import { createErrorHandler, createErrorRetryHandler, getRefreshLabel } from '@/lib/swr'

import type { SubwayTrainArrival } from '@/types'

// arvlMsg2에 시간 정보가 없고 역 기준(번째 전역)인 경우에만 보조 분 표시
function formatArrivalSec(sec: number): string {
  if (sec <= 0) return '곧 도착'
  return `약 ${Math.ceil(sec / 60)}분`
}

function needsSecLabel(arvlMsg2: string): boolean {
  return arvlMsg2.includes('번째 전역') && !arvlMsg2.includes('분') && !arvlMsg2.includes('도착')
}

// trainLineNm에서 방면 정보 추출 (예: "별내행 - 석촌방면" → "석촌방면")
function extractDirection(trainLineNm: string): string {
  if (!trainLineNm) return ''
  const parts = trainLineNm.split(' - ')
  return parts.length > 1 ? parts[1] : trainLineNm
}

// 호선별 공식 색상 (배경/테두리/텍스트)
const LINE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  '1호선':    { bg: 'rgba(0,102,179,0.15)',  border: 'rgba(0,102,179,0.4)',  text: '#1a7fd4' },
  '2호선':    { bg: 'rgba(0,166,90,0.15)',   border: 'rgba(0,166,90,0.4)',   text: '#2ecc71' },
  '3호선':    { bg: 'rgba(255,130,0,0.15)',  border: 'rgba(255,130,0,0.4)',  text: '#f97316' },
  '4호선':    { bg: 'rgba(0,160,220,0.15)',  border: 'rgba(0,160,220,0.4)',  text: '#38bdf8' },
  '5호선':    { bg: 'rgba(148,52,166,0.15)', border: 'rgba(148,52,166,0.4)', text: '#c084fc' },
  '6호선':    { bg: 'rgba(165,79,47,0.15)',  border: 'rgba(165,79,47,0.4)',  text: '#d97706' },
  '7호선':    { bg: 'rgba(82,128,0,0.15)',   border: 'rgba(82,128,0,0.4)',   text: '#84cc16' },
  '8호선':    { bg: 'rgba(224,0,77,0.15)',   border: 'rgba(224,0,77,0.4)',   text: '#f43f5e' },
  '9호선':    { bg: 'rgba(189,156,0,0.15)',  border: 'rgba(189,156,0,0.4)',  text: '#eab308' },
  '수인분당선': { bg: 'rgba(255,208,0,0.15)', border: 'rgba(255,208,0,0.4)',  text: '#fbbf24' },
  '신분당선':  { bg: 'rgba(190,0,45,0.15)',  border: 'rgba(190,0,45,0.4)',   text: '#fb7185' },
  '경의중앙선': { bg: 'rgba(115,195,100,0.15)', border: 'rgba(115,195,100,0.4)', text: '#86efac' },
  '경춘선':   { bg: 'rgba(0,176,185,0.15)',  border: 'rgba(0,176,185,0.4)',  text: '#22d3ee' },
  '공항철도':  { bg: 'rgba(0,122,203,0.15)', border: 'rgba(0,122,203,0.4)',  text: '#60a5fa' },
  'AREX':     { bg: 'rgba(0,122,203,0.15)', border: 'rgba(0,122,203,0.4)',  text: '#60a5fa' },
  'GTX-A':    { bg: 'rgba(151,71,255,0.15)', border: 'rgba(151,71,255,0.4)', text: '#a855f7' },
  '우이신설선': { bg: 'rgba(182,109,65,0.15)', border: 'rgba(182,109,65,0.4)', text: '#fb923c' },
  '서해선':   { bg: 'rgba(0,148,68,0.15)',   border: 'rgba(0,148,68,0.4)',   text: '#4ade80' },
  '경강선':   { bg: 'rgba(0,100,180,0.15)',  border: 'rgba(0,100,180,0.4)',  text: '#60a5fa' },
}

const DEFAULT_LINE_COLOR = { bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.2)', text: '#a78bfa' }

export function SubwayCard({
  subwayEntries,
  refreshInterval,
  onRemove,
}: {
  subwayEntries: Array<{ stationName: string; lineNos: string[] }>
  refreshInterval: number
  onRemove?: () => void
}) {
  const entry = subwayEntries[0]

  const ctx = { stationName: entry?.stationName }
  const { data, error, isLoading, mutate } = useSWR(
    entry ? ['subway', entry.stationName, ...entry.lineNos] : null,
    () => fetchSubwayAction(entry.stationName, entry.lineNos),
    {
      refreshInterval,
      onError: createErrorHandler('SubwayCard', ctx),
      onErrorRetry: createErrorRetryHandler('SubwayCard', ctx),
    }
  )

  if (!entry) {
    return (
      <div className='relative terminal-card terminal-card--subway rounded-xl p-5 animate-fade-slide-up group'>
        {onRemove && (
          <button
            onClick={onRemove}
            className='card-remove-btn absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center text-white/20 hover:text-white/70 hover:bg-white/10 transition-all duration-150 opacity-0 group-hover:opacity-100 z-10'
            aria-label='카드 삭제'
          >
            <X size={11} strokeWidth={2.5} />
          </button>
        )}
        <div className='flex items-center justify-between mb-4'>
          <span className='text-white/65 text-xs uppercase tracking-widest font-semibold' style={{ fontFamily: 'var(--font-dm-sans)' }}>지하철</span>
          <Train size={16} className='text-violet-400/60' />
        </div>
        <p className='text-white/55 text-xs text-center py-4' style={{ fontFamily: 'var(--font-dm-sans)' }}>
          설정에서 지하철역을 추가해주세요
        </p>
      </div>
    )
  }

  if (isLoading) return <CardSkeleton />
  if (error || !data) return <CardError onRetry={() => mutate()} onRemove={onRemove} />

  return (
    <div className='relative terminal-card terminal-card--subway rounded-xl p-5 animate-fade-slide-up group'>
      {/* 삭제 버튼 */}
      {onRemove && (
        <button
          onClick={onRemove}
          className='card-remove-btn absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center text-white/20 hover:text-white/70 hover:bg-white/10 transition-all duration-150 opacity-0 group-hover:opacity-100 z-10'
          aria-label='카드 삭제'
        >
          <X size={11} strokeWidth={2.5} />
        </button>
      )}

      {/* 갱신 배지 */}
      <div className='mb-3'>
        <span className='text-[9px] text-cyan-400/65 tracking-widest uppercase' style={{ fontFamily: 'var(--font-dm-sans)' }}>
          {getRefreshLabel(refreshInterval)}
        </span>
      </div>

      {/* 헤더 + 역명 */}
      <div className='flex items-center justify-between mb-1'>
        <span className='text-white/65 text-xs uppercase tracking-widest font-semibold' style={{ fontFamily: 'var(--font-dm-sans)' }}>지하철</span>
        <Train size={16} className='text-violet-400' />
      </div>
      <div className='flex items-center gap-1.5 mb-4'>
        <span className='text-violet-400 font-bold text-lg' style={{ fontFamily: 'var(--font-dm-sans)' }}>
          {data.stationName}
        </span>
      </div>

      {/* 호선별 도착 정보 */}
      <div className='flex flex-col gap-3'>
        {data.lines.map((line, lineIdx) => {
          const color = LINE_COLORS[line.lineNo] ?? DEFAULT_LINE_COLOR

          const renderDirection = (label: string, trains: SubwayTrainArrival[]) => {
            if (trains.length === 0) {
              return (
                <div className='flex items-start gap-3'>
                  <span
                    className='shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold'
                    style={{ fontFamily: 'var(--font-geist-mono)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }}
                  >
                    {label}
                  </span>
                  <span className='text-white/40 text-xs pt-0.5' style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    정보 없음
                  </span>
                </div>
              )
            }

            const first = trains[0]
            const second = trains[1]
            const direction = extractDirection(first.destination)

            return (
              <div className='flex items-start gap-3'>
                {/* 방향 배지 */}
                <span
                  className='shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold min-w-[1.5rem] text-center'
                  style={{
                    fontFamily: 'var(--font-geist-mono)',
                    background: color.bg,
                    border: `1px solid ${color.border}`,
                    color: color.text,
                  }}
                >
                  {label}
                </span>

                {/* 도착 시간 + 방면 (버스 카드와 동일한 세로 배치) */}
                <div className='flex flex-col gap-0.5 pt-0.5 flex-1 min-w-0'>
                  {/* 첫 번째 열차 */}
                  <div className='flex items-center gap-2'>
                    <span className='text-white/95 text-xs truncate' style={{ fontFamily: 'var(--font-dm-sans)' }}>
                      {first.arrival}
                    </span>
                    {first.arrivalSec !== undefined && first.arrivalSec > 0 && needsSecLabel(first.arrival) && (
                      <span className='text-cyan-400/70 text-[9px] shrink-0' style={{ fontFamily: 'var(--font-geist-mono)' }}>
                        {formatArrivalSec(first.arrivalSec)}
                      </span>
                    )}
                  </div>
                  {/* 두 번째 열차 */}
                  {second && (
                    <span className='text-white/65 text-[11px] truncate' style={{ fontFamily: 'var(--font-dm-sans)' }}>
                      {second.arrival}
                    </span>
                  )}
                  {/* 방면 */}
                  {direction && (
                    <span className='text-white/30 text-[10px] truncate' style={{ fontFamily: 'var(--font-dm-sans)' }}>
                      {direction}
                    </span>
                  )}
                </div>
              </div>
            )
          }

          return (
            <div key={line.lineNo}>
              {/* 호선 배지 */}
              <span
                className='inline-block px-2 py-0.5 rounded text-xs font-bold tracking-wider mb-2.5'
                style={{
                  fontFamily: 'var(--font-geist-mono)',
                  background: color.bg,
                  border: `1px solid ${color.border}`,
                  color: color.text,
                }}
              >
                {line.lineNo}
              </span>

              <div className='flex flex-col gap-2.5'>
                {renderDirection('상행', line.upTrains)}
                {renderDirection('하행', line.downTrains)}
              </div>

              {/* 호선 구분선 */}
              {lineIdx < data.lines.length - 1 && (
                <div className='mt-3 border-t border-white/20' />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
