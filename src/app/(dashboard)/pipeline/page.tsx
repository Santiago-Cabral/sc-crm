'use client'
import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { useLeads } from '@/features/leads/leads.queries'
import { useUpdateLeadStage } from '@/features/leads/leads.queries'
import { PIPELINE_STAGES, PIPELINE_STAGE_LABELS } from '@/types/pipeline.types'
import type { Lead, PipelineStage } from '@/types/lead.types'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'

function KanbanCard({ lead, isDragging }: { lead: Lead; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: lead.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'bg-zinc-900 border border-zinc-800 rounded-lg p-3 cursor-grab active:cursor-grabbing select-none',
        isDragging && 'opacity-50',
        lead.prioridad === 'alta' && 'border-l-2 border-l-red-500',
        lead.prioridad === 'media' && 'border-l-2 border-l-amber-500',
      )}
    >
      <p className="text-sm font-medium text-zinc-100 mb-1">{lead.nombre}</p>
      <p className="text-xs text-zinc-500">{lead.rubro} · {lead.ciudad}</p>
      {lead.temperatura && (
        <span className={cn(
          'inline-block text-xs px-2 py-0.5 rounded-full mt-2',
          lead.temperatura === 'caliente' && 'bg-red-950/50 text-red-400',
          lead.temperatura === 'tibio'    && 'bg-amber-950/50 text-amber-400',
          lead.temperatura === 'frio'     && 'bg-blue-950/50 text-blue-400',
        )}>
          {lead.temperatura}
        </span>
      )}
      {lead.rating && (
        <p className="text-xs text-amber-400 mt-1">★ {lead.rating}</p>
      )}
    </div>
  )
}

function KanbanColumn({ stage, leads }: { stage: PipelineStage; leads: Lead[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })

  const stageColors: Record<PipelineStage, string> = {
    nuevo:       'text-blue-400',
    contactado:  'text-purple-400',
    respondio:   'text-yellow-400',
    reunion:     'text-orange-400',
    propuesta:   'text-cyan-400',
    negociacion: 'text-pink-400',
    cerrado:     'text-green-400',
    perdido:     'text-zinc-500',
  }

  return (
    <div className="flex flex-col w-64 shrink-0">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <span className={cn('text-xs font-semibold uppercase tracking-wide', stageColors[stage])}>
          {PIPELINE_STAGE_LABELS[stage]}
        </span>
        <span className="text-xs text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full">
          {leads.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex flex-col gap-2 flex-1 min-h-24 rounded-xl p-2 transition-colors',
          isOver ? 'bg-zinc-800/50' : 'bg-zinc-900/30'
        )}
      >
        <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map(lead => (
            <KanbanCard key={lead.id} lead={lead} />
          ))}
        </SortableContext>

        {leads.length === 0 && (
          <p className="text-xs text-zinc-700 text-center py-4">Sin leads</p>
        )}
      </div>
    </div>
  )
}

export default function PipelinePage() {
  const { data: leads = [] } = useLeads()
  const { mutate: updateStage } = useUpdateLeadStage()
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const activeLead = leads.find(l => l.id === activeId)

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const leadId = active.id as string
    const overId = over.id as string

    // Si soltó sobre una columna (stage)
    if (PIPELINE_STAGES.includes(overId as PipelineStage)) {
      const lead = leads.find(l => l.id === leadId)
      if (lead && lead.etapa !== overId) {
        updateStage({ id: leadId, etapa: overId as PipelineStage })
      }
      return
    }

    // Si soltó sobre otro lead, usar la etapa de ese lead
    const targetLead = leads.find(l => l.id === overId)
    if (targetLead) {
      const lead = leads.find(l => l.id === leadId)
      if (lead && lead.etapa !== targetLead.etapa) {
        updateStage({ id: leadId, etapa: targetLead.etapa })
      }
    }
  }

  const columns = PIPELINE_STAGES.map(stage => ({
    stage,
    leads: leads.filter(l => l.etapa === stage),
  }))

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="Pipeline" />
      <div className="flex-1 overflow-x-auto p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 h-full pb-4">
            {columns.map(col => (
              <KanbanColumn key={col.stage} stage={col.stage} leads={col.leads} />
            ))}
          </div>

          <DragOverlay>
            {activeLead && (
              <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-xl w-64 rotate-2">
                <p className="text-sm font-medium text-zinc-100">{activeLead.nombre}</p>
                <p className="text-xs text-zinc-500">{activeLead.rubro}</p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}