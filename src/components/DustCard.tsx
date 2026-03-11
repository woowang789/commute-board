'use client'

import useSWR from 'swr'
import { fetchDustAction } from '@/app/actions/dust'
import { REFRESH_INTERVALS } from '@/constants/refreshIntervals'
import { CardSkeleton } from '@/components/ui/CardSkeleton'
import { CardError } from '@/components/ui/CardError'
import { Wind, AlertTriangle, MapPin, X } from 'lucide-react'
import { createErrorHandler, createErrorRetryHandler, getRefreshLabel } from '@/lib/swr'

// "2024-03-05 14:00" → "14:00"
function formatTime(dataTime: string): string {
  return dataTime.split(' ')[1] ?? dataTime
}

const GRADE_COLOR: Record<string, string> = {
  좋음: 'text-green-400',
  보통: 'text-amber-400',
  나쁨: 'text-orange-400',
  매우나쁨: 'text-red-400',
}

function needsMask(grade: string): boolean {
  return grade === '나쁨' || grade === '매우나쁨'
}

// 등급에 따른 카드 테두리 변형 클래스
function getCardVariant(pm10Grade: string, pm25Grade: string): string {
  if (pm10Grade === '매우나쁨' || pm25Grade === '매우나쁨') return 'terminal-card--dust-danger'
  if (pm10Grade === '나쁨' || pm25Grade === '나쁨') return 'terminal-card--dust-warning'
  return 'terminal-card--dust'
}

// 등급별 바 퍼센트 (좋음=25%, 보통=50%, 나쁨=75%, 매우나쁨=100%)
const GRADE_PERCENT: Record<string, number> = {
  좋음: 25,
  보통: 50,
  나쁨: 75,
  매우나쁨: 100,
}

const GRADE_BAR_COLOR: Record<string, string> = {
  좋음: '#22c55e',
  보통: '#f59e0b',
  나쁨: '#f97316',
  매우나쁨: '#ef4444',
}

export function DustCard({ region, onRemove }: { region: string; onRemove?: () => void }) {
  const ctx = { region }
  const { data, error, isLoading, mutate } = useSWR(
    ['dust', region],
    () => fetchDustAction(region),
    {
      refreshInterval: REFRESH_INTERVALS.air,
      onError: createErrorHandler('DustCard', ctx),
      onErrorRetry: createErrorRetryHandler('DustCard', ctx),
    }
  )

  if (isLoading) return <CardSkeleton />
  if (error || !data) return <CardError onRetry={() => mutate()} onRemove={onRemove} />

  const showMask = needsMask(data.pm10Grade) || needsMask(data.pm25Grade)

  const cardVariant = getCardVariant(data.pm10Grade, data.pm25Grade)

  return (
    <div className={`relative terminal-card ${cardVariant} rounded-xl p-5 animate-fade-slide-up group`}>
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
          {getRefreshLabel(REFRESH_INTERVALS.air)}
        </span>
      </div>

      {/* 헤더 */}
      <div className='flex items-center justify-between mb-4'>
        <span className='text-white/65 text-xs uppercase tracking-widest font-semibold'>미세먼지</span>
        <Wind size={14} className='text-cyan-400' />
      </div>

      {/* PM10 */}
      <div className='flex items-end gap-2 mb-1.5'>
        <span
          className={`text-3xl font-bold leading-none ${GRADE_COLOR[data.pm10Grade] ?? 'text-white'}`}
          style={{ fontFamily: 'var(--font-bebas)' }}
        >
          {data.pm10Value}
        </span>
        <div className='pb-0.5 flex flex-col'>
          <span className='text-white/55 text-[10px]'>μg/m³</span>
          <span
            className={`text-xs font-semibold ${GRADE_COLOR[data.pm10Grade] ?? 'text-white'}`}
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          >
            PM10 · {data.pm10Grade}
          </span>
        </div>
      </div>
      {/* PM10 등급 바 */}
      <div className='dust-grade-bar mb-3'>
        <div
          className='dust-grade-bar-fill'
          style={{
            width: `${GRADE_PERCENT[data.pm10Grade] ?? 50}%`,
            background: GRADE_BAR_COLOR[data.pm10Grade] ?? '#f59e0b',
          }}
        />
      </div>

      {/* PM2.5 */}
      <div className='flex items-end gap-2 mb-1.5'>
        <span
          className={`text-3xl font-bold leading-none ${GRADE_COLOR[data.pm25Grade] ?? 'text-white'}`}
          style={{ fontFamily: 'var(--font-bebas)' }}
        >
          {data.pm25Value}
        </span>
        <div className='pb-0.5 flex flex-col'>
          <span className='text-white/55 text-[10px]'>μg/m³</span>
          <span
            className={`text-xs font-semibold ${GRADE_COLOR[data.pm25Grade] ?? 'text-white'}`}
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          >
            PM2.5 · {data.pm25Grade}
          </span>
        </div>
      </div>
      {/* PM2.5 등급 바 */}
      <div className='dust-grade-bar mb-4'>
        <div
          className='dust-grade-bar-fill'
          style={{
            width: `${GRADE_PERCENT[data.pm25Grade] ?? 50}%`,
            background: GRADE_BAR_COLOR[data.pm25Grade] ?? '#f59e0b',
          }}
        />
      </div>

      {/* 마스크 권고 */}
      {showMask && (
        <div className='flex items-center gap-1.5 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2 mb-3'>
          <AlertTriangle size={12} className='text-red-400 shrink-0' />
          <span className='text-red-300 text-xs' style={{ fontFamily: 'var(--font-dm-sans)' }}>
            마스크 착용을 권고합니다
          </span>
        </div>
      )}

      {/* 측정소 */}
      <div className='flex items-center gap-1.5'>
        <MapPin size={11} className='text-white/55' />
        <span className='text-white/55 text-[10px]'>{data.stationName} 측정소</span>
        {data.dataTime && (
          <span className='text-white/35 text-[10px]'>· {formatTime(data.dataTime)}</span>
        )}
      </div>
      {data.hasFlag && (
        <div className='mt-2 text-[10px] text-yellow-400/70'>
          ⚠ 일부 측정값이 점검 중입니다
        </div>
      )}
    </div>
  )
}
