import { create } from 'zustand'

interface WhatsAppModal {
  open: boolean
  leadId: string | null
}

interface UIStore {
  // Sidebar
  sidebarOpen: boolean
  toggleSidebar: () => void

  // Vista de leads
  leadsView: 'grid' | 'table'
  setLeadsView: (v: 'grid' | 'table') => void

  // Lead seleccionado (panel lateral)
  selectedLeadId: string | null
  selectLead: (id: string | null) => void

  // Modal WhatsApp
  whatsappModal: WhatsAppModal
  openWhatsappModal: (leadId: string) => void
  closeWhatsappModal: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  leadsView: 'grid',
  setLeadsView: (leadsView) => set({ leadsView }),

  selectedLeadId: null,
  selectLead: (selectedLeadId) => set({ selectedLeadId }),

  whatsappModal: { open: false, leadId: null },
  openWhatsappModal: (leadId) => set({ whatsappModal: { open: true, leadId } }),
  closeWhatsappModal: () => set({ whatsappModal: { open: false, leadId: null } }),
}))