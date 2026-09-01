'use client'
import { useState } from 'react'
import { useCreateLead } from '@/features/leads/leads.queries'
import type { Lead, LeadPriority } from '@/types/lead.types'

interface FormState {
  nombre: string
  telefono: string
  web: string
  rating: string
  rubro: string
  ciudad: string
  prioridad: LeadPriority
  observaciones: string
}

const EMPTY: FormState = {
  nombre: '',
  telefono: '',
  web: '',
  rating: '',
  rubro: '',
  ciudad: '',
  prioridad: 'media',
  observaciones: '',
}

const inputCls =
  'w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-zinc-600 transition-colors'
const labelCls = 'text-xs text-zinc-500 font-medium'

export function NewLeadDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { mutate: createLead, isPending } = useCreateLead()
  const [form, setForm] = useState<FormState>(EMPTY)
  const [error, setError] = useState('')

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function reset() {
    setForm(EMPTY)
    setError('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim()) {
      setError('El nombre es obligatorio')
      return
    }

    const payload: Partial<Lead> = {
      nombre: form.nombre.trim(),
      prioridad: form.prioridad,
      etapa: 'nuevo',
      source: 'manual',
      tags: [],
      ciudad: form.ciudad.trim() || 'Tucumán',
      observaciones: form.observaciones.trim() || null,
      telefono: form.telefono.trim() || null,
      web: form.web.trim() || null,
      rubro: form.rubro.trim() || null,
    }

    if (form.rating.trim() !== '') {
      const n = parseFloat(form.rating.replace(',', '.'))
      if (!isNaN(n)) payload.rating = Math.min(Math.max(Math.round(n * 10) / 10, 0), 10)
    }

    createLead(payload, {
      onSuccess: () => {
        reset()
        onClose()
      },
      onError: (err) => {
        setError(err.message || 'Error al crear el lead')
      },
    })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !isPending && onClose()}
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-zinc-100">Nuevo lead</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Ingresá los datos del contacto</p>
          </div>
          <button
            onClick={() => !isPending && onClose()}
            className="text-zinc-600 hover:text-zinc-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Nombre */}
          <div className="space-y-1.5">
            <label className={labelCls}>Nombre *</label>
            <input
              className={inputCls}
              placeholder="Ej: Farmacia Central"
              value={form.nombre}
              onChange={(e) => set('nombre', e.target.value)}
              autoFocus
            />
          </div>

          {/* Teléfono + Web */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={labelCls}>Teléfono</label>
              <input
                className={inputCls}
                placeholder="Ej: 3815123456"
                value={form.telefono}
                onChange={(e) => set('telefono', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Sitio web</label>
              <input
                className={inputCls}
                placeholder="Ej: https://..."
                value={form.web}
                onChange={(e) => set('web', e.target.value)}
              />
            </div>
          </div>

          {/* Rubro + Ciudad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={labelCls}>Rubro</label>
              <input
                className={inputCls}
                placeholder="Ej: Farmacia"
                value={form.rubro}
                onChange={(e) => set('rubro', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Ciudad</label>
              <input
                className={inputCls}
                placeholder="Ej: Tucumán"
                value={form.ciudad}
                onChange={(e) => set('ciudad', e.target.value)}
              />
            </div>
          </div>

          {/* Prioridad + Rating */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={labelCls}>Prioridad</label>
              <select
                className={inputCls}
                value={form.prioridad}
                onChange={(e) => set('prioridad', e.target.value as LeadPriority)}
              >
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Rating</label>
              <input
                className={inputCls}
                placeholder="Ej: 4.5"
                value={form.rating}
                onChange={(e) => set('rating', e.target.value)}
              />
            </div>
          </div>

          {/* Observaciones */}
          <div className="space-y-1.5">
            <label className={labelCls}>Observaciones</label>
            <textarea
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-zinc-600 transition-colors resize-none"
              rows={3}
              placeholder="Notas sobre el lead..."
              value={form.observaciones}
              onChange={(e) => set('observaciones', e.target.value)}
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-1 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => !isPending && onClose()}
              className="text-sm px-4 py-2 border border-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="text-sm px-4 py-2 bg-green-500 hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-medium rounded-lg transition-colors"
            >
              {isPending ? 'Guardando...' : 'Guardar lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

