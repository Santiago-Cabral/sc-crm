'use client'
import { useUIStore } from '@/store/uiStore'

export function Header({ title }: { title: string }) {
  const { toggleSidebar } = useUIStore()

  return (
    <header className="h-14 border-b border-zinc-800 flex items-center px-6 gap-4 bg-zinc-950">
      <button
        onClick={toggleSidebar}
        className="text-zinc-500 hover:text-zinc-200 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>
      <h1 className="text-sm font-medium text-zinc-200">{title}</h1>
    </header>
  )
}