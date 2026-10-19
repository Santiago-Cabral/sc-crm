'use client'
import { useState } from 'react'
import type { Lead, LeadPriority, PipelineStage } from '@/types/lead.types'
import { PIPELINE_STAGES, PIPELINE_STAGE_LABELS, PIPELINE_STAGE_COLORS } from '@/types/pipeline.types'
import { useUpdateLead, useUpdateLeadStage, useDeleteLead, useAnalyzeLead, useInteractions, useRecordMessageSent, useAddNote } from '@/features/leads/leads.queries'
import { useUIStore } from '@/store/uiStore'
import { cn } from '@/lib/utils'
import { StarRating } from './StarRating'
import type { Interaction } from '@/types/lead.types'

const inputCls =
  'w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-zinc-600 transition-colors'
const labelCls = 'text-[11px] text-zinc-500 font-medium'

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

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
  const { mutate: updateLead, isPending: savingLead } = useUpdateLead()
  const { mutate: deleteLead }   = useDeleteLead()
  const { mutate: analyzeLead, isPending: analyzing } = useAnalyzeLead()
  const { mutate: addNote, isPending: savingNote } = useAddNote()

  // Edición de campos del lead (para completar datos faltantes)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    telefono: '',
    web: '',
    rubro: '',
    ciudad: '',
    direccion: '',
    prioridad: 'media' as LeadPriority,
    observaciones: '',
    tags: '',
  })
  // Nota de contacto (abajo de todo)
  const [noteText, setNoteText] = useState('')

  const phone = lead.telefono ? normalizePhone(lead.telefono) : null

  const d1msg = lead.mensaje_d1 || lead.ai_analysis?.mensaje_d1 || ''
  const d3msg = lead.mensaje_d3 || lead.ai_analysis?.mensaje_d3 || ''
  const d7msg = lead.mensaje_d7 || lead.ai_analysis?.mensaje_d7 || ''
  const nextStep = lead.ai_analysis?.siguiente_paso || ''
  const ctaCall = lead.ai_analysis?.cta_llamada || ''
  const objPrecio = lead.ai_analysis?.objecion_precio || ''
  const objPensar = lead.ai_analysis?.objecion_pensar || ''
  const objPresupuesto = lead.ai_analysis?.objecion_presupuesto || ''

  const { data: interactions = [] } = useInteractions(lead.id)
  const { mutate: recordSent, isPending: recording } = useRecordMessageSent()

  // Rastreador de secuencia D1/D3/D7: qué mensajes de captación ya se enviaron.
  const sentTypes = new Set(interactions.map((i) => i.mensaje_tipo).filter(Boolean) as Interaction['mensaje_tipo'][])
  const notes = interactions.filter((i) => i.tipo === 'nota')
  const nextMsg: 'd1' | 'd3' | 'd7' | null = !sentTypes.has('d1')
    ? 'd1'
    : !sentTypes.has('d3')
      ? 'd3'
      : !sentTypes.has('d7')
        ? 'd7'
        : null

  const nextMsgText =
    nextMsg === 'd1' ? d1msg : nextMsg === 'd3' ? d3msg : nextMsg === 'd7' ? d7msg : ''

  function handleRecordSent() {
    if (!nextMsg || !nextMsgText || !phone) return
    recordSent({
      leadId: lead.id,
      mensajeTipo: nextMsg,
      waLink: `https://wa.me/${phone}?text=${encodeURIComponent(nextMsgText)}`,
      etapaAnterior: lead.etapa,
      fechaPrimerContacto: lead.fecha_primer_contacto,
    })
  }

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

  function startEdit() {
    setEditForm({
      telefono: lead.telefono ?? '',
      web: lead.web ?? '',
      rubro: lead.rubro ?? '',
      ciudad: lead.ciudad ?? '',
      direccion: lead.direccion ?? '',
      prioridad: lead.prioridad,
      observaciones: lead.observaciones ?? '',
      tags: (lead.tags ?? []).join(', '),
    })
    setEditing(true)
  }

  function setEdit<K extends keyof typeof editForm>(key: K, value: (typeof editForm)[K]) {
    setEditForm((f) => ({ ...f, [key]: value }))
  }

  function saveEdit() {
    const web = editForm.web.trim()
    const updates: Partial<Lead> = {
      telefono: editForm.telefono.trim() || null,
      web: web || null,
      tiene_web: !!web,
      rubro: editForm.rubro.trim() || null,
      ciudad: editForm.ciudad.trim() || lead.ciudad,
      direccion: editForm.direccion.trim() || null,
      prioridad: editForm.prioridad,
      observaciones: editForm.observaciones.trim() || null,
      tags: editForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
    }
    updateLead(
      { id: lead.id, updates },
      { onSuccess: () => setEditing(false) },
    )
  }

  function handleRating(value: number | null) {
    updateLead({ id: lead.id, updates: { rating: value } })
  }

  function handleSaveNote() {
    const contenido = noteText.trim()
    if (!contenido) return
    addNote(
      { leadId: lead.id, contenido },
      { onSuccess: () => setNoteText('') },
    )
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

        {/* Rastreador de secuencia de captación */}
        {(d1msg || d3msg || d7msg) && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Secuencia de captación</p>
            <div className="flex gap-1.5">
              {(['d1', 'd3', 'd7'] as const).map((tipo) => {
                const label = tipo === 'd1' ? 'Día 1' : tipo === 'd3' ? 'Día 3' : 'Día 7'
                const done = sentTypes.has(tipo)
                const current = nextMsg === tipo
                return (
                  <span
                    key={tipo}
                    className={cn(
                      'text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors',
                      done
                        ? 'text-emerald-400 bg-emerald-950/40 border-emerald-900/50'
                        : current
                          ? 'text-amber-400 bg-amber-950/40 border-amber-800/60 animate-pulse'
                          : 'text-zinc-600 bg-zinc-900 border-zinc-800',
                    )}
                  >
                    {done ? '✓' : current ? '▶' : ''} {label} {sentTypes.has(tipo) ? 'enviado' : ''}
                  </span>
                )
              })}
            </div>
            {nextMsg && nextMsgText && phone && (
              <button
                onClick={handleRecordSent}
                disabled={recording}
                className="w-full text-xs py-2 bg-amber-600/20 hover:bg-amber-600/30 disabled:opacity-50 text-amber-300 border border-amber-800/50 rounded-lg transition-colors"
              >
                {recording ? '⏳ Registrando...' : `✓ Marcar ${nextMsg === 'd1' ? 'Día 1' : nextMsg === 'd3' ? 'Día 3' : 'Día 7'} como enviado`}
              </button>
            )}
            {!nextMsg && (
              <p className="text-[11px] text-emerald-400">Secuencia de captación completa. Seguí con el escalado.</p>
            )}
          </div>
        )}

        {/* Datos del lead — completar campos faltantes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Datos del lead</p>
            {!editing && (
              <button
                onClick={startEdit}
                className="text-xs px-2 py-0.5 rounded border border-zinc-800 text-zinc-500 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
              >
                ✎ Editar
              </button>
            )}
          </div>

          {/* Rating con estrellas — clic para cargar/quitar */}
          <div className="flex items-center justify-between gap-3 bg-zinc-900/60 border border-zinc-800 rounded-lg px-3 py-2">
            <span className="text-xs text-zinc-400">Rating</span>
            <div className="flex items-center gap-2">
              <StarRating value={lead.rating} onChange={handleRating} />
              <span className="text-[11px] text-zinc-600 tabular-nums w-10 text-right">
                {lead.rating != null ? lead.rating : '—'}
              </span>
            </div>
          </div>

          {!editing ? (
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
              <div className="flex items-center gap-2 pt-0.5">
                <span className="text-[11px] text-zinc-600">Prioridad:</span>
                <span className={cn(
                  'text-[10px] font-medium px-1.5 py-0.5 rounded-full border',
                  lead.prioridad === 'alta'  && 'text-red-400 bg-red-950/40 border-red-900/50',
                  lead.prioridad === 'media' && 'text-amber-400 bg-amber-950/40 border-amber-900/50',
                  lead.prioridad === 'baja'  && 'text-zinc-400 bg-zinc-800 border-zinc-700',
                )}>
                  {lead.prioridad}
                </span>
                {(lead.tags ?? []).length > 0 && (
                  <span className="text-[11px] text-zinc-600 truncate">
                    {(lead.tags ?? []).map((t) => `#${t}`).join(' ')}
                  </span>
                )}
              </div>
              {!lead.telefono && !lead.web && !lead.direccion && (
                <p className="text-xs text-zinc-600">Sin datos de contacto cargados.</p>
              )}
            </div>
          ) : (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className={labelCls}>Teléfono</label>
                  <input
                    className={inputCls}
                    placeholder="Ej: 3815123456"
                    value={editForm.telefono}
                    onChange={(e) => setEdit('telefono', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Sitio web</label>
                  <input
                    className={inputCls}
                    placeholder="Ej: https://..."
                    value={editForm.web}
                    onChange={(e) => setEdit('web', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Rubro</label>
                  <input
                    className={inputCls}
                    placeholder="Ej: Farmacia"
                    value={editForm.rubro}
                    onChange={(e) => setEdit('rubro', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Ciudad</label>
                  <input
                    className={inputCls}
                    placeholder="Ej: Tucumán"
                    value={editForm.ciudad}
                    onChange={(e) => setEdit('ciudad', e.target.value)}
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className={labelCls}>Dirección</label>
                  <input
                    className={inputCls}
                    placeholder="Ej: Av. Sarmiento 1234"
                    value={editForm.direccion}
                    onChange={(e) => setEdit('direccion', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Prioridad</label>
                  <select
                    className={inputCls}
                    value={editForm.prioridad}
                    onChange={(e) => setEdit('prioridad', e.target.value as LeadPriority)}
                  >
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Tags</label>
                  <input
                    className={inputCls}
                    placeholder="separados, por coma"
                    value={editForm.tags}
                    onChange={(e) => setEdit('tags', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Observaciones</label>
                <textarea
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-zinc-600 transition-colors resize-none"
                  placeholder="Notas sobre el lead..."
                  value={editForm.observaciones}
                  onChange={(e) => setEdit('observaciones', e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-1 border-t border-zinc-800">
                <button
                  onClick={() => setEditing(false)}
                  disabled={savingLead}
                  className="text-xs px-3 py-1.5 border border-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveEdit}
                  disabled={savingLead}
                  className="text-xs px-3 py-1.5 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-medium rounded-lg transition-colors"
                >
                  {savingLead ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          )}
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
              {nextStep && (
                <div className="pt-1.5 mt-1.5 border-t border-zinc-800">
                  <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wide mb-1">Siguiente paso</p>
                  <p className="text-xs text-amber-200/90 leading-relaxed">{nextStep}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mensajes */}
        {(d1msg || d3msg || d7msg) && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Mensajes de captación</p>
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

        {/* Fase 2 — Escalado y cierre */}
        {(ctaCall || objPrecio || objPensar || objPresupuesto) && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Escalado y cierre</p>
            <div className="space-y-2">
              {ctaCall && (
                <MessageBlock
                  label="Agendar la llamada/consulta"
                  message={ctaCall}
                  waLink={phone ? `https://wa.me/${phone}?text=${encodeURIComponent(ctaCall)}` : undefined}
                />
              )}
              {objPrecio && (
                <MessageBlock
                  label="Objeción · está caro"
                  message={objPrecio}
                  waLink={phone ? `https://wa.me/${phone}?text=${encodeURIComponent(objPrecio)}` : undefined}
                />
              )}
              {objPensar && (
                <MessageBlock
                  label="Objeción · lo tengo que pensar"
                  message={objPensar}
                  waLink={phone ? `https://wa.me/${phone}?text=${encodeURIComponent(objPensar)}` : undefined}
                />
              )}
              {objPresupuesto && (
                <MessageBlock
                  label="Objeción · no tengo presupuesto / ahora no"
                  message={objPresupuesto}
                  waLink={phone ? `https://wa.me/${phone}?text=${encodeURIComponent(objPresupuesto)}` : undefined}
                />
              )}
            </div>
          </div>
        )}

        {/* Observaciones */}
        {!editing && lead.observaciones && (
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

        {/* Nota de contacto */}
        <div className="space-y-2 pt-4 border-t border-zinc-800">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Nota de contacto</p>
          <textarea
            rows={3}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Qué pasó en el contacto: qué se habló, qué respondió, acuerdos, próximos pasos..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-zinc-600 transition-colors resize-none"
          />
          <button
            onClick={handleSaveNote}
            disabled={savingNote || !noteText.trim()}
            className="w-full text-xs py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-200 border border-zinc-700 rounded-lg transition-colors"
          >
            {savingNote ? '⏳ Guardando...' : '+ Agregar nota'}
          </button>

          {notes.length > 0 && (
            <div className="space-y-2 pt-1">
              {notes.map((n) => (
                <div key={n.id} className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3">
                  <p className="text-[10px] text-zinc-600 mb-1">{formatDateTime(n.created_at)}</p>
                  <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">{n.contenido}</p>
                </div>
              ))}
            </div>
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