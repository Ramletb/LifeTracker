import { describe, expect, it } from 'vitest'
import { buildPlan } from './plan'
import type { Goal, Workout } from '../types'

const GOAL: Goal = {
  title: '10K race',
  distanceKm: 10,
  date: '2026-11-26',
  startDate: '2026-08-24'
}

const run = (date: string, distanceKm: number): Workout => ({
  date,
  type: 'Run',
  minutes: Math.round(distanceKm * 7),
  distanceKm
})

describe('buildPlan', () => {
  it('builds a ramp from current ability to race distance with a taper', () => {
    const plan = buildPlan(GOAL, [run('2026-08-20', 3.2)], '2026-08-24')
    expect(plan.currentKm).toBe(3)
    expect(plan.weeks.length).toBeGreaterThanOrEqual(13)
    const race = plan.weeks[plan.weeks.length - 1]
    expect(race.isRaceWeek).toBe(true)
    expect(race.targetKm).toBe(10)
    // taper week backs off from the peak
    const taper = plan.weeks[plan.weeks.length - 2]
    expect(taper.targetKm).toBeLessThan(plan.peakKm)
    // targets never regress during the build
    const buildTargets = plan.weeks
      .slice(0, -2)
      .map((w) => w.targetKm)
      .filter((t): t is number => t !== null)
    for (let i = 1; i < buildTargets.length; i++) {
      expect(buildTargets[i]).toBeGreaterThanOrEqual(buildTargets[i - 1])
    }
    expect(plan.achievable).toBe(true)
  })

  it('uses a safe default base when there is no run history', () => {
    const plan = buildPlan(GOAL, [], '2026-08-24')
    expect(plan.currentKm).toBe(2.5)
    expect(plan.achievable).toBe(true) // 14 weeks is enough from scratch
  })

  it('recalibrates when history is backfilled', () => {
    const sparse = buildPlan(GOAL, [], '2026-09-21')
    const backfilled = buildPlan(
      GOAL,
      [run('2026-09-05', 5), run('2026-09-19', 6.5)],
      '2026-09-21'
    )
    expect(backfilled.currentKm).toBeGreaterThan(sparse.currentKm)
    const firstTarget = (p: typeof sparse) =>
      p.weeks.find((w) => w.isCurrent)?.targetKm ?? 0
    expect(firstTarget(backfilled)).toBeGreaterThan(firstTarget(sparse))
    // past weeks carry actuals
    const week = backfilled.weeks.find(
      (w) => '2026-09-19' >= w.start && '2026-09-19' <= w.end
    )!
    expect(week.actualKm).toBe(6.5)
  })

  it('flags an unachievable ramp when too little time remains', () => {
    const lateGoal: Goal = { ...GOAL, startDate: '2026-11-01' }
    const plan = buildPlan(lateGoal, [run('2026-10-30', 2.5)], '2026-11-02')
    expect(plan.achievable).toBe(false)
    expect(plan.peakKm).toBeLessThan(10)
  })

  it('summarizes the current week', () => {
    const plan = buildPlan(GOAL, [run('2026-08-25', 3)], '2026-08-26')
    expect(plan.thisWeek).toBeDefined()
    expect(plan.thisWeek!.runsDone).toBe(1)
    expect(plan.thisWeek!.targetKm).toBeGreaterThan(0)
  })
})
