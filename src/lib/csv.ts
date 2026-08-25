import { matchMarker } from '../data/markers'
import type { DailyMetrics, FoodEntry, LabResult, Meal, Workout } from '../types'
import { parseDate } from './dates'

/** RFC-4180-ish CSV parser: quoted fields, escaped quotes, CR/LF. */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  const pushField = () => {
    row.push(field)
    field = ''
  }
  const pushRow = () => {
    pushField()
    // skip fully empty trailing rows
    if (row.length > 1 || row[0]?.trim() !== '') rows.push(row)
    row = []
  }
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      pushField()
    } else if (c === '\n') {
      pushRow()
    } else if (c !== '\r') {
      field += c
    }
  }
  if (field !== '' || row.length > 0) pushRow()
  return rows
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '')

/** Find the index of the first header whose normalized form matches a candidate. */
function col(headers: string[], ...names: string[]): number {
  const normed = headers.map(norm)
  for (const n of names) {
    const idx = normed.findIndex((h) => h === norm(n))
    if (idx >= 0) return idx
  }
  for (const n of names) {
    const idx = normed.findIndex((h) => h.includes(norm(n)))
    if (idx >= 0) return idx
  }
  return -1
}

function num(raw: string | undefined): number | undefined {
  if (raw === undefined) return undefined
  const s = raw.trim()
  // Time-formatted values ("0:31:47") would strip to a garbage number —
  // reject rather than misparse.
  if (s === '' || s.includes(':')) return undefined
  const cleaned = s.replace(/,/g, '').replace(/[^0-9.\-]/g, '')
  if (!/^-?\d*\.?\d+$/.test(cleaned)) return undefined
  const v = Number(cleaned)
  return Number.isFinite(v) ? v : undefined
}

export interface BodyImportRow {
  date: string
  weightKg?: number
  bodyFatPct?: number
}

export interface LabImportResult {
  results: LabResult[]
  /** Body-composition rows (Weight, Body Fat %) routed to the Body log. */
  body: BodyImportRow[]
  /** Recognized but skipped because the app derives them (e.g. BMI). */
  derived: string[]
  unmatched: string[]
  /** Informational messages worth showing in the preview (e.g. unit conversions). */
  notes: string[]
  errors: string[]
}

const LB_TO_KG = 0.453592

/**
 * Import lab results from CSV with columns like: date, marker/test/name, value.
 * Weight and Body Fat % rows are routed to the Body log. Weight units: an
 * explicit kg/lb suffix in the name wins; otherwise the whole file is treated
 * as pounds if any unit-less weight exceeds 120, else as kilograms. Repeated
 * marker+date rows keep the last occurrence.
 */
