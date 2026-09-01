'use client'
import { useState, useRef } from 'react'
import { Header } from '@/components/layout/Header'
import { parseCSV } from '@/features/import/csv.parser'
import { createClient } from '@/lib/supabase/client'
import type { Lead } from '@/types/lead.types'

type Status = 'idle' | 'preview' | 'importing' | 'done' | 'error'

// Campos que existen en la tabla leads de Supabase
const ALLOWED_FIELDS: (keyof Partial<Lead>)[] = [
  'nombre', 'telefono', 'direccion', 'web', 'rating',
  'rubro', 'ciudad', 'prioridad', 'etapa', 'tags',
  'mensaje_d1', 'mensaje_d3', 'mensaje_d7',
  'ai_analysis', 'source', 'observaciones',
]

// Normaliza el teléfono (solo dígitos) para comparar de forma confiable
function normPhone(p: string): string {
  return String(p || '').replace(/[^0-9]/g, '')
}

// Elimina campos undefined/null problemáticos y filtra solo lo que acepta Supabase
function sanitizeLead(lead: Partial<Lead>): Partial<Lead> {
  const result: Partial<Lead> = {}
  for (const key of ALLOWED_FIELDS) {
    const val = lead[key]
    if (val !== undefined && val !== '') {
      // @ts-ignore
      result[key] = val
    }
  }
  // tags: siempre array
  result.tags = Array.isArray(lead.tags) ? lead.tags : []
  // rating: asegurarse que sea número con 1 decimal máximo o null
  if (result.rating !== undefined && result.rating !== null) {
    const n = parseFloat(String(result.rating).replace(',', '.'))
    result.rating = isNaN(n) ? null : Math.round(n * 10) / 10
  }
  return result
}

export default function ImportPage() {
  const [status, setStatus] = useState<Status>('idle')
  const [preview, setPreview] = useState<Partial<Lead>[]>([])
  const [result, setResult] = useState({ imported: 0, skipped: 0, total: 0, dupesRemoved: 0 })
  const [errorMsg, setErrorMsg] = useState('')
  const [progress, setProgress] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  async function loadPreview(raw: string) {
    try {
      // 1) Parsear el CSV
      const { leads, skipped } = parseCSV(raw)

      // 2) Eliminar duplicados dentro del propio CSV
      const seenInFile = new Set<string>()
      const uniqueLeads = leads.filter((l) => {
        const phone = (l.nombre || '').trim().toLowerCase()
        const key = normPhone(l.telefono || '') || phone || l.web?.trim().toLowerCase() || ''
        if (!key) return true
        if (seenInFile.has(key)) return false
        seenInFile.add(key)
        return true
      })
      const dupesInFile = leads.length - uniqueLeads.length

      // 3) Traer los leads ya existentes para comparar
      const supabase = createClient()
      const { data: existing, error } = await supabase
        .from('leads')
        .select('nombre, telefono, web')
        .is('deleted_at', null)
      if (error) throw error

      const existingRows = existing ?? []
      const existingPhones = new Set(existingRows.map((e) => normPhone(String(e.telefono ?? ''))))
      const existingNames = new Set(existingRows.map((e) => String(e.nombre ?? '').trim().toLowerCase()))
      const existingWebs = new Set(existingRows.map((e) => String(e.web ?? '').trim().toLowerCase()))

      // 4) Filtrar leads que ya existen (por teléfono, web o nombre)
      const newLeads: Partial<Lead>[] = []
      let duplicates = 0
      for (const l of uniqueLeads) {
        const phone = normPhone(l.telefono || '')
        const name = String(l.nombre || '').trim().toLowerCase()
        const web = String(l.web || '').trim().toLowerCase()
        const isDuplicate =
          (phone && existingPhones.has(phone)) ||
          (web && existingWebs.has(web)) ||
          (name && existingNames.has(name))
        if (isDuplicate) {
          duplicates++
        } else {
          newLeads.push(l)
        }
      }

      const totalRemoved = dupesInFile + duplicates
      setPreview(newLeads)
      setResult({
        imported: 0,
        skipped,
        total: leads.length,
        dupesRemoved: totalRemoved,
      })
      setStatus('preview')
    } catch (e: any) {
      setErrorMsg(e.message || 'Error al procesar el archivo')
      setStatus('error')
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const raw = ev.target?.result as string
      loadPreview(raw)
    }
    reader.readAsText(file, 'UTF-8')
  }

  async function handleImport() {
    setStatus('importing')
    setProgress(0)
    const supabase = createClient()
    const BATCH = 50
    let imported = 0

    try {
      const sanitized = preview.map(sanitizeLead)

      for (let i = 0; i < sanitized.length; i += BATCH) {
        const batch = sanitized.slice(i, i + BATCH)
        const { error } = await supabase.from('leads').insert(batch)
        if (error) {
          console.error('Supabase error:', error)
          throw new Error(`${error.message}${error.details ? ' — ' + error.details : ''}${error.hint ? ' — ' + error.hint : ''}`)
        }
        imported += batch.length
        setProgress(Math.round(imported / sanitized.length * 100))
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
    setProgress(0)
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
                <p className="text-xs text-zinc-500 mt-0.5">
                  {result.skipped} filas omitidas (sin nombre)
                  {result.dupesRemoved > 0 && (
                    <span className="text-amber-400"> · {result.dupesRemoved} repetidos descartados</span>
                  )}
                </p>
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
                  disabled={preview.length === 0}
                  className="text-sm px-4 py-2 bg-green-500 hover:bg-green-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-medium rounded-lg transition-colors"
                >
                  Importar {preview.length} leads
                </button>
              </div>
            </div>

            {/* Caso: todos eran repetidos */}
            {preview.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-10 text-center space-y-3">
                <svg className="w-8 h-8 text-amber-500 mx-auto" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-zinc-200 font-medium">No hay leads nuevos para importar</p>
                <p className="text-xs text-zinc-500">
                  Todos los leads del archivo ya existen en la base ({result.dupesRemoved} descartados).
                </p>
              </div>
            ) : (
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
            )}
          </div>
        )}

        {/* Importing */}
        {status === 'importing' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center space-y-4">
            <p className="text-zinc-400 text-sm">Importando leads...</p>
            <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-zinc-600">{progress}%</p>
          </div>
        )}

        {/* Done */}
        {status === 'done' && (
          <div className="bg-zinc-900 border border-green-900/50 rounded-xl p-8 text-center">
            <p className="text-green-400 text-lg font-medium mb-1">✓ Importación completada</p>
            <p className="text-zinc-500 text-sm">{result.imported} leads importados correctamente</p>
            {result.dupesRemoved > 0 && (
              <p className="text-xs text-amber-400 mt-1">
                {result.dupesRemoved} repetidos descartados (ya existían)
              </p>
            )}
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
            <p className="text-red-400 text-sm font-medium mb-2">Error al importar</p>
            <p className="text-zinc-500 text-xs font-mono bg-zinc-950 rounded-lg p-3 text-left whitespace-pre-wrap break-all">
              {errorMsg}
            </p>
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