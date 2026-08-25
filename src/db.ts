import Dexie, { type Table } from 'dexie'
import type {
  BodyEntry,
  DailyMetrics,
  FoodEntry,
  LabResult,
  Profile,
  Workout
} from './types'
import { DEFAULT_PROFILE } from './types'

interface KV {
  key: string
  value: unknown
}

export class LifeDB extends Dexie {
  labs!: Table<LabResult, number>
  food!: Table<FoodEntry, number>
  workouts!: Table<Workout, number>
  daily!: Table<DailyMetrics, number>
  body!: Table<BodyEntry, number>
  kv!: Table<KV, string>

  constructor() {
    super('ramlet-life-tracker')
    this.version(1).stores({
      labs: '++id, date, markerId, [markerId+date]',
      food: '++id, date',
      workouts: '++id, date',
      daily: '++id, &date',
      body: '++id, date',
      kv: '&key'
    })
  }
}

export const db = new LifeDB()

export async function getProfile(): Promise<Profile> {
  const row = await db.kv.get('profile')
  const stored = (row?.value as Partial<Profile>) ?? {}
  // Stored undefined values must not shadow required defaults (a cleared
  // numeric field in Settings would otherwise brick every view).
  const cleaned = Object.fromEntries(
    Object.entries(stored).filter(([, v]) => v !== undefined)
  )
  return { ...DEFAULT_PROFILE, ...cleaned }
}

export async function saveProfile(p: Profile): Promise<void> {
  await db.kv.put({ key: 'profile', value: p })
}

/** Merge fields into the metrics row for a date, creating it if needed. */
export async function upsertDaily(
  date: string,
  patch: Partial<DailyMetrics>
): Promise<void> {
  const existing = await db.daily.where('date').equals(date).first()
  if (existing) {
    await db.daily.update(existing.id!, { ...patch })
  } else {
    await db.daily.add({ date, ...patch })
  }
}

export async function wipeAllData(): Promise<void> {
  await Promise.all([
    db.labs.clear(),
    db.food.clear(),
    db.workouts.clear(),
    db.daily.clear(),
    db.body.clear(),
    db.kv.clear()
  ])
}

export interface ImportCounts {
  added: number
  skipped: number
}

/** Bulk-add lab results, skipping rows already present for a marker+date. */
export async function importLabResults(
  results: LabResult[]
): Promise<ImportCounts> {
  const existing = new Set(
    (await db.labs.toArray()).map((r) => `${r.markerId}|${r.date}`)
  )
  const fresh = results.filter((r) => {
    const key = `${r.markerId}|${r.date}`
    if (existing.has(key)) return false
    existing.add(key)
    return true
  })
  await db.labs.bulkAdd(fresh)
  return { added: fresh.length, skipped: results.length - fresh.length }
}

/** Bulk-add food entries, skipping exact duplicates (re-imported exports). */
export async function importFoodEntries(
  entries: FoodEntry[]
): Promise<ImportCounts> {
  const key = (e: FoodEntry) => `${e.date}|${e.meal}|${e.name}|${e.calories}`
  const existing = new Set((await db.food.toArray()).map(key))
  const fresh = entries.filter((e) => {
    const k = key(e)
    if (existing.has(k)) return false
    existing.add(k)
    return true
  })
  await db.food.bulkAdd(fresh)
  return { added: fresh.length, skipped: entries.length - fresh.length }
}

/** Bulk-add workouts, skipping exact duplicates (re-imported exports). */
export async function importWorkouts(entries: Workout[]): Promise<ImportCounts> {
  const key = (w: Workout) => `${w.date}|${w.type}|${w.minutes}`
  const existing = new Set((await db.workouts.toArray()).map(key))
  const fresh = entries.filter((w) => {
    const k = key(w)
    if (existing.has(k)) return false
    existing.add(k)
    return true
  })
  await db.workouts.bulkAdd(fresh)
  return { added: fresh.length, skipped: entries.length - fresh.length }
}
