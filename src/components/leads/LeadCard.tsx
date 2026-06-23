'use client'
import type { Lead } from '@/types/lead.types'
import { PIPELINE_STAGE_LABELS } from '@/types/pipeline.types'
import { cn } from '@/lib/utils'

function normalizePhone(p: string): string {
  let s = String(p).replace(/[\s\-\(\)\+\.]/g, '').replace(/\.0+$/, '')
  if (s.startsWith('0')) s = '54' + s.slice(1)
  if (!s.startsWith('54')) s = '54' + s
  if (s.startsWith('54') && !s.startsWith('549') && s.length === 12) s = '549' + s.slice(2)
  return s
}

function getStars(r: number) {
  const n = Math.round(r)
  return '★'.repeat(Math.min(n, 5)) + '☆'.repeat(Math.max(0, 5 - n))
}

function getDaysBadge(lead: Lead) {
  if (!lead.fecha_primer_contacto) return null
  const days = Math.floor(
    (Date.now() - new Date(lead.fecha_primer_contacto).getTime()) / 86400000
  )
  if (days === 0) return { label: 'Contactado hoy', cls: 'text-green-400 bg-green-950/50 border-green-900/50' }
  if (days <= 3)  return { label: `Hace ${days}d`, cls: 'text-amber-400 bg-amber-950/50 border-amber-900/50' }
  return { label: `Hace ${days}d · seguimiento`, cls: 'text-red-400 bg-red-950/50 border-red-900/50' }
}

interface LeadCardProps {
  lead: Lead
  onWhatsApp?: (lead: Lead) => void
  onSelect?: (lead: Lead) => void
}

export function LeadCard({ lead, onWhatsApp, onSelect }: LeadCardProps) {
  const phone = lead.telefono ? normalizePhone(lead.telefono) : null
  const daysBadge = getDaysBadge(lead)
  const primerMensaje = lead.mensaje_d1 || lead.ai_analysis?.mensaje_d1 || ''

  const tempColors = {
    caliente: 'text-red-400 bg-red-950/50 border-red-900/50',
    tibio:    'text-amber-400 bg-amber-950/50 border-amber-900/50',
    frio:     'text-blue-400 bg-blue-950/50 border-blue-900/50',
  }

  const prioridadBorder = {
    alta:  'border-l-red-500',
    media: 'border-l-amber-500',
    baja:  'border-l-zinc-700',
  }

  return (
    <div
      className={cn(
        'bg-zinc-900 border border-zinc-800 border-l-2 rounded-xl p-4 flex flex-col gap-3 hover:border-zinc-700 transition-colors cursor-pointer',
        prioridadBorder[lead.prioridad]
      )}
      onClick={() => onSelect?.(lead)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-medium text-zinc-100 truncate">
              {lead.nombre}
            </h3>
            {!lead.tiene_web && (
              <span className="text-xs text-red-400 bg-red-950/30 border border-red-900/50 px-1.5 py-0.5 rounded">
                sin web
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-0.5 uppercase tracking-wide">
            {lead.rubro || '—'} · {lead.ciudad}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          {/* Temperatura */}
          {lead.temperatura && (
            <span className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full border',
              tempColors[lead.temperatura]
            )}>
              {lead.temperatura}
            </span>
          )}
          {/* Etapa */}
          <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
            {PIPELINE_STAGE_LABELS[lead.etapa]}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1.5">
        {lead.telefono && (
          <p className="text-xs text-zinc-500">{lead.telefono}</p>
        )}
        {lead.web && (
          <a
            href={lead.web}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-blue-400 hover:text-blue-300 truncate"
          >
            {lead.web.replace(/https?:\/\//, '').substring(0, 40)}
          </a>
        )}
        {lead.rating && (
          <p className="text-xs text-amber-400">{getStars(lead.rating)} {lead.rating}</p>
        )}
      </div>

      {/* AI Score */}
      {lead.ai_analysis && (
        <div className="bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2">
          <p className="text-xs text-zinc-600 mb-1">Análisis IA</p>
          {lead.ai_analysis.motivo && (
            <p className="text-xs text-zinc-400 line-clamp-2">{lead.ai_analysis.motivo}</p>
          )}
          {lead.ai_analysis.servicio_recomendado && (
            <p className="text-xs text-green-400 mt-1">{lead.ai_analysis.servicio_recomendado}</p>
          )}
        </div>
      )}

      {/* Days badge */}
      {daysBadge && (
        <span className={cn(
          'text-xs px-2 py-1 rounded-lg border w-fit',
          daysBadge.cls
        )}>
          {daysBadge.label}
        </span>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-1" onClick={(e) => e.stopPropagation()}>
        {phone ? (
          <>
            {primerMensaje && (
              <button
                onClick={() => navigator.clipboard.writeText(primerMensaje)}
                className="flex-1 text-xs py-2 border border-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-colors"
              >
                Copiar D1
              </button>
            )}
            <a
              href={`https://wa.me/${phone}${primerMensaje ? `?text=${encodeURIComponent(primerMensaje)}` : ''}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onWhatsApp?.(lead)}
              className="flex-1 text-xs py-2 bg-green-500 hover:bg-green-400 text-black font-medium rounded-lg text-center transition-colors"
            >
              WhatsApp
            </a>
          </>
        ) : (
          <span className="text-xs text-zinc-700 py-2">Sin número</span>
        )}
      </div>
    </div>
  )
}