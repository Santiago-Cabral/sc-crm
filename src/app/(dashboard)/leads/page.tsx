'use client'
import { Header } from '@/components/layout/Header'
import { LeadCard } from '@/components/leads/LeadCard'
import { LeadDetailPanel } from '@/components/leads/LeadDetailPanel'
import { useLeads, useLead } from '@/features/leads/leads.queries'
import { useFiltersStore } from '@/store/filtersStore'
import { useUIStore } from '@/store/uiStore'
import { cn } from '@/lib/utils'
import { PIPELINE_STAGE_LABELS } from '@/types/pipeline.types'
import type { PipelineStage, LeadPriority, LeadTemperature } from '@/types/lead.types'

export default function LeadsPage() {
  const { filters, setFilter, resetFilters } = useFiltersStore()
  const { data: leads = [], isLoading, error } = useLeads(filters)
  const { selectedLeadId, selectLead } = useUIStore()
  const { data: selectedLead } = useLead(selectedLeadId ?? '')

  const hasActiveFilters = !!(
    filters.search ||
    filters.etapa ||
    filters.prioridad ||
    filters.temperatura ||
    filters.sin_web ||
    filters.seguimiento_hoy
  )

  return (
    <div className="flex flex-1 overflow-hidden">

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title="Leads" />

        <div className="flex-1 overflow-y-auto p-6">

          {/* Search y filtros */}
          <div className="flex gap-3 mb-4 flex-wrap">
            <input
              type="text"
              placeholder="Buscar por nombre, rubro, ciudad..."
              value={filters.search || ''}
              onChange={(e) => setFilter('search', e.target.value)}
              className="flex-1 min-w-60 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-zinc-600 transition-colors"
            />
            <select
              value={filters.etapa || ''}
              onChange={(e) => setFilter('etapa', (e.target.value as PipelineStage) || undefined)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-400 outline-none cursor-pointer"
            >
              <option value="">Todas las etapas</option>
              {(['nuevo','contactado','respondio','reunion','propuesta','negociacion','cerrado','perdido'] as PipelineStage[]).map(s => (
                <option key={s} value={s}>{PIPELINE_STAGE_LABELS[s]}</option>
              ))}
            </select>
            <select
              value={filters.prioridad || ''}
              onChange={(e) => setFilter('prioridad', (e.target.value as LeadPriority) || undefined)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-400 outline-none cursor-pointer"
            >
              <option value="">Toda prioridad</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
            <select
              value={filters.temperatura || ''}
              onChange={(e) => setFilter('temperatura', (e.target.value as LeadTemperature) || undefined)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-400 outline-none cursor-pointer"
            >
              <option value="">Temperatura</option>
              <option value="caliente">🔥 Caliente</option>
              <option value="tibio">🌡️ Tibio</option>
              <option value="frio">❄️ Frío</option>
            </select>
          </div>

          {/* Filtros rápidos */}
          <div className="flex gap-2 mb-6 flex-wrap items-center">
            {[
              { label: 'Todos', action: resetFilters, active: !hasActiveFilters },
              { label: '⏰ Seguimiento hoy', action: () => setFilter('seguimiento_hoy', true), active: !!filters.seguimiento_hoy },
              { label: 'Sin web', action: () => setFilter('sin_web', true), active: !!filters.sin_web },
            ].map((f) => (
              <button
                key={f.label}
                onClick={f.action}
                className={cn(
                  'text-xs px-3 py-1.5 rounded-full border transition-colors',
                  f.active
                    ? 'border-zinc-600 text-zinc-200 bg-zinc-800'
                    : 'border-zinc-800 text-zinc-500 hover:text-zinc-200 hover:border-zinc-600'
                )}
              >
                {f.label}
              </button>
            ))}

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors ml-1"
              >
                Limpiar filtros ×
              </button>
            )}

            <span className="ml-auto text-xs text-zinc-600 self-center">
              {leads.length} leads
            </span>
          </div>

          {/* Estados */}
          {isLoading && (
            <div className="text-center py-20 text-zinc-600 text-sm">Cargando leads...</div>
          )}
          {error && (
            <div className="text-center py-20 text-red-400 text-sm">
              Error al cargar leads. Verificá la conexión con Supabase.
            </div>
          )}
          {!isLoading && !error && leads.length === 0 && (
            <div className="text-center py-20 text-zinc-600 text-sm">
              {hasActiveFilters
                ? 'No hay leads que coincidan con los filtros.'
                : 'No hay leads todavía. Importá desde CSV.'}
            </div>
          )}

          {/* Grid */}
          {!isLoading && leads.length > 0 && (
            <div className={cn(
              'grid gap-4',
              selectedLeadId
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3'
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            )}>
              {leads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onSelect={(l) => selectLead(l.id === selectedLeadId ? null : l.id)}
                />
              ))}
            </div>
          )}

        </div>
      </div>

      {/* Panel lateral */}
      {selectedLeadId && selectedLead && (
        <div className="w-80 xl:w-96 shrink-0 overflow-hidden">
          <LeadDetailPanel lead={selectedLead} />
        </div>
      )}

    </div>
  )
}