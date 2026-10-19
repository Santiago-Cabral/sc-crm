export const ZONAS = ['Tucumán', 'Barcelona', 'México', 'Buenos Aires'] as const

export type Zona = (typeof ZONAS)[number]

// Normaliza el texto libre de "ciudad" (que muchas veces trae la dirección
// completa) a una de las zonas conocidas. Si no matchea ninguna, devuelve
// el texto original limpio.
export function normalizeCiudad(raw: string | null | undefined): string {
  if (!raw) return ''
  const s = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  if (s.includes('tucuman') || s.includes('tuc')) return 'Tucumán'
  if (s.includes('barcelona')) return 'Barcelona'
  if (s.includes('mexico') || s.includes('cdmx') || s.includes('df')) return 'México'
  if (s.includes('buenos aires') || s.includes('caba') || s.includes('capital federal')) {
    return 'Buenos Aires'
  }
  return raw.trim()
}

// Todas las zonas presentes en una lista de textos de ciudad, en el orden
// fijo de ZONAS y dejando al final las que no matchean ninguna.
export function zonasPresentes(values: (string | null | undefined)[]): string[] {
  const present = new Set(values.map(normalizeCiudad).filter(Boolean))
  const known = ZONAS.filter((z) => present.has(z))
  const other = Array.from(present).filter((v) => !ZONAS.includes(v as Zona)).sort()
  return [...known, ...other]
}

// Términos de búsqueda (para ilike) que corresponden a una zona conocida.
const ZONA_MATCHERS: Record<Zona, string[]> = {
  Tucumán: ['Tucumán', 'Tuc'],
  Barcelona: ['Barcelona'],
  México: ['México', 'Mexico', 'CDMX'],
  'Buenos Aires': ['Buenos Aires', 'CABA', 'Capital Federal'],
}

// Devuelve los patrones por los que hay que buscar en la columna `ciudad`
// cuando el filtro es una de las zonas conocidas. Para texto libre devuelve
// el propio valor.
export function ciudadSearchTerms(ciudad: string): string[] {
  if (ciudad in ZONA_MATCHERS) return ZONA_MATCHERS[ciudad as Zona]
  return [ciudad]
}

