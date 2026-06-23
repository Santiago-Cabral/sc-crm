'use client'
import { Sidebar } from '@/components/layout/Sidebar'
import { useUIStore } from '@/store/uiStore'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { sidebarOpen } = useUIStore()

  return (
    <div className="flex h-screen bg-zinc-950">
      <Sidebar />
      <main
        className="flex-1 flex flex-col overflow-hidden transition-all duration-200"
        style={{ marginLeft: sidebarOpen ? '224px' : '56px' }}
      >
        {children}
      </main>
    </div>
  )
}