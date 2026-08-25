import type { Goal, Workout } from '../types'
import { addDays } from './dates'

/**
 * Adaptive race-training plan. The plan is a pure function of the goal and
 * the run history, always computed "from where you are now to race day":
 * logging a run (including a backdated one) automatically repopulates every
 * remaining week's target. Past weeks show what actually happened.
 */

export interface PlanWeek {
  index: number
  start: string // ISO, inclusive
  end: string // ISO, inclusive
  /** Long-run target for this week; null for past weeks (actuals shown). */
  targetKm: number | null
  /** Longest run actually completed this week. */
  actualKm: number
  runs: number
  totalKm: number
  isRaceWeek: boolean
  isCurrent: boolean
  isPast: boolean
}

export interface Plan {
  weeks: PlanWeek[]
  /** Ability when the plan started (longest run in the prior 3 weeks). */
  baselineKm: number
  /** Ability now (longest run in the last 3 weeks). */
  currentKm: number
  /** Largest long-run target the ramp reaches before the race. */
  peakKm: number
  /** False when the weekly-growth cap can't reach race distance in time. */
  achievable: boolean
  weeksLeft: number
  totalLoggedKm: number
  runsLogged: number
  raceDone: boolean
  thisWeek?: {
    targetKm: number
    easyKm: number
    runsDone: number
    longestKm: number
    longDone: boolean
  }
}

const DEFAULT_BASE_KM = 2.4 // able to jog ~1.5 miles
const MAX_WEEKLY_GROWTH = 1.15
const TAPER_FACTOR = 0.65

export const isRunType = (type: string) => /run|jog/i.test(type)

const round5 = (km: number) => Math.round(km * 2) / 2

/** Longest run in the 21 days ending at `asOf` (inclusive). */
function ability(runs: Workout[], asOf: string): number {
  const from = addDays(asOf, -20)
  let best = 0
  for (const r of runs) {
    if (r.distanceKm && r.date >= from && r.date <= asOf) {
      best = Math.max(best, r.distanceKm)
    }
  }
  return best
}

export function buildPlan(goal: Goal, workouts: Workout[], today: string): Plan {
  const runs = workouts.filter((w) => isRunType(w.type))
  const baselineKm = ability(runs, goal.startDate) || DEFAULT_BASE_KM
  const currentKm = Math.max(ability(runs, today), DEFAULT_BASE_KM)

  // Build week windows from start to race day (last week may be short).
  const weeks: PlanWeek[] = []
  let cursor = goal.startDate
  let index = 0
  while (cursor <= goal.date) {
    const end = addDays(cursor, 6) > goal.date ? goal.date : addDays(cursor, 6)
    weeks.push({
      index,
      start: cursor,
      end,
      targetKm: null,
      actualKm: 0,
      runs: 0,
      totalKm: 0,
      isRaceWeek: end === goal.date,
      isCurrent: today >= cursor && today <= end,
      isPast: end < today
    })
    cursor = addDays(cursor, 7)
    index++
  }

  // Fill actuals.
  let totalLoggedKm = 0
  let runsLogged = 0
  for (const r of runs) {
    if (r.date < goal.startDate || r.date > goal.date) continue
    const w = weeks.find((wk) => r.date >= wk.start && r.date <= wk.end)
    if (!w) continue
    w.runs++
    if (r.distanceKm) {
      w.actualKm = Math.max(w.actualKm, r.distanceKm)
      w.totalKm += r.distanceKm
      totalLoggedKm += r.distanceKm
      runsLogged++
    } else {
      runsLogged++
    }
  }

  // Targets for current + future weeks, ramping from current ability.
  const remaining = weeks.filter((w) => !w.isPast)
  let peakKm = currentKm
  let achievable = true
  if (remaining.length > 0) {
    const raceWeek = remaining[remaining.length - 1]
    const rampWeeks = remaining.slice(0, -1)
    // Taper: the last full week before the race backs off.
    const taperWeek = rampWeeks.length >= 2 ? rampWeeks[rampWeeks.length - 1] : undefined
    const buildWeeks = taperWeek ? rampWeeks.slice(0, -1) : rampWeeks

    if (buildWeeks.length > 0) {
      const n = buildWeeks.length
      const ideal = Math.pow(goal.distanceKm / currentKm, 1 / n)
      const r = Math.min(Math.max(ideal, 1), MAX_WEEKLY_GROWTH)
      let level = currentKm
      for (const w of buildWeeks) {
        level = Math.min(level * r, goal.distanceKm)
        w.targetKm = round5(level)
      }
      peakKm = round5(level)
      achievable = level >= goal.distanceKm * 0.95
    } else {
      peakKm = round5(Math.max(currentKm, goal.distanceKm * 0.8))
    }
    if (taperWeek) taperWeek.targetKm = round5(peakKm * TAPER_FACTOR)
    raceWeek.targetKm = goal.distanceKm
  }

  const current = weeks.find((w) => w.isCurrent)
  const raceDone =
    today > goal.date ||
    runs.some((r) => r.date === goal.date && (r.distanceKm ?? 0) >= goal.distanceKm * 0.98)

  return {
    weeks,
    baselineKm: round5(baselineKm),
    currentKm: round5(currentKm),
    peakKm,
    achievable,
    weeksLeft: weeks.filter((w) => !w.isPast && !w.isCurrent).length + (current && !current.isPast ? 1 : 0),
    totalLoggedKm: Math.round(totalLoggedKm * 10) / 10,
    runsLogged,
    raceDone,
    thisWeek: current
      ? {
          targetKm: current.targetKm ?? peakKm,
          easyKm: round5((current.targetKm ?? peakKm) * 0.55),
          runsDone: current.runs,
          longestKm: Math.round(current.actualKm * 10) / 10,
          longDone: current.actualKm >= (current.targetKm ?? Infinity)
        }
      : undefined
  }
}
