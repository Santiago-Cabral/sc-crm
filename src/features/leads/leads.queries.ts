import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchLeads,
  fetchLeadById,
  createLead,
  updateLead,
  updateLeadStage,
  deleteLead,
  analyzeLeadWithAI,
} from './leads.service'
import { fetchInteractions, recordMessageSent } from './interactions.service'
import type { Lead, LeadFilters, PipelineStage, Interaction } from '@/types/lead.types'

export const LEADS_KEY = 'leads'

export function useLeads(filters: LeadFilters = {}) {
  return useQuery({
    queryKey: [LEADS_KEY, filters],
    queryFn: () => fetchLeads(filters),
  })
}

export function useLead(id: string) {
  return useQuery({
    queryKey: [LEADS_KEY, id],
    queryFn: () => fetchLeadById(id),
    enabled: !!id,
  })
}

export function useCreateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (lead: Partial<Lead>) => createLead(lead),
    onSuccess: () => qc.invalidateQueries({ queryKey: [LEADS_KEY] }),
  })
}

export function useUpdateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Lead> }) =>
      updateLead(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: [LEADS_KEY] }),
  })
}

export function useUpdateLeadStage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, etapa }: { id: string; etapa: PipelineStage }) =>
      updateLeadStage(id, etapa),
    onMutate: async ({ id, etapa }) => {
      await qc.cancelQueries({ queryKey: [LEADS_KEY] })
      const previous = qc.getQueriesData({ queryKey: [LEADS_KEY] })
      qc.setQueriesData({ queryKey: [LEADS_KEY] }, (old: any) =>
        Array.isArray(old) ? old.map((l: Lead) => l.id === id ? { ...l, etapa } : l) : old
      )
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      ctx?.previous?.forEach(([key, data]) => qc.setQueryData(key, data))
    },
    onSettled: () => qc.invalidateQueries({ queryKey: [LEADS_KEY] }),
  })
}

export function useDeleteLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteLead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [LEADS_KEY] }),
  })
}
export function useAnalyzeLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (lead: Lead) => analyzeLeadWithAI(lead),
    onSuccess: () => qc.invalidateQueries({ queryKey: [LEADS_KEY] }),
  })
}

export function useInteractions(leadId: string) {
  return useQuery({
    queryKey: [LEADS_KEY, leadId, 'interactions'],
    queryFn: () => fetchInteractions(leadId),
    enabled: !!leadId,
  })
}

export function useRecordMessageSent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: Parameters<typeof recordMessageSent>[0]) => recordMessageSent(params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [LEADS_KEY] })
    },
  })
}

export type { Interaction }