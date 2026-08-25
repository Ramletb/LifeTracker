import { db, saveProfile } from '../db'
import type {
  BodyEntry,
  DailyMetrics,
  FoodEntry,
  LabResult,
  Workout
} from '../types'
import { DEFAULT_PROFILE } from '../types'
import { addDays, fromISO, todayISO } from './dates'

/** Deterministic PRNG so sample data is stable across loads. */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * ~90 days of plausible lifestyle data plus three lab draws over 14 months
 * showing lipids improving with training — enough to light up every view.
 * Idempotent: refuses to double-load, never overwrites an existing profile,
 * and skips days that already have metrics. Returns a status message.
 */
export async function loadSampleData(): Promise<string> {
  if (await db.kv.get('sampleLoaded')) {
    return 'Sample data is already loaded — use "Delete all data" first to reload it.'
  }
  const rand = mulberry32(42)
  const today = todayISO()
  const daily: DailyMetrics[] = []
  const food: FoodEntry[] = []
  const workouts: Workout[] = []
  const body: BodyEntry[] = []
  const labs: LabResult[] = []

  for (let i = 89; i >= 0; i--) {
    const date = addDays(today, -i)
    const weekend = fromISO(date).getDay() % 6 === 0
    daily.push({
      date,
      steps: Math.round(6500 + rand() * 5500 + (weekend ? 1500 : 0)),
      sleepHours: Math.round((6.6 + rand() * 1.8) * 10) / 10,
      restingHr: Math.round(56 + rand() * 6 - i * 0.03),
      activeCalories: Math.round(350 + rand() * 400)
    })

    const meals: [FoodEntry['meal'], string, number, number, number, number, number][] = [
      ['breakfast', 'Greek yogurt, berries & granola', 420, 32, 48, 12, 6],
      ['lunch', 'Chicken burrito bowl', 680, 42, 70, 22, 10],
      ['dinner', 'Salmon, rice & broccoli', 640, 45, 55, 24, 7],
      ['snack', 'Apple & peanut butter', 260, 8, 28, 14, 5]
    ]
    for (const [meal, name, cal, p, c, f, fib] of meals) {
      if (meal === 'snack' && rand() < 0.35) continue
      const jitter = 0.85 + rand() * 0.3
      food.push({
        date,
        meal,
        name,
        calories: Math.round(cal * jitter),
        protein: Math.round(p * jitter),
        carbs: Math.round(c * jitter),
        fat: Math.round(f * jitter),
        fiber: Math.round(fib * jitter),
        sodium: Math.round(300 + rand() * 500)
      })
    }

    const day = fromISO(date).getDay()
    if (day === 1 || day === 4) {
      workouts.push({
        date,
        type: 'Strength',
        minutes: 45 + Math.round(rand() * 15),
        calories: 280 + Math.round(rand() * 80),
        avgHr: 112 + Math.round(rand() * 10)
      })
    } else if (day === 2 || day === 6) {
      const km = 4 + rand() * 4
      workouts.push({
        date,
        type: 'Run',
        minutes: Math.round(km * 6),
        calories: Math.round(km * 65),
        distanceKm: Math.round(km * 10) / 10,
        avgHr: 142 + Math.round(rand() * 12)
      })
    }

    if (i % 7 === 0) {
      const progress = (89 - i) / 89
      body.push({
        date,
        weightKg: Math.round((88.5 - progress * 3.2 + rand() * 0.6) * 10) / 10,
        bodyFatPct: Math.round((24.5 - progress * 1.8 + rand() * 0.4) * 10) / 10,
        source: 'scale'
      })
    }
  }

  body.push({
    date: addDays(today, -10),
    weightKg: 85.9,
    bodyFatPct: 22.8,
    leanMassKg: 63.1,
    boneMassKg: 3.4,
    visceralFat: 9,
    source: 'DEXA',
    note: 'Quarterly scan'
  })

  const draws: [string, Record<string, number>][] = [
    [
      addDays(today, -420),
      {
        total_chol: 228, ldl: 152, hdl: 44, trig: 168, non_hdl: 184, apob: 118,
        lpa: 32, glucose: 98, hba1c: 5.7, insulin: 11.2, hscrp: 2.4,
        alt: 38, ast: 30, ggt: 34, creatinine: 1.02, egfr: 92, tsh: 2.1,
        vitd: 24, ferritin: 210, hemoglobin: 15.2, testosterone: 480
      }
    ],
    [
      addDays(today, -200),
      {
        total_chol: 205, ldl: 128, hdl: 48, trig: 132, non_hdl: 157, apob: 102,
        glucose: 94, hba1c: 5.5, insulin: 8.4, hscrp: 1.6,
        alt: 31, ast: 27, ggt: 27, creatinine: 1.04, egfr: 94, tsh: 1.9,
        vitd: 37, ferritin: 168, hemoglobin: 15.4, testosterone: 545
      }
    ],
    [
      addDays(today, -21),
      {
        total_chol: 186, ldl: 104, hdl: 53, trig: 96, non_hdl: 133, apob: 88,
        glucose: 89, hba1c: 5.3, insulin: 6.1, hscrp: 0.9,
        alt: 24, ast: 24, ggt: 21, creatinine: 1.05, egfr: 95, tsh: 1.8,
        vitd: 46, ferritin: 122, hemoglobin: 15.5, testosterone: 610,
        omega3: 6.4, homocysteine: 8.8, uric: 5.9
      }
    ]
  ]
  for (const [date, values] of draws) {
    for (const [markerId, value] of Object.entries(values)) {
      labs.push({ date, markerId, value })
    }
  }

  await db.transaction(
    'rw',
    [db.labs, db.food, db.workouts, db.daily, db.body],
    async () => {
      // Days the user already logged stay untouched (date is a unique index).
      const existingDates = new Set((await db.daily.toArray()).map((d) => d.date))
      await db.labs.bulkAdd(labs)
      await db.food.bulkAdd(food)
      await db.workouts.bulkAdd(workouts)
      await db.daily.bulkAdd(daily.filter((d) => !existingDates.has(d.date)))
      await db.body.bulkAdd(body)
    }
  )
  const hasProfile = await db.kv.get('profile')
  if (!hasProfile) {
    await saveProfile({
      ...DEFAULT_PROFILE,
      name: 'Sample',
      birthYear: 1982,
      sex: 'male',
      heightCm: 180,
      weightTargetKg: 82
    })
  }
  await db.kv.put({ key: 'sampleLoaded', value: true })
  return 'Sample data loaded — explore the tabs.'
}
