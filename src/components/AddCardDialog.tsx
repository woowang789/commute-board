'use client'
import { useState } from 'react'
import { Cloud, Wind, Train, Bus, MapPin, Search, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { REGION_NAMES_FULL } from '@/constants/regionGridFull'
import { SEOUL_DISTRICT_NAMES } from '@/constants/districtDongMap'
import { cn } from '@/lib/utils'
import { searchBusStops, type BusStopSearchResult } from '@/mocks/busStopMock'
import { searchSubwayStations, type SubwayStationSearchResult } from '@/mocks/subwayStationMock'
import { searchBusStopsAction, getRoutesByStationAction, getDirectionHintAction, getRouteDirectionsAction } from '@/app/actions/bus'
import type { BusStopSearchItem, BusRouteByStation } from '@/types'
import type { CardType } from '@/types/card'
import { logger } from '@/lib/logger'

type Step = 'type' | 'config'

type BusEntry = { arsId: string; stopName: string; routeNos: string[] }
type SubwayEntry = { stationName: string; lineNos: string[] }

// ── 카드 타입 선택 스텝 ───────────────────────────────────────
function TypeStep({ onSelect }: { onSelect: (type: CardType) => void }) {
  return (
    <div className="px-6 pb-6 space-y-3">
      {/* 날씨 */}
      <button
        onClick={() => onSelect('weather')}
        className={cn(
          'w-full flex items-center gap-4 p-4 rounded-xl border',
          'border-white/10 bg-black/30 hover:border-amber-500/40 hover:bg-amber-500/5',
          'transition-all duration-150 group text-left'
        )}
      >
        <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
          <Cloud size={20} className="text-sky-400" />
        </div>
        <div>
          <p className="text-white/80 text-sm font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            날씨
          </p>
          <p className="text-white/30 text-xs mt-0.5" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            기온 · 체감온도 · 강수
          </p>
        </div>
      </button>

      {/* 미세먼지 */}
      <button
        onClick={() => onSelect('dust')}
        className={cn(
          'w-full flex items-center gap-4 p-4 rounded-xl border',
          'border-white/10 bg-black/30 hover:border-amber-500/40 hover:bg-amber-500/5',
          'transition-all duration-150 group text-left'
        )}
      >
        <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
          <Wind size={20} className="text-green-400" />
        </div>
        <div>
          <p className="text-white/80 text-sm font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            미세먼지
          </p>
          <p className="text-white/30 text-xs mt-0.5" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            PM10 · PM2.5 · 마스크 권고
          </p>
        </div>
      </button>

      {/* 대중교통 */}
      <button
        onClick={() => onSelect('transit')}
        className={cn(
          'w-full flex items-center gap-4 p-4 rounded-xl border',
          'border-white/10 bg-black/30 hover:border-amber-500/40 hover:bg-amber-500/5',
          'transition-all duration-150 group text-left'
        )}
      >
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
          <Train size={20} className="text-amber-400" />
        </div>
        <div>
          <p className="text-white/80 text-sm font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            대중교통
          </p>
          <p className="text-white/30 text-xs mt-0.5" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            버스 · 지하철 도착 정보
          </p>
        </div>
      </button>
    </div>
  )
}

// ── 날씨/미세먼지 설정 스텝 ───────────────────────────────────
function SimpleConfigStep({
  type,
  onBack,
  onSave,
}: {
  type: 'weather' | 'dust'
  onBack: () => void
  onSave: (region: string) => void
}) {
  const [region, setRegion] = useState('')
  const [regionQuery, setRegionQuery] = useState('')
  const [regionResults, setRegionResults] = useState<string[]>([])

  function handleRegionQueryChange(query: string) {
    setRegionQuery(query)
    const trimmed = query.trim()
    const minLen = type === 'dust' ? 1 : 2
    if (trimmed.length >= minLen) {
      const source = type === 'dust' ? SEOUL_DISTRICT_NAMES : REGION_NAMES_FULL
      setRegionResults(source.filter((name) => name.includes(trimmed)).slice(0, 10))
    } else {
      setRegionResults([])
    }
    // 검색어 변경 시 선택 초기화
    if (region && query !== region) setRegion('')
  }

  function handleRegionSelect(name: string) {
    setRegion(name)
    setRegionQuery(name)
    setRegionResults([])
  }

  return (
    <div className="px-6 pb-6 space-y-5">
      {/* 지역 검색 */}
      <div className="space-y-2">
        <p className="text-[10px] text-white/30 uppercase tracking-widest" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          지역
        </p>
        {type === 'dust' && (
          <p className="text-[10px] text-amber-400/60" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            현재 서울특별시 25개 자치구만 지원합니다
          </p>
        )}
        <input
          type="text"
          value={regionQuery}
          onChange={(e) => handleRegionQueryChange(e.target.value)}
          placeholder={type === 'dust' ? '자치구명을 입력하세요 (예: 영등포구)' : '지역명을 입력하세요 (예: 서울특별시 영등포구)'}
          className="w-full h-10 px-3 rounded-xl text-sm text-white/80 bg-black/50 border border-amber-500/20 placeholder:text-white/20 outline-none focus:border-amber-500/60 transition-all"
          style={{ fontFamily: 'var(--font-dm-sans)' }}
        />
        {/* 검색 결과 */}
        {regionResults.length > 0 && (
          <div className="space-y-1">
            {regionResults.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => handleRegionSelect(name)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-sm text-left transition-all',
                  region === name
                    ? 'border-amber-500/40 bg-amber-500/5 text-amber-300'
                    : 'border-white/8 bg-black/20 text-white/60 hover:border-white/20 hover:text-white/80'
                )}
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                <MapPin size={11} className={cn(region === name ? 'text-amber-400' : 'text-white/30')} />
                {name}
                {region === name && (
                  <span className="ml-auto w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                    <Check size={7} strokeWidth={3} className="text-black" />
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 버튼 영역 */}
      <div className="flex gap-3 pt-1">
        <button
          onClick={onBack}
          className="flex-1 h-11 rounded-xl border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20 transition-all text-sm"
          style={{ fontFamily: 'var(--font-dm-sans)' }}
        >
          이전
        </button>
        <button
          onClick={() => region && onSave(region)}
          disabled={!region}
          className={cn(
            'flex-[2] h-11 rounded-xl text-sm font-semibold tracking-wide transition-all duration-150',
            region
              ? 'shimmer-btn text-black'
              : 'bg-white/5 border border-white/8 text-white/20 cursor-not-allowed'
          )}
          style={{ fontFamily: 'var(--font-dm-sans)' }}
        >
          저장
        </button>
      </div>
    </div>
  )
}

// ── 대중교통 설정 스텝 ────────────────────────────────────────
function TransitConfigStep({
  onBack,
  onSave,
}: {
  onBack: () => void
  onSave: (config: {
    transportTypes: ('bus' | 'subway')[]
    busEntries: BusEntry[]
    subwayEntries: SubwayEntry[]
  }) => void
}) {
  const [activeType, setActiveType] = useState<'bus' | 'subway' | null>(null)

  // 버스 관련 상태
  const [busQuery, setBusQuery] = useState('')
  const [busResults, setBusResults] = useState<Array<{ arsId: string; stopName: string; directionHint?: string }>>([])
  const [busSearched, setBusSearched] = useState(false)
  const [busSearching, setBusSearching] = useState(false)
  const [selectedStop, setSelectedStop] = useState<{ arsId: string; stopName: string } | null>(null)
  const [stopRoutes, setStopRoutes] = useState<BusRouteByStation[]>([])
  const [routesLoading, setRoutesLoading] = useState(false)
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([])
  const [routeDirections, setRouteDirections] = useState<Record<string, string>>({})

  // 지하철 관련 상태
  const [subwayQuery, setSubwayQuery] = useState('')
  const [subwayResults, setSubwayResults] = useState<SubwayStationSearchResult[]>([])
  const [selectedStation, setSelectedStation] = useState<SubwayStationSearchResult | null>(null)
  const [selectedLines, setSelectedLines] = useState<string[]>([])

  // 교통수단 전환 시 이전 선택 초기화
  function handleTypeSelect(type: 'bus' | 'subway') {
    setActiveType((prev) => (prev === type ? null : type))
    setBusQuery(''); setBusResults([]); setBusSearched(false); setBusSearching(false)
    setSelectedStop(null); setStopRoutes([]); setRoutesLoading(false); setSelectedRoutes([]); setRouteDirections({})
    setSubwayQuery(''); setSubwayResults([])
    setSelectedStation(null); setSelectedLines([])
  }

  async function handleBusSearch() {
    if (!busQuery.trim()) return
    setBusSearching(true)
    setBusSearched(false)
    setSelectedStop(null)
    setStopRoutes([])
    setSelectedRoutes([])

    let results: Array<{ arsId: string; stopName: string }> = []

    try {
      // 실제 API 먼저 시도
      const apiResults = await searchBusStopsAction(busQuery.trim())
      if (apiResults.length > 0) {
        results = apiResults.map((r: BusStopSearchItem) => ({
          arsId: r.arsId,
          stopName: r.stNm,
        }))
      } else {
        const mockResults = searchBusStops(busQuery)
        results = mockResults.map((r: BusStopSearchResult) => ({
          arsId: r.arsId,
          stopName: r.stopName,
        }))
      }
    } catch {
      const mockResults = searchBusStops(busQuery)
      results = mockResults.map((r: BusStopSearchResult) => ({
        arsId: r.arsId,
        stopName: r.stopName,
      }))
    }

    // 먼저 결과를 표시 (방향 힌트 없이)
    setBusResults(results)
    setBusSearched(true)
    setBusSearching(false)

    // 동일 이름 정류소가 있으면 방향 힌트를 병렬 조회 (adirection 기반)
    const hasDuplicateNames = results.some((r, i) =>
      results.some((r2, j) => i !== j && r.stopName === r2.stopName)
    )
    if (hasDuplicateNames && results.length <= 10) {
      const hints = await Promise.all(
        results.map(async (r) => {
          const hint = await getDirectionHintAction(r.arsId)
          return { arsId: r.arsId, hint }
        })
      )
      setBusResults((prev) =>
        prev.map((r) => ({
          ...r,
          directionHint: hints.find((h) => h.arsId === r.arsId)?.hint || undefined,
        }))
      )
    }
  }

  function applyMockRoutes(stopName: string) {
    const mockStop = searchBusStops(stopName).find((s) => s.stopName === stopName)
    if (mockStop) {
      setStopRoutes(mockStop.routes.map((r) => ({
        busRouteId: '',
        busRouteNm: r.routeNo,
        busRouteAbrv: r.routeNo,
        busRouteType: '4',
        term: '',
        nextBus: '',
        stBegin: '',
        stEnd: r.direction.replace(/방면$/, ''),
      })))
    }
  }

  async function handleStopSelect(stop: { arsId: string; stopName: string }) {
    const isSelected = selectedStop?.arsId === stop.arsId
    if (isSelected) {
      setSelectedStop(null)
      setStopRoutes([])
      setSelectedRoutes([])
      return
    }

    setSelectedStop(stop)
    setSelectedRoutes([])
    setRouteDirections({})
    setRoutesLoading(true)

    try {
      // 실제 API로 경유 노선 + 방향 정보 병렬 조회
      const [routes, directions] = await Promise.all([
        getRoutesByStationAction(stop.arsId),
        getRouteDirectionsAction(stop.arsId),
      ])
      if (routes.length > 0) {
        setStopRoutes(routes)
        setRouteDirections(directions)
      } else {
        applyMockRoutes(stop.stopName)
      }
    } catch {
      applyMockRoutes(stop.stopName)
    }

    setRoutesLoading(false)
  }

  function handleSubwayQueryChange(query: string) {
    setSubwayQuery(query)
    if (query.trim().length >= 2) {
      setSubwayResults(searchSubwayStations(query.trim()))
    } else {
      setSubwayResults([])
    }
    if (selectedStation && query !== selectedStation.stationName) {
      setSelectedStation(null)
      setSelectedLines([])
    }
  }

  function handleSave() {
    if (activeType === 'bus' && selectedStop && selectedRoutes.length > 0) {
      onSave({
        transportTypes: ['bus'],
        busEntries: [{ arsId: selectedStop.arsId, stopName: selectedStop.stopName, routeNos: selectedRoutes }],
        subwayEntries: [],
      })
    } else if (activeType === 'subway' && selectedStation && selectedLines.length > 0) {
      onSave({
        transportTypes: ['subway'],
        busEntries: [],
        subwayEntries: [{ stationName: selectedStation.stationName, lineNos: selectedLines }],
      })
    }
  }

  const canSave =
    (activeType === 'bus' && !!selectedStop && selectedRoutes.length > 0) ||
    (activeType === 'subway' && !!selectedStation && selectedLines.length > 0)

  return (
    <div className="px-6 pb-6 space-y-5">
      {/* 교통수단 토글 */}
      <div className="space-y-2">
        <p className="text-[10px] text-white/30 uppercase tracking-widest" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          교통수단
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleTypeSelect('bus')}
            className={cn(
              'relative flex flex-col items-center justify-center gap-2 py-4 rounded-xl border transition-all duration-200',
              activeType === 'bus' ? 'transport-card-active' : 'bg-black/30 border-white/8 hover:border-white/20'
            )}
          >
            {activeType === 'bus' && (
              <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                <Check size={8} strokeWidth={3} className="text-black" />
              </span>
            )}
            <Bus size={22} className={cn(activeType === 'bus' ? 'text-amber-400' : 'text-white/30')} />
            <span className={cn('text-xs font-medium', activeType === 'bus' ? 'text-amber-300' : 'text-white/40')} style={{ fontFamily: 'var(--font-dm-sans)' }}>
              버스
            </span>
          </button>
          <button
            type="button"
            onClick={() => handleTypeSelect('subway')}
            className={cn(
              'relative flex flex-col items-center justify-center gap-2 py-4 rounded-xl border transition-all duration-200',
              activeType === 'subway' ? 'transport-card-active' : 'bg-black/30 border-white/8 hover:border-white/20'
            )}
          >
            {activeType === 'subway' && (
              <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                <Check size={8} strokeWidth={3} className="text-black" />
              </span>
            )}
            <Train size={22} className={cn(activeType === 'subway' ? 'text-amber-400' : 'text-white/30')} />
            <span className={cn('text-xs font-medium', activeType === 'subway' ? 'text-amber-300' : 'text-white/40')} style={{ fontFamily: 'var(--font-dm-sans)' }}>
              지하철
            </span>
          </button>
        </div>
      </div>

      {/* 버스 정류장 섹션 */}
      {activeType === 'bus' && (
        <div className="terminal-card rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <MapPin size={12} className="text-amber-400" />
            <span className="text-xs font-semibold tracking-widest uppercase text-amber-400/80" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              Bus Stop
            </span>
          </div>

          {/* 버스 검색 */}
          <div className="flex gap-2">
            <input
              type="text"
              value={busQuery}
              onChange={(e) => setBusQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleBusSearch() } }}
              placeholder="정류장 이름 입력"
              className="flex-1 h-10 px-3 rounded-xl text-sm text-white/80 bg-black/50 border border-amber-500/20 placeholder:text-white/20 outline-none focus:border-amber-500/60 transition-all"
              style={{ fontFamily: 'var(--font-dm-sans)' }}
            />
            <button
              type="button"
              onClick={handleBusSearch}
              className="h-10 px-3 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 flex items-center gap-1.5 transition-all"
            >
              <Search size={13} />
              <span className="text-xs font-semibold" style={{ fontFamily: 'var(--font-dm-sans)' }}>검색</span>
            </button>
          </div>

          {/* 버스 검색 중 */}
          {busSearching && (
            <p className="text-white/30 text-xs text-center py-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>검색 중...</p>
          )}

          {/* 버스 검색 결과 */}
          {busSearched && !busSearching && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {busResults.length === 0 ? (
                <p className="text-white/30 text-xs text-center py-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>검색 결과가 없습니다</p>
              ) : (
                busResults.map((stop) => {
                  const isSelected = selectedStop?.arsId === stop.arsId
                  return (
                    <div key={stop.arsId} className={cn('rounded-xl border p-3 space-y-2 transition-all', isSelected ? 'border-amber-500/40 bg-amber-500/5' : 'border-white/8 bg-black/20')}>
                      <button type="button" onClick={() => handleStopSelect(stop)} className="flex items-center gap-2 w-full text-left">
                        <MapPin size={11} className={cn(isSelected ? 'text-amber-400' : 'text-white/30')} />
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn('text-sm font-medium', isSelected ? 'text-amber-300' : 'text-white/60')} style={{ fontFamily: 'var(--font-dm-sans)' }}>{stop.stopName}</span>
                            <span className={cn('text-[10px] shrink-0', isSelected ? 'text-amber-400/60' : 'text-white/25')} style={{ fontFamily: 'var(--font-geist-mono)' }}>{stop.arsId}</span>
                          </div>
                          {stop.directionHint && (
                            <span className="text-[10px] text-cyan-400/60 truncate" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                              {stop.directionHint}
                            </span>
                          )}
                        </div>
                        {isSelected && (
                          <span className="ml-auto w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                            <Check size={7} strokeWidth={3} className="text-black" />
                          </span>
                        )}
                      </button>
                      {isSelected && routesLoading && (
                        <p className="text-white/30 text-xs py-1" style={{ fontFamily: 'var(--font-dm-sans)' }}>노선 조회 중...</p>
                      )}
                      {isSelected && !routesLoading && stopRoutes.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {stopRoutes.map((route) => {
                            const routeNo = route.busRouteAbrv || route.busRouteNm
                            const isRouteSelected = selectedRoutes.includes(routeNo)
                            return (
                              <button
                                key={route.busRouteId || routeNo}
                                type="button"
                                onClick={() => setSelectedRoutes((prev) => prev.includes(routeNo) ? prev.filter((r) => r !== routeNo) : [...prev, routeNo])}
                                className={cn('relative flex flex-col items-start gap-0.5 px-2.5 py-1.5 rounded-xl border transition-all', isRouteSelected ? 'transport-card-active' : 'bg-black/30 border-white/8 hover:border-white/20')}
                              >
                                {isRouteSelected && (
                                  <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-amber-500 flex items-center justify-center">
                                    <Check size={6} strokeWidth={3} className="text-black" />
                                  </span>
                                )}
                                <span className={cn('text-xs font-bold', isRouteSelected ? 'text-amber-300' : 'text-white/50')} style={{ fontFamily: 'var(--font-dm-sans)' }}>{routeNo}</span>
                                <span className={cn('text-[10px]', isRouteSelected ? 'text-amber-400/70' : 'text-white/25')} style={{ fontFamily: 'var(--font-dm-sans)' }}>
                                  {(routeDirections[routeNo] || route.stEnd) ? `${routeDirections[routeNo] || route.stEnd}방면` : ''}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* 지하철역 섹션 */}
      {activeType === 'subway' && (
        <div className="terminal-card rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Train size={12} className="text-amber-400" />
            <span className="text-xs font-semibold tracking-widest uppercase text-amber-400/80" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              Subway Station
            </span>
          </div>

          {/* 지하철 검색 */}
          <input
            type="text"
            value={subwayQuery}
            onChange={(e) => handleSubwayQueryChange(e.target.value)}
            placeholder="역 이름 입력"
            className="w-full h-10 px-3 rounded-xl text-sm text-white/80 bg-black/50 border border-amber-500/20 placeholder:text-white/20 outline-none focus:border-amber-500/60 transition-all"
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          />

          {/* 지하철 검색 결과 */}
          {subwayResults.length > 0 && (
            <div className="space-y-2">
              {subwayResults.map((station) => {
                  const isSelected = selectedStation?.stationName === station.stationName
                  return (
                    <div key={station.stationName} className={cn('rounded-xl border p-3 space-y-2 transition-all', isSelected ? 'border-amber-500/40 bg-amber-500/5' : 'border-white/8 bg-black/20')}>
                      <button type="button" onClick={() => { setSelectedStation(isSelected ? null : station); setSelectedLines([]) }} className="flex items-center gap-2 w-full text-left">
                        <Train size={11} className={cn(isSelected ? 'text-amber-400' : 'text-white/30')} />
                        <span className={cn('text-sm font-medium', isSelected ? 'text-amber-300' : 'text-white/60')} style={{ fontFamily: 'var(--font-dm-sans)' }}>{station.stationName}</span>
                        {isSelected && (
                          <span className="ml-auto w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                            <Check size={7} strokeWidth={3} className="text-black" />
                          </span>
                        )}
                      </button>
                      {isSelected && (
                        <div className="flex flex-wrap gap-1.5">
                          {station.lines.map((line) => {
                            const isLineSelected = selectedLines.includes(line.lineNo)
                            return (
                              <button
                                key={line.lineNo}
                                type="button"
                                onClick={() => setSelectedLines((prev) => prev.includes(line.lineNo) ? prev.filter((l) => l !== line.lineNo) : [...prev, line.lineNo])}
                                className={cn('relative flex flex-col items-start gap-0.5 px-2.5 py-1.5 rounded-xl border transition-all', isLineSelected ? 'transport-card-active' : 'bg-black/30 border-white/8 hover:border-white/20')}
                              >
                                {isLineSelected && (
                                  <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-amber-500 flex items-center justify-center">
                                    <Check size={6} strokeWidth={3} className="text-black" />
                                  </span>
                                )}
                                <span className={cn('text-xs font-bold', isLineSelected ? 'text-amber-300' : 'text-white/50')} style={{ fontFamily: 'var(--font-dm-sans)' }}>{line.lineNo}</span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      )}

      {/* 저장 버튼 */}
      <div className="flex gap-3 pt-1">
        <button
          onClick={onBack}
          className="flex-1 h-11 rounded-xl border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20 transition-all text-sm"
          style={{ fontFamily: 'var(--font-dm-sans)' }}
        >
          이전
        </button>
        <button
          onClick={handleSave}
          disabled={!canSave}
          className={cn(
            'flex-[2] h-11 rounded-xl text-sm font-semibold tracking-wide transition-all duration-150',
            canSave
              ? 'shimmer-btn text-black'
              : 'bg-white/5 border border-white/8 text-white/20 cursor-not-allowed'
          )}
          style={{ fontFamily: 'var(--font-dm-sans)' }}
        >
          저장
        </button>
      </div>
    </div>
  )
}

// ── 메인 다이얼로그 컴포넌트 ──────────────────────────────────
export function AddCardDialog({
  open,
  onOpenChange,
  onAddCard,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddCard: (config: Omit<import('@/types/card').CardConfig, 'id'>) => void
}) {
  const [step, setStep] = useState<Step>('type')
  const [cardType, setCardType] = useState<CardType | null>(null)
  function handleClose() {
    onOpenChange(false)
    // 애니메이션 후 상태 초기화
    setTimeout(() => {
      setStep('type')
      setCardType(null)
    }, 300)
  }

  function handleTypeSelect(type: CardType) {
    logger.info('UI', '카드 타입 선택', { type })
    setCardType(type)
    setStep('config')
  }

  function handleSimpleSave(region: string) {
    if (!cardType || cardType === 'transit') return
    onAddCard({ type: cardType as 'weather' | 'dust', region } as Omit<import('@/types/card').CardConfig, 'id'>)
    logger.info('UI', '카드 추가 완료', { type: cardType, region })
    handleClose()
  }

  function handleTransitSave(config: {
    transportTypes: ('bus' | 'subway')[]
    busEntries: BusEntry[]
    subwayEntries: SubwayEntry[]
  }) {
    onAddCard({ type: 'transit', ...config })
    logger.info('UI', '대중교통 카드 추가 완료', {
      transportTypes: config.transportTypes,
      busStops: config.busEntries.map((e) => e.stopName),
      subwayStations: config.subwayEntries.map((e) => e.stationName),
    })
    handleClose()
  }

  const titleMap: Record<CardType, string> = {
    weather: '날씨 카드',
    dust: '미세먼지 카드',
    transit: '대중교통 카드',
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'var(--font-bebas)' }}>
            {step === 'type' ? 'ADD CARD' : cardType ? titleMap[cardType] : 'ADD CARD'}
          </DialogTitle>
          <DialogDescription style={{ fontFamily: 'var(--font-dm-sans)' }}>
            {step === 'type' ? '추가할 카드 타입을 선택하세요' : '카드 설정을 입력하세요'}
          </DialogDescription>
        </DialogHeader>

        {step === 'type' && <TypeStep onSelect={handleTypeSelect} />}

        {step === 'config' && cardType === 'weather' && (
          <SimpleConfigStep type="weather" onBack={() => setStep('type')} onSave={handleSimpleSave} />
        )}

        {step === 'config' && cardType === 'dust' && (
          <SimpleConfigStep type="dust" onBack={() => setStep('type')} onSave={handleSimpleSave} />
        )}

        {step === 'config' && cardType === 'transit' && (
          <TransitConfigStep onBack={() => setStep('type')} onSave={handleTransitSave} />
        )}
      </DialogContent>
    </Dialog>
  )
}
