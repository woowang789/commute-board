'use client'
import { useState } from 'react'
import { z } from 'zod'
import { type CardConfig, CardConfigSchema } from '@/types/card'
import { logger } from '@/lib/logger'

const STORAGE_KEY = 'commute-board-cards'

function loadCardsFromStorage(): CardConfig[] {
  if (typeof window === 'undefined') return []

  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    const result = z.array(CardConfigSchema).safeParse(parsed)
    if (result.success) {
      return result.data
    }
    logger.warn('STORAGE', 'localStorage 카드 스키마 검증 실패', {
      errorCount: result.error.issues.length,
      firstIssue: result.error.issues[0]?.message,
    })
  } catch (err) {
    logger.error('STORAGE', 'localStorage 카드 파싱 오류', {
      error: err instanceof Error ? err.message : String(err),
    })
  }
  return []
}

export function useCards() {
  const [cards, setCards] = useState<CardConfig[]>(loadCardsFromStorage)

  function addCard(config: Omit<CardConfig, 'id'>) {
    const newCard = { ...config, id: crypto.randomUUID() } as CardConfig
    setCards((prev) => {
      const updated = [...prev, newCard]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      logger.info('STORAGE', '카드 추가', { type: newCard.type, id: newCard.id })
      return updated
    })
  }

  function removeCard(id: string) {
    setCards((prev) => {
      const updated = prev.filter((c) => c.id !== id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      logger.info('STORAGE', '카드 삭제', { id })
      return updated
    })
  }

  return { cards, addCard, removeCard }
}
