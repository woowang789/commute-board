import { cn } from '@/lib/utils'

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('terminal-card rounded-xl p-5 animate-pulse', className)}>
      <div className='h-4 bg-white/10 rounded mb-3 w-1/3' />
      <div className='h-12 bg-white/10 rounded mb-2 w-2/3' />
      <div className='h-3 bg-white/10 rounded w-1/2' />
    </div>
  )
}
