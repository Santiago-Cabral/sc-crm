'use client'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number | null
  onChange?: (value: number | null) => void
  className?: string
}

export function StarRating({ value, onChange, className }: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null)
  const preview = hover ?? value
  const filled = preview != null ? Math.round(preview) : 0

  function handleClick(n: number) {
    if (!onChange) return
    onChange(value === n ? null : n)
  }

  return (
    <div
      className={cn('flex items-center gap-0.5', className)}
      onMouseLeave={() => setHover(null)}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const isFilled = n <= filled
        if (!onChange) {
          return (
            <span
              key={n}
              className={cn('text-sm leading-none', isFilled ? 'text-amber-400' : 'text-zinc-700')}
            >
              ★
            </span>
          )
        }
        return (
          <button
            key={n}
            type="button"
            onClick={() => handleClick(n)}
            onMouseEnter={() => setHover(n)}
            aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
            className={cn(
              'text-lg leading-none transition-transform hover:scale-110',
              isFilled ? 'text-amber-400' : hover != null ? 'text-zinc-600' : 'text-zinc-700',
            )}
          >
            ★
          </button>
        )
      })}
    </div>
  )
}
