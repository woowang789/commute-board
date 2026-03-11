'use client'

import useSWR from 'swr'
import { Bus, MapPin, X } from 'lucide-react'
import { fetchBusAction } from '@/app/actions/bus'
import { CardSkeleton } from '@/components/ui/CardSkeleton'
import { CardError } from '@/components/ui/CardError'
import { createErrorHandler, createErrorRetryHandler, getRefreshLabel } from '@/lib/swr'

// 노선유형별 색상
function getRouteTypeColor(routeType?: string): string {
  switch (routeType) {
    case '3': return 'bg-blue-500/15 border-blue-500/25 text-blue-400'   // 간선
    case '4': return 'bg-green-500/15 border-green-500/25 text-green-400' // 지선
    case '6': return 'bg-red-500/15 border-red-500/25 text-red-400'      // 광역
    case '2': return 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400' // 마을
    case '1': return 'bg-sky-500/15 border-sky-500/25 text-sky-400'      // 공항
    case '5': return 'bg-yellow-500/15 border-yellow-500/25 text-yellow-400' // 순환
    default:  return 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'   // 기본
  }
}

// 혼잡도 라벨
function getCongestionLabel(congestion?: number): { text: string; color: string } | null {
  if (!congestion || congestion === 0) return null
  switch (congestion) {
    case 3: return { text: '여유', color: 'text-green-400' }
    case 4: return { text: '보통', color: 'text-yellow-400' }
    case 5: return { text: '혼잡', color: 'text-red-400' }
    default: return null
  }
}

export function BusCard({
  busEntries,
  refreshInterval,
  onRemove,
}: {
  busEntries: Array<{ arsId?: string; stopName: string; routeNos: string[] }>
  refreshInterval: number
  onRemove?: () => void
}) {
  const ctx = { stops: busEntries.map((e) => e.stopName) }
  const { data, error, isLoading, mutate } = useSWR(
    ['bus', JSON.stringify(busEntries)],
    () => fetchBusAction(busEntries),
    {
      refreshInterval,
      onError: createErrorHandler('BusCard', ctx),
      onErrorRetry: createErrorRetryHandler('BusCard', ctx),
    }
  )

  if (isLoading) return <CardSkeleton />
  if (error || !data) return <CardError onRetry={() => mutate()} onRemove={onRemove} />

  // busEntries가 없는 경우
  if (busEntries.length === 0 || data.length === 0) {
    return (
      <div className='relative terminal-card terminal-card--bus rounded-xl p-5 animate-fade-slide-up group'>
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
          <span className='text-white/65 text-xs uppercase tracking-widest font-semibold' style={{ fontFamily: 'var(--font-dm-sans)' }}>버스</span>
          <Bus size={16} className='text-cyan-400/60' />
        </div>
        <p className='text-white/55 text-xs text-center py-4' style={{ fontFamily: 'var(--font-dm-sans)' }}>
          설정에서 버스 정류장을 추가해주세요
        </p>
      </div>
    )
  }

  return (
    <div className='relative terminal-card terminal-card--bus rounded-xl p-5 animate-fade-slide-up group'>
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

      {/* 헤더 */}
      <div className='flex items-center justify-between mb-4'>
        <span className='text-white/65 text-xs uppercase tracking-widest font-semibold' style={{ fontFamily: 'var(--font-dm-sans)' }}>버스</span>
        <Bus size={16} className='text-cyan-400' />
      </div>

      {/* 정류장별 도착 정보 */}
      <div className='flex flex-col gap-5'>
        {data.map((stop, stopIdx) => (
          <div key={stop.arsId || stop.stopName}>
            {/* 정류장명 */}
            <div className='flex items-center gap-1.5 mb-3'>
              <MapPin size={10} className='text-amber-400/70' />
              <span
                className='text-amber-400 text-sm font-semibold tracking-wide'
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                {stop.stopName}
              </span>
              {stop.arsId && (
                <span className='text-white/20 text-[10px] ml-1' style={{ fontFamily: 'var(--font-geist-mono)' }}>
                  {stop.arsId}
                </span>
              )}
            </div>

            {/* 버스 노선 목록 */}
            <div className='flex flex-col gap-2.5'>
              {stop.routes.map((route) => {
                const congestion1 = getCongestionLabel(route.congestion1)
                return (
                  <div key={route.routeNo} className='flex items-start gap-3'>
                    {/* 버스 번호 배지 */}
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded border text-xs font-bold tracking-wider min-w-[3rem] text-center ${getRouteTypeColor(route.routeType)}`}
                      style={{ fontFamily: 'var(--font-geist-mono)' }}
                    >
                      {route.routeNo}
                    </span>

                    {/* 도착 시간 + 방향 */}
                    <div className='flex flex-col gap-0.5 pt-0.5 flex-1'>
                      <div className='flex items-center gap-2'>
                        <span className='text-white/95 text-xs' style={{ fontFamily: 'var(--font-dm-sans)' }}>
                          {route.arrMsg1}
                        </span>
                        {congestion1 && (
                          <span className={`text-[9px] ${congestion1.color}`} style={{ fontFamily: 'var(--font-dm-sans)' }}>
                            {congestion1.text}
                          </span>
                        )}
                      </div>
                      <span className='text-white/65 text-[11px]' style={{ fontFamily: 'var(--font-dm-sans)' }}>
                        {route.arrMsg2}
                      </span>
                      {route.direction && (
                        <span className='text-white/30 text-[10px]' style={{ fontFamily: 'var(--font-dm-sans)' }}>
                          {route.direction}방면
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 정류장 구분선 */}
            {stopIdx < data.length - 1 && (
              <div className='mt-4 border-t border-white/20' />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
