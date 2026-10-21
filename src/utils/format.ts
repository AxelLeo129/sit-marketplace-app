/**
 * Formatos de presentación (moneda y fechas de Guatemala).
 */

const money = new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' })

/** "112.00" → "Q112.00" */
export function formatMoney(amount: string | number): string {
  return money.format(Number(amount))
}

const dateTime = new Intl.DateTimeFormat('es-GT', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Guatemala',
})

/** Fecha y hora de la API (ISO, UTC) en hora de Guatemala: "15/10/26, 14:30". */
export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso))
}

/** Fecha sin hora de la API ("2026-10-15") → "15/10/2026". */
export function formatDate(date: string): string {
  const [year, month, day] = date.split('-')
  return `${day}/${month}/${year}`
}
