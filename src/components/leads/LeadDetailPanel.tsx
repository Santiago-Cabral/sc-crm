'use client'
import { useState } from 'react'
import type { Lead, PipelineStage } from '@/types/lead.types'
import { PIPELINE_STAGES, PIPELINE_STAGE_LABELS, PIPELINE_STAGE_COLORS } from '@/types/pipeline.types'
import { useUpdateLead, useUpdateLeadStage, useDeleteLead, useAnalyzeLead } from '@/features/leads/leads.queries'
import { useUIStore } from '@/store/uiStore'
import { cn } from '@/lib/utils'

function normalizePhone(p: string): string {
  let s = String(p).replace(/[\s\-\(\)\+\.]/g, '').replace(/\.0+$/, '')
  if (s.startsWith('0')) s = '54' + s.slice(1)
  if (!s.startsWith('54')) s = '54' + s
  if (s.startsWith('54') && !s.startsWith('549') && s.length === 12) s = '549' + s.slice(2)
  return s
}

function copyToClipboard(text: string, cb?: () => void) {
  navigator.clipboard.writeText(text).then(cb)
}

function MessageBlock({
  label,
  message,
  waLink,
}: {
  label: string
  message: string
  waLink?: string
}) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    copyToClipboard(message, () => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="bg-zinc-950/60 border border-zinc-800 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-400">{label}</span>
        <div className="flex gap-1">
          <button
            onClick={handleCopy}
            className="text-xs px-2 py-0.5 rounded border border-zinc-800 text-zinc-500 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
          >
            {copied ? '✓ Copiado' : 'Copiar'}
          </button>
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-2 py-0.5 rounded bg-green-500 hover:bg-green-400 text-black font-medium transition-colors"
            >
              WA
            </a>
          )}
        </div>
      </div>
      <p className="text-xs text-zinc-400 whitespace-pre-wrap leading-relaxed">{message}</p>
    </div>
  )
}

interface Props {
  lead: Lead
}

