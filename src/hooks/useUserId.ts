'use client'

import { useEffect } from 'react'
import { setUserId } from '@/lib/logger'

const UID_KEY = 'commute-board-uid'

export function useUserId(): void {
  useEffect(() => {
    let uid = localStorage.getItem(UID_KEY)
    if (!uid) {
      // 8자리 짧은 UID (세션 구분에 충분)
      uid = crypto.randomUUID().replace(/-/g, '').slice(0, 8)
      localStorage.setItem(UID_KEY, uid)
    }
    setUserId(uid)
  }, [])
}
