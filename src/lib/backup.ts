import { db, getProfile, saveProfile } from '../db'
import type { Profile } from '../types'
import { todayISO } from './dates'

interface BackupFile {
  app: 'ramlet-life-tracker'
  version: 1
  exportedAt: string
  profile: Profile
  labs: unknown[]
  food: unknown[]
  workouts: unknown[]
  daily: unknown[]
  body: unknown[]
  goals?: unknown[]
}

export async function exportBackup(): Promise<void> {
  const [labs, food, workouts, daily, body, goals, profile] = await Promise.all([
    db.labs.toArray(),
    db.food.toArray(),
    db.workouts.toArray(),
    db.daily.toArray(),
    db.body.toArray(),
    db.goals.toArray(),
    getProfile()
  ])
  const payload: BackupFile = {
    app: 'ramlet-life-tracker',
    version: 1,
    exportedAt: new Date().toISOString(),
    profile,
    labs,
    food,
    workouts,
    daily,
    body,
    goals
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json'
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `life-tracker-backup-${todayISO()}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoking synchronously can cancel the download on Safari/iOS.
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

const stripIds = (rows: unknown[]) =>
  rows.map((r) => {
    const { id: _id, ...rest } = r as Record<string, unknown>
    return rest
  })

/** Replace all local data with the contents of a backup file. */
export async function importBackup(text: string): Promise<string> {
  let parsed: BackupFile
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('That file is not valid JSON.')
  }
  if (parsed.app !== 'ramlet-life-tracker') {
    throw new Error('That file does not look like a Life Tracker backup.')
  }
  await db.transaction(
    'rw',
    [db.labs, db.food, db.workouts, db.daily, db.body, db.goals],
    async () => {
      await Promise.all([
        db.labs.clear(),
        db.food.clear(),
        db.workouts.clear(),
        db.daily.clear(),
        db.body.clear(),
        db.goals.clear()
      ])
      await db.labs.bulkAdd(stripIds(parsed.labs ?? []) as never[])
      await db.food.bulkAdd(stripIds(parsed.food ?? []) as never[])
      await db.workouts.bulkAdd(stripIds(parsed.workouts ?? []) as never[])
      await db.daily.bulkAdd(stripIds(parsed.daily ?? []) as never[])
      await db.body.bulkAdd(stripIds(parsed.body ?? []) as never[])
      await db.goals.bulkAdd(stripIds(parsed.goals ?? []) as never[])
    }
  )
  if (parsed.profile) await saveProfile(parsed.profile)
  return `Restored ${parsed.labs?.length ?? 0} lab results, ${parsed.food?.length ?? 0} food entries, ${parsed.workouts?.length ?? 0} workouts.`
}
