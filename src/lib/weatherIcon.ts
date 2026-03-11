import { Sun, Cloud, CloudSun, CloudRain, CloudSnow } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface WeatherIconInfo {
  icon: LucideIcon
  label: string
  colorClass: string
}

// 강수형태(PTY) 코드 → 아이콘 (강수 있을 때 우선 적용)
const PTY_MAP: Record<string, WeatherIconInfo> = {
  '1': { icon: CloudRain, label: '비', colorClass: 'text-cyan-400' },
  '2': { icon: CloudRain, label: '비/눈', colorClass: 'text-cyan-400' },
  '3': { icon: CloudSnow, label: '눈', colorClass: 'text-blue-300' },
  '4': { icon: CloudRain, label: '소나기', colorClass: 'text-cyan-400' },
  '5': { icon: CloudRain, label: '빗방울', colorClass: 'text-cyan-400' },
  '6': { icon: CloudRain, label: '빗방울/눈날림', colorClass: 'text-cyan-400' },
  '7': { icon: CloudSnow, label: '눈날림', colorClass: 'text-blue-300' },
}

// 하늘상태(SKY) 코드 → 아이콘 (PTY=0 강수없을 때 적용)
const SKY_MAP: Record<string, WeatherIconInfo> = {
  '1': { icon: Sun, label: '맑음', colorClass: 'text-amber-400' },
  '3': { icon: CloudSun, label: '구름많음', colorClass: 'text-white/70' },
  '4': { icon: Cloud, label: '흐림', colorClass: 'text-white/50' },
}

// PTY + SKY 조합으로 날씨 아이콘 결정
// PTY가 0(강수없음)이면 SKY로 판단, 그 외에는 PTY 우선
export function getWeatherIcon(pty: string, sky: string = '1'): WeatherIconInfo {
  if (pty !== '0') {
    return PTY_MAP[pty] ?? SKY_MAP['1']
  }
  return SKY_MAP[sky] ?? SKY_MAP['1']
}
