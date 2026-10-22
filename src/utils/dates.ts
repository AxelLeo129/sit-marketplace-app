/**
 * Fechas en hora de Guatemala para filtros de reportes ("AAAA-MM-DD").
 */

/** Fecha y hora actuales en Guatemala (aunque el navegador esté en otra zona). */
function nowInGuatemala(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Guatemala' }))
}

function iso(date: Date): string {
  return date.toLocaleDateString('en-CA')
}

/** Rango de los últimos `days` días, incluido hoy. */
export function lastDays(days: number): [string, string] {
  const now = nowInGuatemala()
  return [iso(new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1))), iso(now)]
}

/** Del día 1 del mes en curso a hoy. */
export function thisMonth(): [string, string] {
  const now = nowInGuatemala()
  return [iso(new Date(now.getFullYear(), now.getMonth(), 1)), iso(now)]
}

/** Del 1 de enero a hoy. */
export function thisYear(): [string, string] {
  const now = nowInGuatemala()
  return [iso(new Date(now.getFullYear(), 0, 1)), iso(now)]
}
