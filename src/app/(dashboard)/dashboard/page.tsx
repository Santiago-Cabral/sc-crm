import { Header } from '@/components/layout/Header'

export default function DashboardPage() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="Dashboard" />
      <div className="flex-1 overflow-y-auto p-6">

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {[
            { label: 'Total leads',       value: '—', color: 'text-zinc-100' },
            { label: 'Sin contactar',     value: '—', color: 'text-blue-400' },
            { label: 'Seguimiento hoy',   value: '—', color: 'text-amber-400' },
            { label: 'Calientes',         value: '—', color: 'text-red-400' },
            { label: 'Cerrados',          value: '—', color: 'text-green-400' },
            { label: 'Conversión',        value: '—', color: 'text-purple-400' },
          ].map((stat) => (
            <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs text-zinc-500 mb-2">{stat.label}</p>
              <p className={`text-2xl font-semibold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Placeholder */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
          <p className="text-zinc-500 text-sm">El dashboard con métricas reales se completa cuando haya leads cargados.</p>
        </div>

      </div>
    </div>
  )
}