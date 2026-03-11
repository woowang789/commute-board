'use client'

import useSWR from 'swr'
import { fetchWeatherAction } from '@/app/actions/weather'
import { REFRESH_INTERVALS } from '@/constants/refreshIntervals'
import { getWeatherIcon } from '@/lib/weatherIcon'
import { CardSkeleton } from '@/components/ui/CardSkeleton'
import { CardError } from '@/components/ui/CardError'
import { Wind, Thermometer, Droplets, Umbrella, MapPin, X } from 'lucide-react'
import { createErrorHandler, createErrorRetryHandler, getRefreshLabel } from '@/lib/swr'

export function WeatherCard({ region, onRemove }: { region: string; onRemove?: () => void }) {
  const ctx = { region }
  const { data, error, isLoading, mutate } = useSWR(
    ['weather', region],
    () => fetchWeatherAction(region),
    {
      refreshInterval: REFRESH_INTERVALS.weather,
      onError: createErrorHandler('WeatherCard', ctx),
      onErrorRetry: createErrorRetryHandler('WeatherCard', ctx),
    }
  )

  if (isLoading) return <CardSkeleton />
  if (error || !data) return <CardError onRetry={() => mutate()} onRemove={onRemove} />

  const { icon: Icon, label: skyLabel, colorClass } = getWeatherIcon(data.pty, data.sky)

  return (
    <div className='relative terminal-card rounded-xl p-5 animate-fade-slide-up group'>
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
          {getRefreshLabel(REFRESH_INTERVALS.weather)}
        </span>
      </div>

      {/* 헤더: 날씨 레이블 + 하늘상태 아이콘 */}
      <div className='flex items-center justify-between mb-4'>
        <span className='text-white/65 text-xs uppercase tracking-widest font-semibold'>날씨</span>
        <div className={`flex items-center gap-1.5 ${colorClass}`}>
          <Icon size={16} />
          <span className='text-xs font-medium'>{skyLabel}</span>
        </div>
      </div>

      {/* 현재 기온 */}
      <div className='flex items-end gap-3 mb-4'>
        <span
          className='text-5xl font-bold leading-none text-amber-400'
          style={{ fontFamily: 'var(--font-bebas)' }}
        >
          {data.temp}°
        </span>
        <div className='flex flex-col pb-1 gap-0.5'>
          <span className='text-white/60 text-xs' style={{ fontFamily: 'var(--font-dm-sans)' }}>C</span>
          {/* 최저/최고기온 */}
          {(data.tempMin != null || data.tempMax != null) && (
            <span className='text-white/45 text-[10px] whitespace-nowrap' style={{ fontFamily: 'var(--font-dm-sans)' }}>
              {data.tempMin != null && `↓${data.tempMin}°`}
              {data.tempMin != null && data.tempMax != null && ' '}
              {data.tempMax != null && `↑${data.tempMax}°`}
            </span>
          )}
        </div>
      </div>

      {/* 상세 정보 */}
      <div className='flex flex-col gap-2'>
        <div className='flex items-center gap-2'>
          <Thermometer size={14} className='text-cyan-400' />
          <span className='text-white/60 text-xs' style={{ fontFamily: 'var(--font-dm-sans)' }}>
            체감
          </span>
          <span className='text-white/90 text-xs'>{data.feelsLike}°C</span>
        </div>
        <div className='flex items-center gap-2'>
          <Wind size={14} className='text-cyan-400' />
          <span className='text-white/60 text-xs' style={{ fontFamily: 'var(--font-dm-sans)' }}>
            풍속
          </span>
          <span className='text-white/90 text-xs'>{data.windSpeed} m/s</span>
        </div>
        <div className='flex items-center gap-2'>
          <Droplets size={14} className='text-cyan-400' />
          <span className='text-white/60 text-xs' style={{ fontFamily: 'var(--font-dm-sans)' }}>
            습도
          </span>
          <span className='text-white/90 text-xs'>{data.humidity}%</span>
        </div>
        <div className='flex items-center gap-2'>
          <Umbrella size={14} className='text-cyan-400' />
          <span className='text-white/60 text-xs' style={{ fontFamily: 'var(--font-dm-sans)' }}>
            강수확률
          </span>
          <span className='text-white/90 text-xs'>{data.pop}%</span>
        </div>
      </div>

      {/* 지역명 */}
      <div className='flex items-center gap-1.5 mt-3'>
        <MapPin size={11} className='text-white/55' />
        <span className='text-white/55 text-[10px]'>{region}</span>
      </div>
    </div>
  )
}
