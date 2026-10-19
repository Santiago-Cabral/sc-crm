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
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const preview = hover ?? value
  const filled = preview != null ? preview : 0

  function handleClick(n: number) {
    if (!onChange) return
    // Clic en la misma cantidad de estrellas quita el rating.
    if (value != null && Math.round(value) === n) {
      onChange(null)
      return
    }
    onChange(n)
  }

  function openEdit() {
    if (!onChange) return
    setDraft(value != null ? String(value) : '')
    setEditing(true)
  }

  function commitEdit() {
    if (!onChange) return
    const raw = draft.trim().replace(',', '.')
    if (raw === '') {
      onChange(null)
      setEditing(false)
      return
    }
    const n = parseFloat(raw)
    if (!isNaN(n)) onChange(Math.min(Math.max(Math.round(n * 10) / 10, 0), 5))
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        autoFocus
        type="text"
        inputMode="decimal"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commitEdit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commitEdit()
          if (e.key === 'Escape') setEditing(false)
        }}
        placeholder="Ej: 4.8"
        className={cn(
          'w-16 bg-zinc-950 border border-zinc-600 rounded-lg px-2 py-1 text-xs text-zinc-100 placeholder:text-zinc-600 outline-none',
          className,
        )}
      />
    )
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
      {onChange && (
        <button
          type="button"
          onClick={openEdit}
          title="Escribir valor exacto (ej: 4.8)"
          className="text-[11px] leading-none px-1 py-0.5 rounded border border-zinc-800 text-zinc-500 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
        >
          ✎
        </button>
      )}
    </div>
  )
}
