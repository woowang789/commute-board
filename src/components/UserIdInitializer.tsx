'use client'

import { useUserId } from '@/hooks/useUserId'

export function UserIdInitializer({ children }: { children: React.ReactNode }) {
  useUserId()
  return <>{children}</>
}
