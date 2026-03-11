import { AlertCircle, RefreshCcw, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CardErrorProps {
  message?: string
  onRetry?: () => void
  onRemove?: () => void
}

export function CardError({ message = '데이터를 불러올 수 없습니다.', onRetry, onRemove }: CardErrorProps) {
  return (
    <div className={cn('relative terminal-card rounded-xl p-5 flex flex-col items-center justify-center gap-3 min-h-[10rem] group')}>
      {onRemove && (
        <button
          onClick={onRemove}
          className='absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center text-white/20 hover:text-white/70 hover:bg-white/10 transition-all duration-150 opacity-0 group-hover:opacity-100 z-10'
          aria-label='카드 삭제'
        >
          <X size={11} strokeWidth={2.5} />
        </button>
      )}
      <AlertCircle size={28} className='text-red-400' />
      <p className='text-white/70 text-sm text-center'>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className='flex items-center gap-1.5 text-amber-400 text-xs hover:text-amber-300 transition-colors'
        >
          <RefreshCcw size={12} /> 다시 시도
        </button>
      )}
    </div>
  )
}
