import { create } from 'zustand'
import type { LeadFilters } from '@/types/lead.types'

interface FiltersStore {
  filters: LeadFilters
  setFilter: <K extends keyof LeadFilters>(key: K, value: LeadFilters[K]) => void
  resetFilters: () => void
}

const defaultFilters: LeadFilters = {
  search: '',
  sort: 'created_at',
  order: 'desc',
}

export const useFiltersStore = create<FiltersStore>((set) => ({
  filters: defaultFilters,
  setFilter: (key, value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value } })),
  resetFilters: () => set({ filters: defaultFilters }),
}))