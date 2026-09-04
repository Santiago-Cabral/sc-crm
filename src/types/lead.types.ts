export type PipelineStage =
  | 'nuevo'
  | 'contactado'
  | 'respondio'
  | 'reunion'
  | 'propuesta'
  | 'negociacion'
  | 'cerrado'
  | 'perdido'

export type LeadTemperature = 'caliente' | 'tibio' | 'frio'
export type LeadPriority = 'alta' | 'media' | 'baja'

export interface LeadAIAnalysis {
  calificacion: LeadTemperature
  score: number
  motivo: string
  servicio_recomendado: string
  mensaje_d1: string
  mensaje_d3: string
  mensaje_d7: string
  siguiente_paso?: string
  cta_llamada?: string
  objecion_precio?: string
  objecion_pensar?: string
  objecion_presupuesto?: string
}

export interface Lead {
  id: string
  nombre: string
  telefono: string | null
  direccion: string | null
  web: string | null
  rating: number | null
  rubro: string | null
  ciudad: string
  etapa: PipelineStage
  prioridad: LeadPriority
  temperatura: LeadTemperature | null
  ai_score: number | null
  ai_analysis: LeadAIAnalysis | null
  mensaje_d1: string | null
  mensaje_d3: string | null
  mensaje_d7: string | null
  fecha_primer_contacto: string | null
  fecha_ultimo_contacto: string | null
  next_follow_up: string | null
  tags: string[]
  observaciones: string | null
  tiene_web: boolean
  source: string
  created_at: string
  updated_at: string
}

export interface LeadFilters {
  search?: string
  etapa?: PipelineStage
  prioridad?: LeadPriority
  temperatura?: LeadTemperature
  rubro?: string
  ciudad?: string
  sin_web?: boolean
  seguimiento_hoy?: boolean
  tags?: string[]
  sort?: 'rating' | 'ai_score' | 'created_at' | 'next_follow_up' | 'nombre'
  order?: 'asc' | 'desc'
}

export interface Interaction {
  id: string
  lead_id: string
  tipo: 'whatsapp' | 'llamada' | 'email' | 'reunion' | 'propuesta' | 'nota' | 'etapa_cambiada'
  titulo: string | null
  contenido: string | null
  etapa_anterior: PipelineStage | null
  etapa_nueva: PipelineStage | null
  mensaje_tipo: 'd1' | 'd3' | 'd7' | null
  wa_link: string | null
  created_at: string
}