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
  return { ...DEFAULT_PROFILE, ...((row?.value as Partial<Profile>) ?? {}) }
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
    db.body.clear()
  ])
}
