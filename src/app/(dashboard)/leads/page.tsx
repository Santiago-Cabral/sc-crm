'use client'
import { Header } from '@/components/layout/Header'
import { LeadCard } from '@/components/leads/LeadCard'
import { useLeads } from '@/features/leads/leads.queries'
import { useFiltersStore } from '@/store/filtersStore'

export default function LeadsPage() {
  const { filters, setFilter } = useFiltersStore()
  const { data: leads = [], isLoading, error } = useLeads(filters)

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="Leads" />

      <div className="flex-1 overflow-y-auto p-6">

        {/* Search y filtros */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <input
            type="text"
            placeholder="Buscar por nombre, rubro, ciudad..."
            value={filters.search || ''}
            onChange={(e) => setFilter('search', e.target.value)}
            className="flex-1 min-w-60 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-zinc-600 transition-colors"
          />
          <select
            value={filters.etapa || ''}
            onChange={(e) => setFilter('etapa', e.target.value as any || undefined)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-400 outline-none cursor-pointer"
          >
            <option value="">Todas las etapas</option>
            <option value="nuevo">Nuevo</option>
            <option value="contactado">Contactado</option>
            <option value="respondio">Respondió</option>
            <option value="reunion">Reunión</option>
            <option value="propuesta">Propuesta</option>
            <option value="negociacion">Negociación</option>
            <option value="cerrado">Cerrado</option>
            <option value="perdido">Perdido</option>
          </select>
          <select
            value={filters.prioridad || ''}
            onChange={(e) => setFilter('prioridad', e.target.value as any || undefined)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-400 outline-none cursor-pointer"
          >
            <option value="">Toda prioridad</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
          <select
            value={filters.temperatura || ''}
            onChange={(e) => setFilter('temperatura', e.target.value as any || undefined)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-400 outline-none cursor-pointer"
          >
            <option value="">Temperatura</option>
            <option value="caliente">🔥 Caliente</option>
            <option value="tibio">🌡️ Tibio</option>
            <option value="frio">❄️ Frío</option>
          </select>
        </div>

        {/* Filtros rápidos */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { label: 'Todos', action: () => { setFilter('sin_web', undefined); setFilter('seguimiento_hoy', undefined) } },
            { label: '⏰ Seguimiento hoy', action: () => setFilter('seguimiento_hoy', true) },
            { label: 'Sin web', action: () => setFilter('sin_web', true) },
          ].map((f) => (
            <button
              key={f.label}
              onClick={f.action}
              className="text-xs px-3 py-1.5 rounded-full border border-zinc-800 text-zinc-500 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
            >
              {f.label}
            </button>
          ))}

          <span className="ml-auto text-xs text-zinc-600 self-center">
            {leads.length} leads
          </span>
        </div>

        {/* Grid */}
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
            No hay leads todavía. Importá desde CSV o Google Sheets.
          </div>
        )}

        {!isLoading && leads.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {leads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}