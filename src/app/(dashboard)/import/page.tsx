'use client'
import { useState, useRef } from 'react'
import { Header } from '@/components/layout/Header'
import { parseCSV } from '@/features/import/csv.parser'
import { createClient } from '@/lib/supabase/client'
import type { Lead } from '@/types/lead.types'

type Status = 'idle' | 'preview' | 'importing' | 'done' | 'error'

export default function ImportPage() {
  const [status, setStatus] = useState<Status>('idle')
  const [preview, setPreview] = useState<Partial<Lead>[]>([])
  const [result, setResult] = useState({ imported: 0, skipped: 0, total: 0 })
  const [errorMsg, setErrorMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const raw = ev.target?.result as string
      const { leads, total, skipped } = parseCSV(raw)
      setPreview(leads)
      setResult({ imported: 0, skipped, total })
      setStatus('preview')
    }
    reader.readAsText(file, 'UTF-8')
  }

  async function handleImport() {
    setStatus('importing')
    const supabase = createClient()
    const BATCH = 50
    let imported = 0

    try {
      for (let i = 0; i < preview.length; i += BATCH) {
        const batch = preview.slice(i, i + BATCH)
        const { error } = await supabase.from('leads').insert(batch)
        if (error) throw error
        imported += batch.length
      }
      setResult(r => ({ ...r, imported }))
      setStatus('done')
    } catch (e: any) {
      setErrorMsg(e.message)
      setStatus('error')
    }
  }

  function reset() {
    setStatus('idle')
    setPreview([])
    setErrorMsg('')
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="Importar leads" />
      <div className="flex-1 overflow-y-auto p-6 max-w-3xl">

        {/* Upload zone */}
        {status === 'idle' && (
          <div className="bg-zinc-900 border border-zinc-800 border-dashed rounded-xl p-12 text-center">
            <p className="text-zinc-400 text-sm mb-2">Subí tu archivo CSV</p>
            <p className="text-zinc-600 text-xs mb-6">
              Columnas soportadas: nombre, teléfono, dirección, web, rating, rubro, ciudad, prioridad, D1, D3, D7
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFile}
              className="hidden"
              id="csv-input"
            />
            <label
              htmlFor="csv-input"
              className="bg-green-500 hover:bg-green-400 text-black font-medium text-sm px-6 py-2.5 rounded-lg cursor-pointer transition-colors"
            >
              Seleccionar CSV
            </label>
          </div>
        )}

        {/* Preview */}
        {status === 'preview' && (
          <div className="flex flex-col gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-200 font-medium">{preview.length} leads listos para importar</p>
                <p className="text-xs text-zinc-500 mt-0.5">{result.skipped} filas omitidas (sin nombre)</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={reset}
                  className="text-sm px-4 py-2 border border-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleImport}
                  className="text-sm px-4 py-2 bg-green-500 hover:bg-green-400 text-black font-medium rounded-lg transition-colors"
                >
                  Importar {preview.length} leads
                </button>
              </div>
            </div>

            {/* Tabla preview */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      {['Nombre', 'Teléfono', 'Rubro', 'Ciudad', 'Web', 'Rating', 'Prioridad'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-zinc-500 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 20).map((lead, i) => (
                      <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                        <td className="px-4 py-2.5 text-zinc-200">{lead.nombre}</td>
                        <td className="px-4 py-2.5 text-zinc-500">{lead.telefono || '—'}</td>
                        <td className="px-4 py-2.5 text-zinc-500">{lead.rubro || '—'}</td>
                        <td className="px-4 py-2.5 text-zinc-500">{lead.ciudad}</td>
                        <td className="px-4 py-2.5 text-zinc-500">
                          {lead.web ? (
                            <span className="text-green-400">✓</span>
                          ) : (
                            <span className="text-red-400">✗</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-amber-400">{lead.rating || '—'}</td>
                        <td className="px-4 py-2.5">
                          <span className={
                            lead.prioridad === 'alta' ? 'text-red-400' :
                            lead.prioridad === 'media' ? 'text-amber-400' : 'text-zinc-500'
                          }>
                            {lead.prioridad}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 20 && (
                  <p className="text-xs text-zinc-600 px-4 py-3">
                    ... y {preview.length - 20} más
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Importing */}
        {status === 'importing' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
            <p className="text-zinc-400 text-sm">Importando leads...</p>
          </div>
        )}

        {/* Done */}
        {status === 'done' && (
          <div className="bg-zinc-900 border border-green-900/50 rounded-xl p-8 text-center">
            <p className="text-green-400 text-lg font-medium mb-1">✓ Importación completada</p>
            <p className="text-zinc-500 text-sm">{result.imported} leads importados correctamente</p>
            <button
              onClick={reset}
              className="mt-6 text-sm px-4 py-2 border border-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-200 transition-colors"
            >
              Importar otro archivo
            </button>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="bg-zinc-900 border border-red-900/50 rounded-xl p-8 text-center">
            <p className="text-red-400 text-sm font-medium mb-1">Error al importar</p>
            <p className="text-zinc-600 text-xs">{errorMsg}</p>
            <button
              onClick={reset}
              className="mt-6 text-sm px-4 py-2 border border-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-200 transition-colors"
            >
              Intentar de nuevo
            </button>
          </div>
        )}

      </div>
    </div>
  )
}