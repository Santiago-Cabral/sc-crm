'use client'
import { Header } from '@/components/layout/Header'
import { useLeads } from '@/features/leads/leads.queries'
import { PIPELINE_STAGE_LABELS } from '@/types/pipeline.types'
import type { Lead, PipelineStage, LeadTemperature } from '@/types/lead.types'
import { cn } from '@/lib/utils'

/* ─── helpers ─── */
function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

function groupBy<T>(arr: T[], fn: (item: T) => string): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const key = fn(item)
    ;(acc[key] ??= []).push(item)
    return acc
  }, {} as Record<string, T[]>)
}

/* ─── UI primitives ─── */

function SectionCard({
  children,
  className,
  title,
  subtitle,
  action,
}: {
  children: React.ReactNode
  className?: string
  title?: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className={cn('bg-zinc-900 border border-zinc-800/80 rounded-2xl', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <div>
            {title && (
              <h3 className="text-sm font-medium text-zinc-200">{title}</h3>
            )}
            {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={cn(!title && !action && 'pt-5', 'px-5 pb-5')}>{children}</div>
    </div>
  )
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max ? (value / max) * 100 : 0
  return (
    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
      <div
        className={cn('h-full rounded-full transition-all duration-500', color)}
        style={{ width: `${Math.max(pct, value > 0 ? 4 : 0)}%` }}
      />
    </div>
  )
}

function Empty({ text = 'Sin datos todavía' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <svg
        className="w-8 h-8 text-zinc-700 mb-2"
        fill="none"
        stroke="currentColor"
        strokeWidth={1}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
        />
      </svg>
      <p className="text-xs text-zinc-600">{text}</p>
    </div>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles = {
    alta: 'bg-red-500/10 text-red-400 border-red-500/20',
    media: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    baja: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  }
  return (
    <span
      className={cn(
        'text-[10px] font-medium px-1.5 py-0.5 rounded-full border',
        styles[priority as keyof typeof styles] ?? styles.baja,
      )}
    >
      {priority}
    </span>
  )
}

function TemperatureBadge({ temp }: { temp: LeadTemperature | null }) {
  if (!temp) return <span className="text-xs text-zinc-600">—</span>
  const styles = {
    caliente: 'text-red-400',
    tibio: 'text-amber-400',
    frio: 'text-blue-400',
  }
  const icons = {
    caliente: '🔥',
    tibio: '🌤',
    frio: '❄',
  }
  return (
    <span className={cn('text-xs font-medium', styles[temp])}>
      {icons[temp]} {temp}
    </span>
  )
}

function FollowUpDate({ date }: { date: string | null }) {
  if (!date) return <span className="text-xs text-zinc-600">—</span>
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(date + 'T00:00:00')
  const diffMs = d.getTime() - today.getTime()
  const diffDays = Math.round(diffMs / 86400000)

  if (diffDays < 0) {
    return <span className="text-xs font-medium text-red-400">{Math.abs(diffDays)}d vencido</span>
  }
  if (diffDays === 0) return <span className="text-xs font-medium text-amber-400">Hoy</span>
  if (diffDays === 1) return <span className="text-xs font-medium text-amber-300">Mañana</span>
  return <span className="text-xs text-zinc-500">en {diffDays}d</span>
}

/* ─── Constants ─── */
const STAGE_ORDER: PipelineStage[] = [
  'nuevo',
  'contactado',
  'respondio',
  'reunion',
  'propuesta',
  'negociacion',
  'cerrado',
  'perdido',
]

const STAGE_BG_COLORS: Record<PipelineStage, string> = {
  nuevo: 'bg-blue-500',
  contactado: 'bg-purple-500',
  respondio: 'bg-yellow-500',
  reunion: 'bg-orange-500',
  propuesta: 'bg-cyan-500',
  negociacion: 'bg-pink-500',
  cerrado: 'bg-emerald-500',
  perdido: 'bg-zinc-600',
}

const TEMP_CONFIG: Record<LeadTemperature, { color: string; bgColor: string; icon: string; label: string }> = {
  caliente: {
    color: 'text-red-400',
    bgColor: 'bg-red-500',
    icon: '🔥',
    label: 'Caliente',
  },
  tibio: {
    color: 'text-amber-400',
    bgColor: 'bg-amber-500',
    icon: '🌤',
    label: 'Tibio',
  },
  frio: {
    color: 'text-blue-400',
    bgColor: 'bg-blue-500',
    icon: '❄',
    label: 'Frío',
  },
}

/* ─── Main Page ─── */
export default function DashboardPage() {
  const { data: leads = [], isLoading } = useLeads()

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const weekStart = getWeekStart(today)
  const lastWeekStart = getWeekStart(new Date(weekStart.getTime() - 7 * 86400000))

  const leadsThisWeek = leads.filter((l) => new Date(l.created_at) >= weekStart).length
  const leadsLastWeek = leads.filter(
    (l) => new Date(l.created_at) >= lastWeekStart && new Date(l.created_at) < weekStart,
  ).length
  const weeklyChange = leadsLastWeek > 0 ? Math.round(((leadsThisWeek - leadsLastWeek) / leadsLastWeek) * 100) : null

  const activeLeads = leads.filter((l) => l.etapa !== 'cerrado' && l.etapa !== 'perdido')
  const potencialLeads = leads.filter((l) => l.etapa !== 'cerrado' && l.etapa !== 'perdido' && l.etapa !== 'nuevo')
  const conversionRate = leads.length > 0 ? Math.round((leads.filter((l) => l.etapa === 'cerrado').length / leads.length) * 100) : 0
  const avgAiScore =
    leads.filter((l) => l.ai_score != null).length > 0
      ? Math.round(leads.filter((l) => l.ai_score != null).reduce((sum, l) => sum + (l.ai_score ?? 0), 0) / leads.filter((l) => l.ai_score != null).length)
      : null
  const leadsConWeb = leads.filter((l) => l.tiene_web).length
  const sinWebPct = leads.length > 0 ? Math.round(((leads.length - leadsConWeb) / leads.length) * 100) : 0
  const topRubros = Object.entries(groupBy(leads, (l) => l.rubro || 'Sin rubro'))
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 6)
  const topCiudades = Object.entries(groupBy(leads, (l) => l.ciudad || 'Sin ciudad'))
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 5)
  const topSources = Object.entries(groupBy(leads, (l) => l.source || 'Desconocido'))
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 5)

  const byStage = STAGE_ORDER.map((stage) => ({
    stage,
    count: leads.filter((l) => l.etapa === stage).length,
    pct: leads.length ? Math.round((leads.filter((l) => l.etapa === stage).length / leads.length) * 100) : 0,
  }))
  const maxStageCount = Math.max(...byStage.map((s) => s.count), 1)

  const byTemp: { temp: LeadTemperature; count: number; pct: number }[] = (['caliente', 'tibio', 'frio'] as const).map((temp) => ({
    temp,
    count: leads.filter((l) => l.temperatura === temp).length,
    pct: leads.length ? Math.round((leads.filter((l) => l.temperatura === temp).length / leads.length) * 100) : 0,
  }))

  const vencidos = leads
    .filter((l) => l.next_follow_up && l.next_follow_up < todayStr && l.etapa !== 'cerrado' && l.etapa !== 'perdido')
    .sort((a, b) => (a.next_follow_up! < b.next_follow_up! ? -1 : 1))

  const seguimientoHoy = leads.filter((l) => l.next_follow_up && l.next_follow_up <= todayStr && l.etapa !== 'cerrado' && l.etapa !== 'perdido')

  const recientes = [...leads].sort((a, b) => (a.created_at > b.created_at ? -1 : 1)).slice(0, 5)

  const hoyLocal = today.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  if (isLoading) {
    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title="Dashboard" />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
            <p className="text-zinc-600 text-sm">Cargando dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="Dashboard" />

      <div className="flex-1 overflow-y-auto">
        {/* Header row */}
        <div className="px-6 pt-6 pb-0 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Resumen general</h2>
            <p className="text-xs text-zinc-500 capitalize">{hoyLocal}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-600">
              {leads.length} leads en total
            </span>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* ─── KPI Row ─── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <SectionCard className="!p-0">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                    Total leads
                  </span>
                  <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-zinc-100 tabular-nums tracking-tight">
                  {leads.length}
                </p>
                <div className="mt-2 h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-zinc-500 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
            </SectionCard>

            <SectionCard className="!p-0">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                    Nuevos esta semana
                  </span>
                  <svg className="w-4 h-4 text-blue-500/60" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex items-end gap-2">
                  <p className="text-3xl font-bold text-zinc-100 tabular-nums tracking-tight">
                    {leadsThisWeek}
                  </p>
                  {weeklyChange !== null && (
                    <span
                      className={cn(
                        'text-xs font-medium pb-1',
                        weeklyChange >= 0 ? 'text-emerald-400' : 'text-red-400',
                      )}
                    >
                      {weeklyChange >= 0 ? '↑' : '↓'} {Math.abs(weeklyChange)}%
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-600 mt-2">
                  semana anterior: {leadsLastWeek}
                </p>
              </div>
            </SectionCard>

            <SectionCard className="!p-0">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                    Conversión
                  </span>
                  <svg className="w-4 h-4 text-emerald-500/60" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-emerald-400 tabular-nums tracking-tight">
                  {conversionRate}%
                </p>
                <p className="text-[11px] text-zinc-600 mt-2">
                  {leads.filter((l) => l.etapa === 'cerrado').length} de {leads.length} cerrados
                </p>
              </div>
            </SectionCard>

            <SectionCard className="!p-0">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                    Score promedio
                  </span>
                  <svg className="w-4 h-4 text-violet-500/60" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-violet-400 tabular-nums tracking-tight">
                  {avgAiScore ?? '—'}
                </p>
                <p className="text-[11px] text-zinc-600 mt-2">
                  {leads.filter((l) => l.ai_score != null).length} leads analizados
                </p>
              </div>
            </SectionCard>

            <SectionCard className="!p-0">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                    En pipeline
                  </span>
                  <svg className="w-4 h-4 text-cyan-500/60" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-zinc-100 tabular-nums tracking-tight">
                  {activeLeads.length}
                </p>
                <p className="text-[11px] text-zinc-600 mt-2">
                  {potencialLeads.length} en progreso
                </p>
              </div>
            </SectionCard>

            <SectionCard className="!p-0">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                    Sin sitio web
                  </span>
                  <svg className="w-4 h-4 text-amber-500/60" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-amber-400 tabular-nums tracking-tight">
                  {sinWebPct}%
                </p>
                <p className="text-[11px] text-zinc-600 mt-2">
                  {leads.length - leadsConWeb} de {leads.length}
                </p>
              </div>
            </SectionCard>
          </div>

          {/* ─── Row 2: Pipeline + Temperatura + Actividad semanal ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Pipeline funnel */}
            <SectionCard title="Pipeline" subtitle="Leads por etapa" className="lg:col-span-2">
              {leads.length === 0 ? (
                <Empty />
              ) : (
                <div className="space-y-3 mt-1">
                  {byStage.map(({ stage, count, pct }) => (
                    <div key={stage} className="flex items-center gap-3">
                      <span className="text-xs text-zinc-400 w-28 shrink-0 truncate">
                        {PIPELINE_STAGE_LABELS[stage]}
                      </span>
                      <div className="flex-1">
                        <MiniBar value={count} max={maxStageCount} color={STAGE_BG_COLORS[stage]} />
                      </div>
                      <div className="flex items-center gap-2 w-20 shrink-0 justify-end">
                        <span className="text-sm font-medium text-zinc-300 tabular-nums">{count}</span>
                        <span className="text-[11px] text-zinc-600 tabular-nums w-8 text-right">
                          {pct}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Temperature breakdown */}
            <SectionCard title="Temperatura" subtitle="Distribución por temperatura">
              {leads.length === 0 ? (
                <Empty />
              ) : (
                <div className="space-y-4 mt-1">
                  {/* Stacked bar */}
                  <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                    {byTemp.map(
                      ({ temp, count }) =>
                        count > 0 && (
                          <div
                            key={temp}
                            className={cn('rounded-full transition-all duration-500', TEMP_CONFIG[temp].bgColor)}
                            style={{ width: `${(count / leads.length) * 100}%` }}
                            title={`${TEMP_CONFIG[temp].label}: ${count}`}
                          />
                        ),
                    )}
                  </div>

                  {/* Legend */}
                  {byTemp.map(({ temp, count, pct }) => (
                    <div key={temp} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={cn('w-2 h-2 rounded-full', TEMP_CONFIG[temp].bgColor)} />
                        <span className="text-xs text-zinc-400">
                          {TEMP_CONFIG[temp].icon} {TEMP_CONFIG[temp].label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-300 tabular-nums">{count}</span>
                        <span className="text-[11px] text-zinc-600 tabular-nums w-8 text-right">{pct}%</span>
                      </div>
                    </div>
                  ))}

                  {/* AI analysis stat */}
                  {avgAiScore !== null && (
                    <div className="mt-3 pt-3 border-t border-zinc-800/60">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-zinc-500">Score IA promedio</span>
                        <span className="text-sm font-semibold text-violet-400 tabular-nums">{avgAiScore}/100</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </SectionCard>
          </div>

          {/* ─── Row 3: Rubros + Ciudades + Fuentes ─── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Top rubros */}
            <SectionCard title="Rubros" subtitle="Top industrias">
              {topRubros.length === 0 ? (
                <Empty text="Sin datos de rubros" />
              ) : (
                <div className="space-y-3 mt-1">
                  {topRubros.map(([rubro, items]) => (
                    <div key={rubro} className="flex items-center gap-3">
                      <span className="text-xs text-zinc-400 w-28 shrink-0 truncate" title={rubro}>
                        {rubro}
                      </span>
                      <div className="flex-1">
                        <MiniBar
                          value={items.length}
                          max={topRubros[0][1].length}
                          color="bg-zinc-500"
                        />
                      </div>
                      <span className="text-sm font-medium text-zinc-300 tabular-nums w-6 text-right shrink-0">
                        {items.length}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Top ciudades */}
            <SectionCard title="Ciudades" subtitle="Distribución geográfica">
              {topCiudades.length === 0 ? (
                <Empty text="Sin datos de ciudades" />
              ) : (
                <div className="space-y-3 mt-1">
                  {topCiudades.map(([ciudad, items]) => (
                    <div key={ciudad} className="flex items-center gap-3">
                      <span className="text-xs text-zinc-400 w-28 shrink-0 truncate" title={ciudad}>
                        {ciudad}
                      </span>
                      <div className="flex-1">
                        <MiniBar
                          value={items.length}
                          max={topCiudades[0][1].length}
                          color="bg-zinc-500"
                        />
                      </div>
                      <span className="text-sm font-medium text-zinc-300 tabular-nums w-6 text-right shrink-0">
                        {items.length}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Fuentes */}
            <SectionCard title="Fuentes" subtitle="Origen de leads">
              {topSources.length === 0 ? (
                <Empty text="Sin datos de fuentes" />
              ) : (
                <div className="space-y-3 mt-1">
                  {topSources.map(([source, items]) => (
                    <div key={source} className="flex items-center gap-3">
                      <span className="text-xs text-zinc-400 w-28 shrink-0 truncate" title={source}>
                        {source}
                      </span>
                      <div className="flex-1">
                        <MiniBar
                          value={items.length}
                          max={topSources[0][1].length}
                          color="bg-zinc-500"
                        />
                      </div>
                      <span className="text-sm font-medium text-zinc-300 tabular-nums w-6 text-right shrink-0">
                        {items.length}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          {/* ─── Row 4: Últimos leads + Seguimiento ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Recent leads */}
            <SectionCard title="Últimos leads" subtitle="Agregados recientemente">
              {recientes.length === 0 ? (
                <Empty text="No hay leads recientes" />
              ) : (
                <div className="divide-y divide-zinc-800/50 -mx-5">
                  {recientes.map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-zinc-800/20 transition-colors">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-zinc-200 truncate">{lead.nombre}</p>
                          <PriorityBadge priority={lead.prioridad} />
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {lead.rubro && <span className="text-[11px] text-zinc-500">{lead.rubro}</span>}
                          {lead.rubro && lead.ciudad && <span className="text-zinc-700">·</span>}
                          {lead.ciudad && <span className="text-[11px] text-zinc-500">{lead.ciudad}</span>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end shrink-0 gap-0.5">
                        <TemperatureBadge temp={lead.temperatura} />
                        <span className="text-[11px] text-zinc-600">
                          {PIPELINE_STAGE_LABELS[lead.etapa]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Seguimientos pendientes */}
            <SectionCard
              title="Seguimientos"
              subtitle="Requieren atención"
              action={
                vencidos.length > 0 ? (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                    {vencidos.length} vencidos
                  </span>
                ) : undefined
              }
            >
              {seguimientoHoy.length === 0 ? (
                <Empty text="No hay seguimientos pendientes" />
              ) : (
                <div className="divide-y divide-zinc-800/50 -mx-5">
                  {seguimientoHoy.slice(0, 8).map((lead) => {
                    const isOverdue = lead.next_follow_up! < todayStr
                    return (
                      <div
                        key={lead.id}
                        className={cn(
                          'flex items-center justify-between gap-3 px-5 py-3 hover:bg-zinc-800/20 transition-colors',
                          isOverdue && 'bg-red-500/[0.03]',
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-zinc-200 truncate">{lead.nombre}</p>
                            {isOverdue && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                                vencido
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-0.5">
                            {PIPELINE_STAGE_LABELS[lead.etapa]}
                            {lead.rubro && ` · ${lead.rubro}`}
                          </p>
                        </div>
                        <FollowUpDate date={lead.next_follow_up} />
                      </div>
                    )
                  })}
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  )
}
