import type { Lead, LeadPriority } from '@/types/lead.types'

const COLUMN_MAP: Record<string, string[]> = {
  nombre:     ['nombre', 'razon social', 'empresa', 'cliente', 'name'],
  telefono:   ['telefono', 'teléfono', 'tel', 'phone', 'celular', 'whatsapp'],
  direccion:  ['direccion', 'dirección', 'address', 'domicilio'],
  web:        ['web', 'sitio', 'url', 'website'],
  rating:     ['rating limpio', 'rating limpio'],
  rubro:      ['rubro', 'categoria', 'categoría', 'industria', 'tipo'],
  ciudad:     ['ciudad', 'localidad', 'city'],
  prioridad:  ['prioridad', 'priority'],
  mensaje_d1: ['mensaje d1', 'msg d1'],
  mensaje_d3: ['mensaje d3', 'msg d3'],
  mensaje_d7: ['mensaje d7', 'msg d7'],
  analisis:   ['analisis ia', 'análisis ia', 'analisis', 'análisis'],
  etapa:      ['etapa', 'stage', 'estado lead'],
}

function norm(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

function findColumn(headers: string[], field: string): number {
  const keywords = COLUMN_MAP[field] || [field]
  for (const kw of keywords) {
    const idx = headers.findIndex(h => norm(h) === norm(kw))
    if (idx !== -1) return idx
  }
  // fallback: includes
  for (const kw of keywords) {
    const idx = headers.findIndex(h => norm(h).includes(norm(kw)))
    if (idx !== -1) return idx
  }
  return -1
}

export function normalizePhone(p: string): string {
  let s = String(p).replace(/[\s\-\(\)\+\.]/g, '').replace(/\.0+$/, '')
  if (s.startsWith('0')) s = '54' + s.slice(1)
  if (!s.startsWith('54')) s = '54' + s
  if (s.startsWith('54') && !s.startsWith('549') && s.length === 12) s = '549' + s.slice(2)
  return s
}

// Parser CSV robusto que maneja campos con saltos de línea y comillas escapadas
function parseCSVRobust(raw: string): string[][] {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentField = ''
  let inQuotes = false
  let i = 0

  while (i < raw.length) {
    const ch = raw[i]

    if (inQuotes) {
      if (ch === '"') {
        // comilla doble escapada ("")
        if (raw[i + 1] === '"') {
          currentField += '"'
          i += 2
          continue
        }
        // cierre de comillas
        inQuotes = false
        i++
        continue
      }
      currentField += ch
      i++
      continue
    }

    // fuera de comillas
    if (ch === '"') {
      inQuotes = true
      i++
      continue
    }

    if (ch === ',') {
      currentRow.push(currentField.trim())
      currentField = ''
      i++
      continue
    }

    if (ch === '\r') {
      i++
      continue
    }

    if (ch === '\n') {
      currentRow.push(currentField.trim())
      rows.push(currentRow)
      currentRow = []
      currentField = ''
      i++
      continue
    }

    currentField += ch
    i++
  }

  // última fila
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim())
    rows.push(currentRow)
  }

  return rows
}

function parseAI(str: string) {
  if (!str) return null
  try {
    const m = str.replace(/```json|```/g, '').trim().match(/\{[\s\S]*\}/)
    if (m) return JSON.parse(m[0])
  } catch {}
  return null
}

export interface ParseResult {
  leads: Partial<Lead>[]
  total: number
  skipped: number
  columns: Record<string, number>
}

export function parseCSV(raw: string): ParseResult {
  const rows = parseCSVRobust(raw)
  if (rows.length < 2) return { leads: [], total: 0, skipped: 0, columns: {} }

  const headers = rows[0]
  const colMap = Object.fromEntries(
    Object.keys(COLUMN_MAP).map(field => [field, findColumn(headers, field)])
  )

  const get = (row: string[], field: string) => {
    const idx = colMap[field]
    return idx >= 0 ? (row[idx] || '').trim() : ''
  }

  let skipped = 0
  const leads: Partial<Lead>[] = []

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const nombre = get(row, 'nombre')
    if (!nombre) { skipped++; continue }

    // Rating limpio: acepta "4,6" o "4.6"
    const ratingRaw = get(row, 'rating')
    const rating = parseFloat(ratingRaw.replace(',', '.')) || null

    const prioridadRaw = norm(get(row, 'prioridad'))
    const prioridad: LeadPriority = prioridadRaw.includes('alta') ? 'alta'
      : prioridadRaw.includes('baja') ? 'baja' : 'media'

    // Análisis IA
    const analisisRaw = get(row, 'analisis')
    const ai = parseAI(analisisRaw)

    leads.push({
      nombre,
      telefono:   get(row, 'telefono') || null,
      direccion:  get(row, 'direccion') || null,
      web:        get(row, 'web') || null,
      rating,
      rubro:      get(row, 'rubro') || null,
      ciudad:     get(row, 'ciudad') || 'Tucumán',
      prioridad,
      mensaje_d1: get(row, 'mensaje_d1') || ai?.mensaje_d1 || ai?.whatsapp || null,
      mensaje_d3: get(row, 'mensaje_d3') || ai?.mensaje_d3 || null,
      mensaje_d7: get(row, 'mensaje_d7') || ai?.mensaje_d7 || null,
      ai_analysis: ai,
      source:     'csv',
      etapa:      'nuevo',
      tags:       [],
    })
  }

  return { leads, total: rows.length - 1, skipped, columns: colMap }
}