export function parseLabsCSV(text: string): LabImportResult {
  const rows = parseCSV(text)
  const out: LabImportResult = {
    results: [],
    body: [],
    derived: [],
    unmatched: [],
    notes: [],
    errors: []
  }
  if (rows.length < 2) {
    out.errors.push('Need a header row plus at least one data row.')
    return out
  }
  const headers = rows[0]
  const dateIdx = col(headers, 'date', 'collected', 'drawn')
  const nameIdx = col(headers, 'marker', 'test', 'name', 'biomarker', 'analyte')
  const valueIdx = col(headers, 'value', 'result', 'amount')
  if (dateIdx < 0 || nameIdx < 0 || valueIdx < 0) {
    out.errors.push(
      'Could not find date, marker and value columns. Expected headers like: date, marker, value.'
    )
    return out
  }
  const seen = new Set<string>()
  const bodyByDate = new Map<string, BodyImportRow>()
  const bodyRow = (date: string) => {
    let row = bodyByDate.get(date)
    if (!row) {
      row = { date }
      bodyByDate.set(date, row)
      out.body.push(row)
    }
    return row
  }
  const weightRows: { date: string; value: number; unit?: 'kg' | 'lb' }[] = []
  const resultByKey = new Map<string, LabResult>()

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    const date = parseDate(r[dateIdx] ?? '')
    const name = (r[nameIdx] ?? '').trim()
    const value = num(r[valueIdx])
    if (!name) continue
    if (!date || value === undefined) {
      out.errors.push(`Row ${i + 1}: could not read date or value for "${name}".`)
      continue
    }
    const key = norm(name)
    const wm = key.match(/^(?:body)?weight(kg|lbs?)?$/)
    if (wm) {
      weightRows.push({
        date,
        value,
        unit: wm[1] === undefined ? undefined : wm[1] === 'kg' ? 'kg' : 'lb'
      })
      continue
    }
    if (key === 'bodyfat' || key === 'bodyfatpercent' || key === 'bodyfatpercentage' || key === 'bodyfatpct') {
      bodyRow(date).bodyFatPct = value
      continue
    }
    if (key === 'bmi') {
      if (!out.derived.includes(name)) out.derived.push(name)
      continue
    }
    const markerId = matchMarker(name)
    if (!markerId) {
      if (!seen.has(name)) {
        out.unmatched.push(name)
        seen.add(name)
      }
      continue
    }
    const rkey = `${markerId}|${date}`
    const existing = resultByKey.get(rkey)
    if (existing) {
      existing.value = value // last occurrence wins (corrected rows come later)
    } else {
      const rec: LabResult = { date, markerId, value }
      resultByKey.set(rkey, rec)
      out.results.push(rec)
    }
  }

  // Resolve weight units once per file so one scale's export stays consistent.
  if (weightRows.length > 0) {
    const assumeLb = weightRows.some((w) => w.unit === undefined && w.value > 120)
    let converted = false
    for (const w of weightRows) {
      const isLb = w.unit ? w.unit === 'lb' : assumeLb
      if (isLb) converted = true
      bodyRow(w.date).weightKg = Math.round((isLb ? w.value * LB_TO_KG : w.value) * 10) / 10
    }
    if (converted) {
      out.notes.push(
        'Weights were read as pounds and converted to kilograms — check the Body log if that guess is wrong.'
      )
    }
  }
  return out
}

const MEALS: Meal[] = ['breakfast', 'lunch', 'dinner', 'snack']

function parseMeal(raw: string | undefined): Meal {
  const s = (raw ?? '').toLowerCase()
  for (const m of MEALS) if (s.includes(m)) return m
  if (s.includes('snack')) return 'snack'
  return 'snack'
}

export interface FoodImportResult {
  entries: FoodEntry[]
  errors: string[]
}

/**
 * Import food entries from a MyNetDiary-style export: one row per food with
 * date, meal, food name and nutrient columns. Header names vary by app
 * version, so match generously.
 */
export function parseFoodCSV(text: string): FoodImportResult {
  const rows = parseCSV(text)
  const out: FoodImportResult = { entries: [], errors: [] }
  if (rows.length < 2) {
    out.errors.push('Need a header row plus at least one data row.')
    return out
  }
  const headers = rows[0]
  const dateIdx = col(headers, 'date', 'day')
  const mealIdx = col(headers, 'meal')
  const nameIdx = col(headers, 'food name', 'food', 'name', 'description', 'item')
  const calIdx = col(headers, 'calories', 'energy', 'kcal', 'cals')
  const proIdx = col(headers, 'protein')
  const carbIdx = col(headers, 'carbs', 'carbohydrate', 'total carbs')
  const satFatIdx = col(headers, 'saturated fat', 'sat fat')
  const fatIdx = col(headers, 'fat', 'total fat')
  const fiberIdx = col(headers, 'fiber', 'dietary fiber')
  const sodiumIdx = col(headers, 'sodium')
  if (dateIdx < 0 || nameIdx < 0 || calIdx < 0) {
    out.errors.push(
      'Could not find date, food name and calories columns in this file.'
    )
    return out
  }
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    const date = parseDate(r[dateIdx] ?? '')
    const name = (r[nameIdx] ?? '').trim()
    const calories = num(r[calIdx])
    if (!name || !date || calories === undefined) continue
    out.entries.push({
      date,
      meal: parseMeal(mealIdx >= 0 ? r[mealIdx] : undefined),
      name,
      calories,
      protein: (proIdx >= 0 ? num(r[proIdx]) : undefined) ?? 0,
      carbs: (carbIdx >= 0 ? num(r[carbIdx]) : undefined) ?? 0,
      fat: (fatIdx >= 0 ? num(r[fatIdx]) : undefined) ?? 0,
      satFat: satFatIdx >= 0 ? num(r[satFatIdx]) : undefined,
      fiber: fiberIdx >= 0 ? num(r[fiberIdx]) : undefined,
      sodium: sodiumIdx >= 0 ? num(r[sodiumIdx]) : undefined
    })
  }
  return out
}

