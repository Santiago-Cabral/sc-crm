'use client'
import { Header } from '@/components/layout/Header'
import { useLeads } from '@/features/leads/leads.queries'
import { PIPELINE_STAGE_LABELS } from '@/types/pipeline.types'
import type { PipelineStage } from '@/types/lead.types'
import { cn } from '@/lib/utils'

function StatCard({
  label,
  value,
  color,
  sub,
}: {
  label: string
  value: string | number
  color: string
  sub?: string
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-1">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={cn('text-2xl font-semibold tabular-nums', color)}>{value}</p>
      {sub && <p className="text-xs text-zinc-600">{sub}</p>}
    </div>
  )
}

const STAGE_ORDER: PipelineStage[] = [
  'nuevo', 'contactado', 'respondio', 'reunion',
  'propuesta', 'negociacion', 'cerrado', 'perdido',
]

const STAGE_COLORS: Record<PipelineStage, string> = {
  nuevo:       'bg-blue-400',
  contactado:  'bg-purple-400',
  respondio:   'bg-yellow-400',
  reunion:     'bg-orange-400',
  propuesta:   'bg-cyan-400',
  negociacion: 'bg-pink-400',
  cerrado:     'bg-green-400',
  perdido:     'bg-zinc-600',
}

export default function DashboardPage() {
  const { data: leads = [], isLoading } = useLeads()

  const today = new Date().toISOString().split('T')[0]

  const stats = {
    total:          leads.length,
    sinContactar:   leads.filter(l => l.etapa === 'nuevo').length,
    seguimientoHoy: leads.filter(l => l.next_follow_up && l.next_follow_up <= today).length,
    calientes:      leads.filter(l => l.temperatura === 'caliente').length,
    cerrados:       leads.filter(l => l.etapa === 'cerrado').length,
    conversion:     leads.length
      ? Math.round(leads.filter(l => l.etapa === 'cerrado').length / leads.length * 100)
      : 0,
  }

  // Leads por etapa para el funnel
  const byStage = STAGE_ORDER.map(stage => ({
    stage,
    count: leads.filter(l => l.etapa === stage).length,
    pct: leads.length ? Math.round(leads.filter(l => l.etapa === stage).length / leads.length * 100) : 0,
  }))

  // Leads con seguimiento vencido
  const vencidos = leads
    .filter(l => l.next_follow_up && l.next_follow_up < today && l.etapa !== 'cerrado' && l.etapa !== 'perdido')
    .sort((a, b) => (a.next_follow_up! < b.next_follow_up! ? -1 : 1))
    .slice(0, 5)

  // Leads calientes sin contactar
  const calientesSinContactar = leads
    .filter(l => l.temperatura === 'caliente' && l.etapa === 'nuevo')
    .slice(0, 5)

  if (isLoading) {
    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title="Dashboard" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-zinc-600 text-sm">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="Dashboard" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Total leads"     value={stats.total}          color="text-zinc-100" />
          <StatCard label="Sin contactar"   value={stats.sinContactar}   color="text-blue-400" />
          <StatCard label="Seguimiento hoy" value={stats.seguimientoHoy} color="text-amber-400" />
          <StatCard label="Calientes"       value={stats.calientes}      color="text-red-400" />
          <StatCard label="Cerrados"        value={stats.cerrados}       color="text-green-400" />
          <StatCard label="Conversión"      value={`${stats.conversion}%`} color="text-purple-400" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Funnel por etapas */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-4">Pipeline</h2>
            {leads.length === 0 ? (
              <p className="text-zinc-600 text-sm text-center py-6">Sin datos todavía</p>
            ) : (
              <div className="space-y-2">
                {byStage.map(({ stage, count, pct }) => (
                  <div key={stage} className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500 w-24 shrink-0">
                      {PIPELINE_STAGE_LABELS[stage]}
                    </span>
                    <div className="flex-1 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', STAGE_COLORS[stage])}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-zinc-500 w-6 text-right tabular-nums">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Panel derecho: alertas */}
          <div className="space-y-4">

            {/* Seguimientos vencidos */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">
                Seguimientos vencidos
                {vencidos.length > 0 && (
                  <span className="ml-2 text-red-400 normal-case font-normal">({vencidos.length})</span>
                )}
              </h2>
              {vencidos.length === 0 ? (
                <p className="text-zinc-600 text-xs">Todo al día 👍</p>
              ) : (
                <div className="space-y-2">
                  {vencidos.map(lead => (
                    <div key={lead.id} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs text-zinc-200 truncate">{lead.nombre}</p>
                        <p className="text-xs text-zinc-600">{lead.rubro} · {PIPELINE_STAGE_LABELS[lead.etapa]}</p>
                      </div>
                      <span className="text-xs text-red-400 shrink-0">{lead.next_follow_up}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Calientes sin contactar */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">
                🔥 Calientes sin contactar
                {calientesSinContactar.length > 0 && (
                  <span className="ml-2 text-red-400 normal-case font-normal">({calientesSinContactar.length})</span>
                )}
              </h2>
              {calientesSinContactar.length === 0 ? (
                <p className="text-zinc-600 text-xs">Ninguno por ahora</p>
              ) : (
                <div className="space-y-2">
                  {calientesSinContactar.map(lead => (
                    <div key={lead.id} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs text-zinc-200 truncate">{lead.nombre}</p>
                        <p className="text-xs text-zinc-600">{lead.rubro} · {lead.ciudad}</p>
                      </div>
                      {lead.ai_score && (
                        <span className="text-xs text-red-400 shrink-0">Score {lead.ai_score}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}