export function toISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayISO(): string {
  return toISO(new Date())
}

export function addDays(iso: string, days: number): string {
  const d = fromISO(iso)
  d.setDate(d.getDate() + days)
  return toISO(d)
}

export function fromISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

const SHORT = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' })
const MED = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
})
const WEEKDAY = new Intl.DateTimeFormat('en', {
  weekday: 'long',
  month: 'long',
  day: 'numeric'
})

export const fmtShort = (iso: string) => SHORT.format(fromISO(iso))
export const fmtMed = (iso: string) => MED.format(fromISO(iso))
export const fmtWeekday = (iso: string) => WEEKDAY.format(fromISO(iso))

/** Last n ISO dates ending at `end` (inclusive), oldest first. */
export function lastNDays(n: number, end = todayISO()): string[] {
  const out: string[] = []
  for (let i = n - 1; i >= 0; i--) out.push(addDays(end, -i))
  return out
}

function buildISO(y: number, mo: number, d: number): string | undefined {
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return undefined
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/**
 * Parse the date formats seen in lab reports and app exports:
 * yyyy-mm-dd, m/d/yyyy (d/m/yyyy when unambiguous), "Aug 24, 2026", and ISO
 * datetimes. Returns ISO yyyy-mm-dd or undefined.
 */
export function parseDate(raw: string): string | undefined {
  const s = raw.trim()
  if (!s) return undefined
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (m) return buildISO(Number(m[1]), Number(m[2]), Number(m[3]))
  m = s.match(/^(\d{1,2})[/](\d{1,2})[/](\d{2,4})$/)
  if (m) {
    const year = Number(m[3].length === 2 ? `20${m[3]}` : m[3])
    let mo = Number(m[1])
    let d = Number(m[2])
    // "24/08/2026" can only be day-first — swap rather than misparse.
    if (mo > 12 && d <= 12) [mo, d] = [d, mo]
    return buildISO(year, mo, d)
  }
  const t = Date.parse(s)
  if (!Number.isNaN(t)) return toISO(new Date(t))
  return undefined
}