export interface DailyImportResult {
  entries: DailyMetrics[]
  errors: string[]
}

/** Daily metrics CSV: date, steps, sleep_hours, resting_hr, active_calories… */
export function parseDailyCSV(text: string): DailyImportResult {
  const rows = parseCSV(text)
  const out: DailyImportResult = { entries: [], errors: [] }
  if (rows.length < 2) {
    out.errors.push('Need a header row plus at least one data row.')
    return out
  }
  const headers = rows[0]
  const dateIdx = col(headers, 'date', 'day')
  if (dateIdx < 0) {
    out.errors.push('Could not find a date column.')
    return out
  }
  const stepsIdx = col(headers, 'steps', 'step count')
  const sleepIdx = col(headers, 'sleep hours', 'sleep', 'asleep')
  const rhrIdx = col(headers, 'resting hr', 'resting heart rate', 'rhr')
  const actIdx = col(headers, 'active calories', 'active energy', 'move')
  const sysIdx = col(headers, 'systolic')
  const diaIdx = col(headers, 'diastolic')
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    const date = parseDate(r[dateIdx] ?? '')
    if (!date) continue
    const entry: DailyMetrics = { date }
    // Only set fields that actually parsed: a blank cell must leave any
    // previously logged value alone (Dexie deletes undefined-valued keys).
    const set = (k: keyof DailyMetrics, idx: number) => {
      if (idx < 0) return
      const v = num(r[idx])
      if (v !== undefined) Object.assign(entry, { [k]: v })
    }
    set('steps', stepsIdx)
    set('sleepHours', sleepIdx)
    set('restingHr', rhrIdx)
    set('activeCalories', actIdx)
    set('systolic', sysIdx)
    set('diastolic', diaIdx)
    if (Object.keys(entry).length > 1) out.entries.push(entry)
  }
  return out
}

export interface WorkoutImportResult {
  entries: Workout[]
  errors: string[]
}

/** Workouts CSV: date, type, minutes/duration, calories, distance_km, avg_hr */
export function parseWorkoutsCSV(text: string): WorkoutImportResult {
  const rows = parseCSV(text)
  const out: WorkoutImportResult = { entries: [], errors: [] }
  if (rows.length < 2) {
    out.errors.push('Need a header row plus at least one data row.')
    return out
  }
  const headers = rows[0]
  const dateIdx = col(headers, 'date', 'start')
  const typeIdx = col(headers, 'type', 'activity', 'workout')
  const minIdx = col(headers, 'minutes', 'duration')
  if (dateIdx < 0 || typeIdx < 0 || minIdx < 0) {
    out.errors.push('Could not find date, type and minutes columns.')
    return out
  }
  const calIdx = col(headers, 'calories', 'energy', 'kcal')
  const distIdx = col(headers, 'distance km', 'distance')
  const hrIdx = col(headers, 'avg hr', 'average heart rate', 'avg heart rate')
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    const date = parseDate(r[dateIdx] ?? '')
    const type = (r[typeIdx] ?? '').trim()
    const minutes = num(r[minIdx])
    if (!date || !type || minutes === undefined) continue
    out.entries.push({
      date,
      type,
      minutes,
      calories: calIdx >= 0 ? num(r[calIdx]) : undefined,
      distanceKm: distIdx >= 0 ? num(r[distIdx]) : undefined,
      avgHr: hrIdx >= 0 ? num(r[hrIdx]) : undefined
    })
  }
  return out
}
