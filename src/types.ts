export type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface LabResult {
  id?: number
  date: string // ISO yyyy-mm-dd
  markerId: string
  value: number
  note?: string
}

export interface FoodEntry {
  id?: number
  date: string
  meal: Meal
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sodium?: number // mg
}

export interface Workout {
  id?: number
  date: string
  type: string
  minutes: number
  calories?: number
  distanceKm?: number
  avgHr?: number
  note?: string
}

export interface DailyMetrics {
  id?: number
  date: string
  steps?: number
  activeCalories?: number
  sleepHours?: number
  restingHr?: number
  systolic?: number
  diastolic?: number
}

export interface BodyEntry {
  id?: number
  date: string
  weightKg?: number
  bodyFatPct?: number
  leanMassKg?: number
  boneMassKg?: number
  waistCm?: number
  visceralFat?: number
  source?: string // e.g. "scale", "DEXA", "InBody"
  note?: string
}

export interface Profile {
  name?: string
  birthYear?: number
  sex?: 'male' | 'female'
  heightCm?: number
  calorieTarget: number
  proteinTarget: number // g/day
  fiberTarget: number // g/day
  stepTarget: number
  sleepTarget: number // hours
  weightTargetKg?: number
  theme: 'auto' | 'light' | 'dark'
}

export const DEFAULT_PROFILE: Profile = {
  calorieTarget: 2200,
  proteinTarget: 130,
  fiberTarget: 30,
  stepTarget: 8000,
  sleepTarget: 7.5,
  theme: 'auto'
}

export type SystemId =
  | 'cardio'
  | 'metabolic'
  | 'inflammation'
  | 'liver'
  | 'kidney'
  | 'thyroid'
  | 'blood'
  | 'micro'

export interface Range {
  low?: number
  high?: number
}

export interface MarkerDef {
  id: string
  name: string
  short: string
  unit: string
  category: SystemId
  /** conventional lab reference range */
  std: Range
  /** tighter "optimal" range used for scoring and coaching */
  opt: Range
  /** female-specific overrides for sex-dimorphic markers */
  femStd?: Range
  femOpt?: Range
  decimals: number
  desc: string
  advice?: string
  aliases?: string[]
}

export type MarkerStatus = 'optimal' | 'ok' | 'out'

export interface Insight {
  id: string
  severity: 'good' | 'info' | 'watch' | 'act'
  title: string
  body: string
  dataLine?: string
  actions?: string[]
}
