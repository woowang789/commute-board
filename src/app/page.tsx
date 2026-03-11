'use client'
import { useState, Fragment } from 'react'
import { Plus, Info } from 'lucide-react'
import { useCards } from '@/hooks/useCards'
import { REFRESH_INTERVALS } from '@/constants/refreshIntervals'
import { WeatherCard } from '@/components/WeatherCard'
import { DustCard } from '@/components/DustCard'
import { BusCard } from '@/components/BusCard'
import { SubwayCard } from '@/components/SubwayCard'
import { AddCardDialog } from '@/components/AddCardDialog'
import { ApiCreditsDialog } from '@/components/ApiCreditsDialog'
export default function Home() {
  const { cards, addCard, removeCard } = useCards()
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [apiCreditsOpen, setApiCreditsOpen] = useState(false)

  const busInterval = REFRESH_INTERVALS.bus
  const subwayInterval = REFRESH_INTERVALS.subway

  return (
    <main className="min-h-screen dot-grid-bg">
      {/* 컴팩트 헤더 */}
      <div className="relative px-4 pt-4 pb-0 animate-fade-slide-up">
        <div className="flex items-center justify-between">
          {/* 타이틀 - 한 줄 인라인 */}
          <div className="flex items-baseline gap-1.5">
            <h1
              className="text-2xl text-white leading-none tracking-wider"
              style={{ fontFamily: 'var(--font-bebas)' }}
            >
              COMMUTE
            </h1>
            <h2
              className="text-2xl text-amber-400 leading-none tracking-wider"
              style={{ fontFamily: 'var(--font-bebas)' }}
            >
              BOARD
            </h2>
            <span
              className="text-[9px] text-cyan-400/60 tracking-[0.2em] uppercase ml-1 hidden sm:inline"
              style={{ fontFamily: 'var(--font-dm-sans)' }}
            >
              Transit
            </span>
          </div>

          {/* 우측 버튼 그룹 */}
          <div className="flex items-center gap-3">
            {/* API 출처 버튼 */}
            <button
              onClick={() => setApiCreditsOpen(true)}
              className="inline-flex items-center gap-1 text-amber-400/80 hover:text-amber-400 transition-colors group"
              aria-label="API 출처"
            >
              <Info
                size={14}
                className="group-hover:rotate-12 transition-transform duration-300"
              />
              <span
                className="text-[10px] tracking-widest uppercase"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                API
              </span>
            </button>

            {/* 카드 추가 버튼 */}
            <button
              onClick={() => setAddDialogOpen(true)}
              className="inline-flex items-center gap-1 text-amber-400/80 hover:text-amber-400 transition-colors group"
              aria-label="카드 추가"
            >
              <Plus
                size={14}
                className="group-hover:rotate-90 transition-transform duration-300"
              />
              <span
                className="text-[10px] tracking-widest uppercase"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                Add
              </span>
            </button>
          </div>
        </div>

        {/* 장식 라인 */}
        <div className="mt-3 mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-amber-500/80 via-amber-400/40 to-transparent" />
          <div className="w-1 h-1 rounded-full bg-amber-500/60" />
        </div>
      </div>

      {/* 카드 영역 */}
      {cards.length === 0 ? (
        /* 빈 상태 */
        <div className="px-4 flex flex-col items-center justify-center py-20 gap-5">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl border border-white/20 bg-white/8 flex items-center justify-center mb-1">
              <Plus size={20} className="text-white/50" />
            </div>
            <p
              className="text-white/70 text-sm"
              style={{ fontFamily: 'var(--font-dm-sans)' }}
            >
              카드를 추가해주세요
            </p>
            <p
              className="text-white/45 text-xs"
              style={{ fontFamily: 'var(--font-dm-sans)' }}
            >
              날씨 · 미세먼지 · 대중교통 카드를 추가할 수 있습니다
            </p>
          </div>
          <button
            onClick={() => setAddDialogOpen(true)}
            className="shimmer-btn px-6 h-11 rounded-xl text-black text-sm font-bold tracking-wider uppercase"
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          >
            + 카드 추가
          </button>
        </div>
      ) : (
        /* 카드 그리드 - 모바일 1열, sm 이상 2열 */
        <div className="px-4 pb-16 max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cards.map((card) => {
            if (card.type === 'weather') {
              return (
                <WeatherCard
                  key={card.id}
                  region={card.region}
                  onRemove={() => removeCard(card.id)}
                />
              )
            }
            if (card.type === 'dust') {
              return (
                <DustCard
                  key={card.id}
                  region={card.region}
                  onRemove={() => removeCard(card.id)}
                />
              )
            }
            if (card.type === 'transit') {
              return (
                <Fragment key={card.id}>
                  {card.transportTypes.includes('bus') && (
                    <BusCard
                      key={`bus-${card.id}`}
                      busEntries={card.busEntries ?? []}
                      refreshInterval={busInterval}
                      onRemove={() => removeCard(card.id)}
                    />
                  )}
                  {card.transportTypes.includes('subway') && (
                    <SubwayCard
                      key={`subway-${card.id}`}
                      subwayEntries={card.subwayEntries ?? []}
                      refreshInterval={subwayInterval}
                      onRemove={() => removeCard(card.id)}
                    />
                  )}
                </Fragment>
              )
            }
            return null
          })}
        </div>
      )}

      {/* 카드 추가 다이얼로그 */}
      <AddCardDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onAddCard={addCard} />

      {/* API 출처 다이얼로그 */}
      <ApiCreditsDialog open={apiCreditsOpen} onOpenChange={setApiCreditsOpen} />
    </main>
  )
}
