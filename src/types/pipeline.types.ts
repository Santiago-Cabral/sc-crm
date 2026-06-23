import type { PipelineStage } from './lead.types'

export const PIPELINE_STAGES: PipelineStage[] = [
  'nuevo',
  'contactado',
  'respondio',
  'reunion',
  'propuesta',
  'negociacion',
  'cerrado',
  'perdido',
]

export const PIPELINE_STAGE_LABELS: Record<PipelineStage, string> = {
  nuevo:       'Nuevo',
  contactado:  'Contactado',
  respondio:   'Respondió',
  reunion:     'Reunión',
  propuesta:   'Propuesta',
  negociacion: 'Negociación',
  cerrado:     'Cerrado',
  perdido:     'Perdido',
}

export const PIPELINE_STAGE_COLORS: Record<PipelineStage, string> = {
  nuevo:       'text-blue-400',
  contactado:  'text-purple-400',
  respondio:   'text-yellow-400',
  reunion:     'text-orange-400',
  propuesta:   'text-cyan-400',
  negociacion: 'text-pink-400',
  cerrado:     'text-green-400',
  perdido:     'text-zinc-500',
}