export function LeadDetailPanel({ lead }: Props) {
  const { selectLead } = useUIStore()
  const { mutate: updateStage }  = useUpdateLeadStage()
  const { mutate: updateLead }   = useUpdateLead()
  const { mutate: deleteLead }   = useDeleteLead()
  const { mutate: analyzeLead, isPending: analyzing } = useAnalyzeLead()

  const phone = lead.telefono ? normalizePhone(lead.telefono) : null

  const d1msg = lead.mensaje_d1 || lead.ai_analysis?.mensaje_d1 || ''
  const d3msg = lead.mensaje_d3 || lead.ai_analysis?.mensaje_d3 || ''
  const d7msg = lead.mensaje_d7 || lead.ai_analysis?.mensaje_d7 || ''

  function handleStageChange(etapa: PipelineStage) {
    updateStage({ id: lead.id, etapa })
  }

  function handleDelete() {
    if (!confirm(`¿Eliminar a ${lead.nombre}?`)) return
    deleteLead(lead.id)
    selectLead(null)
  }

  function handleAnalyze() {
    analyzeLead(lead)
  }

  const tempColors = {
    caliente: 'text-red-400 bg-red-950/40 border-red-900/50',
    tibio:    'text-amber-400 bg-amber-950/40 border-amber-900/50',
    frio:     'text-blue-400 bg-blue-950/40 border-blue-900/50',
  }

  return (
    <div className="h-full flex flex-col bg-zinc-950 border-l border-zinc-800">

      {/* Header */}
      <div className="flex items-start justify-between p-5 border-b border-zinc-800 gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-zinc-100 leading-snug">{lead.nombre}</h2>
          <p className="text-xs text-zinc-500 mt-0.5 uppercase tracking-wide">
            {lead.rubro || '—'} · {lead.ciudad}
          </p>
        </div>
        <button
          onClick={() => selectLead(null)}
          className="text-zinc-600 hover:text-zinc-300 transition-colors shrink-0 mt-0.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Temperatura + Score */}
        {(lead.temperatura || lead.ai_score) && (
          <div className="flex gap-2 flex-wrap">
            {lead.temperatura && (
              <span className={cn('text-xs font-medium px-3 py-1 rounded-full border', tempColors[lead.temperatura])}>
                {lead.temperatura === 'caliente' ? '🔥' : lead.temperatura === 'tibio' ? '🌡️' : '❄️'} {lead.temperatura}
              </span>
            )}
            {lead.ai_score && (
              <span className="text-xs text-purple-400 bg-purple-950/40 border border-purple-900/50 px-3 py-1 rounded-full">
                Score {lead.ai_score}
              </span>
            )}
          </div>
        )}

        {/* Etapa */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Etapa</p>
          <div className="flex flex-wrap gap-1">
            {PIPELINE_STAGES.map(stage => (
              <button
                key={stage}
                onClick={() => handleStageChange(stage)}
                className={cn(
                  'text-xs px-3 py-1 rounded-full border transition-colors',
                  lead.etapa === stage
                    ? cn('border-zinc-600 bg-zinc-800', PIPELINE_STAGE_COLORS[stage])
                    : 'border-zinc-800 text-zinc-600 hover:border-zinc-700 hover:text-zinc-400'
                )}
              >
                {PIPELINE_STAGE_LABELS[stage]}
              </button>
            ))}
          </div>
        </div>

        {/* Datos de contacto */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Contacto</p>
          <div className="space-y-1.5">
            {lead.telefono && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">{lead.telefono}</span>
                {phone && (
                  <a
                    href={`https://wa.me/${phone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-2 py-0.5 bg-green-500 hover:bg-green-400 text-black rounded font-medium transition-colors"
                  >
                    WhatsApp
                  </a>
                )}
              </div>
            )}
            {lead.web && (
              <a
                href={lead.web}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 block truncate transition-colors"
              >
                {lead.web.replace(/https?:\/\//, '')}
              </a>
            )}
            {lead.direccion && (
              <p className="text-xs text-zinc-500">{lead.direccion}</p>
            )}
            {lead.rating && (
              <p className="text-xs text-amber-400">
                {'★'.repeat(Math.round(lead.rating))}{'☆'.repeat(Math.max(0, 5 - Math.round(lead.rating)))} {lead.rating}
              </p>
            )}
          </div>
        </div>

        {/* Análisis IA */}
        {lead.ai_analysis && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Análisis IA</p>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 space-y-1.5">
              {lead.ai_analysis.motivo && (
                <p className="text-xs text-zinc-400 leading-relaxed">{lead.ai_analysis.motivo}</p>
              )}
              {lead.ai_analysis.servicio_recomendado && (
                <p className="text-xs text-green-400">→ {lead.ai_analysis.servicio_recomendado}</p>
              )}
            </div>
          </div>
        )}

        {/* Mensajes */}
        {(d1msg || d3msg || d7msg) && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Mensajes</p>
            <div className="space-y-2">
              {d1msg && (
                <MessageBlock
                  label="Día 1 — Primer contacto"
                  message={d1msg}
                  waLink={phone ? `https://wa.me/${phone}?text=${encodeURIComponent(d1msg)}` : undefined}
                />
              )}
              {d3msg && (
                <MessageBlock
                  label="Día 3 — Seguimiento"
                  message={d3msg}
                  waLink={phone ? `https://wa.me/${phone}?text=${encodeURIComponent(d3msg)}` : undefined}
                />
              )}
              {d7msg && (
                <MessageBlock
                  label="Día 7 — Último seguimiento"
                  message={d7msg}
                  waLink={phone ? `https://wa.me/${phone}?text=${encodeURIComponent(d7msg)}` : undefined}
                />
              )}
            </div>
          </div>
        )}

        {/* Observaciones */}
        {lead.observaciones && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Observaciones</p>
            <p className="text-xs text-zinc-400 leading-relaxed">{lead.observaciones}</p>
          </div>
        )}

        {/* Fechas */}
        <div className="space-y-1.5 text-xs text-zinc-600">
          {lead.fecha_primer_contacto && (
            <p>Primer contacto: {lead.fecha_primer_contacto}</p>
          )}
          {lead.fecha_ultimo_contacto && (
            <p>Último contacto: {lead.fecha_ultimo_contacto}</p>
          )}
          {lead.next_follow_up && (
            <p className={cn(
              'font-medium',
              lead.next_follow_up < new Date().toISOString().split('T')[0] ? 'text-red-400' : 'text-amber-400'
            )}>
              Follow up: {lead.next_follow_up}
            </p>
          )}
        </div>

      </div>

      {/* Footer actions */}
      <div className="p-4 border-t border-zinc-800 space-y-2">
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="w-full text-xs py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          {analyzing ? '⏳ Analizando con IA...' : '✨ Analizar con IA'}
        </button>
        <button
          onClick={handleDelete}
          className="w-full text-xs py-2 border border-zinc-800 hover:border-red-900/60 text-zinc-600 hover:text-red-400 rounded-lg transition-colors"
        >
          Eliminar lead
        </button>
      </div>
    </div>
  )
}