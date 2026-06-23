import { createClient } from '@/lib/supabase/client'
import type { Lead, LeadFilters, PipelineStage } from '@/types/lead.types'

export async function fetchLeads(filters: LeadFilters = {}): Promise<Lead[]> {
  const supabase = createClient()

  let query = supabase
    .from('leads')
    .select('*')
    .is('deleted_at', null)

  if (filters.search) {
    query = query.or(
      `nombre.ilike.%${filters.search}%,rubro.ilike.%${filters.search}%,ciudad.ilike.%${filters.search}%`
    )
  }
  if (filters.etapa)       query = query.eq('etapa', filters.etapa)
  if (filters.prioridad)   query = query.eq('prioridad', filters.prioridad)
  if (filters.temperatura) query = query.eq('temperatura', filters.temperatura)
  if (filters.rubro)       query = query.ilike('rubro', `%${filters.rubro}%`)
  if (filters.ciudad)      query = query.ilike('ciudad', `%${filters.ciudad}%`)
  if (filters.sin_web)     query = query.eq('tiene_web', false)
  if (filters.seguimiento_hoy) {
    query = query.lte('next_follow_up', new Date().toISOString().split('T')[0])
  }
  if (filters.tags?.length) query = query.overlaps('tags', filters.tags)

  const sortField = filters.sort || 'created_at'
  query = query.order(sortField, { ascending: filters.order === 'asc' })

  const { data, error } = await query
  if (error) throw error
  return data as Lead[]
}

export async function fetchLeadById(id: string): Promise<Lead> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Lead
}

export async function createLead(lead: Partial<Lead>): Promise<Lead> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('leads')
    .insert(lead)
    .select()
    .single()
  if (error) throw error
  return data as Lead
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', id)
  if (error) throw error
}

export async function updateLeadStage(id: string, etapa: PipelineStage): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('leads')
    .update({ etapa })
    .eq('id', id)
  if (error) throw error
}

export async function deleteLead(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('leads')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}