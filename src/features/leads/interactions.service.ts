import { createClient } from '@/lib/supabase/client'
import type { Interaction, PipelineStage } from '@/types/lead.types'

export async function fetchInteractions(leadId: string): Promise<Interaction[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('interactions')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Interaction[]
}

export async function logInteraction(
  interaction: Partial<Interaction> & { lead_id: string; tipo: Interaction['tipo'] },
): Promise<Interaction> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('interactions')
    .insert(interaction)
    .select()
    .single()
  if (error) throw error
  return data as Interaction
}

// Siguiente fecha de follow-up según el mensaje que se acaba de enviar.
// La secuencia del prompt es: D1 → +3 días, D3 → +4 días (hace el día 7),
// D7 → fin de la secuencia de captación (sin fecha de follow-up automática).
function nextFollowUpFor(mensajeTipo: Interaction['mensaje_tipo']): string | null {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  if (mensajeTipo === 'd1') {
    now.setDate(now.getDate() + 3)
    return now.toISOString().split('T')[0]
  }
  if (mensajeTipo === 'd3') {
    now.setDate(now.getDate() + 4)
    return now.toISOString().split('T')[0]
  }
  return null
}

export async function recordMessageSent(params: {
  leadId: string
  mensajeTipo: 'd1' | 'd3' | 'd7'
  waLink: string
  etapaAnterior: PipelineStage
  fechaPrimerContacto: string | null
}): Promise<void> {
  const supabase = createClient()
  const nowIso = new Date().toISOString()
  const nextFollowUp = nextFollowUpFor(params.mensajeTipo)

  const updates: Record<string, unknown> = {
    fecha_ultimo_contacto: nowIso,
    next_follow_up: nextFollowUp,
    // Solo setear la primera vez (no pisar si el lead ya tiene registro)
    fecha_primer_contacto: params.fechaPrimerContacto ?? nowIso,
  }

  // Avanzar la etapa del pipeline de forma natural: al mandar el D1 pasamos
  // de "nuevo" a "contactado". El resto de las etapas las maneja Santiago.
  const etapaNueva: PipelineStage =
    params.etapaAnterior === 'nuevo' ? 'contactado' : params.etapaAnterior

  updates.etapa = etapaNueva

  const { error: updateError } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', params.leadId)
  if (updateError) throw updateError

  await logInteraction({
    lead_id: params.leadId,
    tipo: 'whatsapp',
    mensaje_tipo: params.mensajeTipo,
    wa_link: params.waLink,
    titulo:
      params.mensajeTipo === 'd1'
        ? 'Primer contacto (Día 1)'
        : params.mensajeTipo === 'd3'
          ? 'Seguimiento (Día 3)'
          : 'Cierre de captación (Día 7)',
    etapa_anterior: params.etapaAnterior,
    etapa_nueva: params.etapaAnterior === 'nuevo' ? 'contactado' : params.etapaAnterior,
  })
}
