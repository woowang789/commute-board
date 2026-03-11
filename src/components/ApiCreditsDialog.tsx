'use client'
import { ExternalLink } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface ApiCreditsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const API_SOURCES = [
  {
    name: '기상청 단기예보',
    description: '초단기실황 · 단기예보 조회',
    envKey: 'KMA_API_KEY',
    url: 'https://www.data.go.kr/data/15084084/openapi.do',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    icon: '🌤',
  },
  {
    name: '에어코리아 대기질',
    description: '실시간 미세먼지 · 초미세먼지 정보',
    envKey: 'AIRKOREA_API_KEY',
    url: 'https://www.data.go.kr/data/15073861/openapi.do',
    color: 'text-green-400',
    borderColor: 'border-green-500/30',
    icon: '🌿',
  },
  {
    name: '서울시 버스 정보',
    description: '정류소 검색 · 실시간 버스 도착 정보',
    envKey: 'SEOUL_BUS_API_KEY',
    url: 'https://www.data.go.kr/data/15000303/openapi.do',
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    icon: '🚌',
  },
  {
    name: '서울시 지하철 도착',
    description: '실시간 지하철 도착 정보',
    envKey: 'SEOUL_SUBWAY_API_KEY',
    url: 'https://data.seoul.go.kr/dataList/OA-12764/F/1/datasetView.do',
    color: 'text-violet-400',
    borderColor: 'border-violet-500/30',
    icon: '🚇',
  },
] as const

export function ApiCreditsDialog({ open, onOpenChange }: ApiCreditsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle
            className="text-sm tracking-widest uppercase"
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          >
            API 출처
          </DialogTitle>
          <DialogDescription>
            본 서비스에서 사용 중인 공공 데이터 API 목록입니다
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 flex flex-col gap-3">
          {API_SOURCES.map((api) => (
            <a
              key={api.envKey}
              href={api.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`group flex items-start gap-3 p-3 rounded-xl border ${api.borderColor} bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-200`}
            >
              <span className="text-lg mt-0.5 shrink-0">{api.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-xs font-semibold ${api.color}`}
                    style={{ fontFamily: 'var(--font-dm-sans)' }}
                  >
                    {api.name}
                  </span>
                  <ExternalLink
                    size={10}
                    className="text-white/20 group-hover:text-white/50 transition-colors shrink-0"
                  />
                </div>
                <p
                  className="text-[10px] text-white/40 mt-0.5 leading-relaxed"
                  style={{ fontFamily: 'var(--font-dm-sans)' }}
                >
                  {api.description}
                </p>
                <p
                  className="text-[9px] text-white/20 mt-1 font-mono"
                >
                  {api.envKey}
                </p>
              </div>
            </a>
          ))}

          <p
            className="text-[10px] text-white/25 text-center mt-2 leading-relaxed"
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          >
            공공데이터포털 · 서울 열린데이터광장 제공
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
