import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { MARKERS, SYSTEMS } from '../data/markers'
import { latestLabs } from '../lib/insights'
import { systemScores } from '../lib/score'
import { fmtWeekday, lastNDays, todayISO } from '../lib/dates'
import { Columns, MacroBar } from '../components/charts'
import { Card, StatTile, SystemRing } from '../components/ui'
import { GoalSnapshot } from './Goals'
import type { Profile, SystemId } from '../types'

export function Today({
  profile,
  onOpenSystem,
  onGoLog,
  onGoGoals
}: {
  profile: Profile
  onOpenSystem: (s: SystemId) => void
  onGoLog: () => void
  onGoGoals: () => void
}) {
  const today = todayISO()
  const days14 = lastNDays(14)

  const labs = useLiveQuery(() => db.labs.toArray(), []) ?? []
  const daily =
    useLiveQuery(
      () => db.daily.where('date').aboveOrEqual(days14[0]).toArray(),
      [days14[0]]
    ) ?? []
  const foodToday =
    useLiveQuery(() => db.food.where('date').equals(today).toArray(), [today]) ?? []
  const workoutsToday =
    useLiveQuery(() => db.workouts.where('date').equals(today).toArray(), [today]) ??
    []
  const body = useLiveQuery(() => db.body.orderBy('date').toArray(), []) ?? []

  const latest = latestLabs(labs)
  const latestValues = new Map(
    [...latest.entries()].map(([id, r]) => [id, r.value])
  )
  const scores = systemScores(MARKERS, latestValues, profile.sex)

  const byDate = new Map(daily.map((d) => [d.date, d]))
  const stepsSeries = lastNDays(7).map((date) => ({
    date,
    value: byDate.get(date)?.steps ?? 0
  }))
  const todayMetrics = byDate.get(today)

  const kcal = foodToday.reduce((a, f) => a + f.calories, 0)
  const protein = foodToday.reduce((a, f) => a + f.protein, 0)
  const carbs = foodToday.reduce((a, f) => a + f.carbs, 0)
  const fat = foodToday.reduce((a, f) => a + f.fat, 0)

  const weights = body.filter((b) => b.weightKg !== undefined)
  const lastWeight = weights[weights.length - 1]
  const prevWeight = weights[weights.length - 2]

  const sleepSpark = lastNDays(7)
    .map((d) => byDate.get(d)?.sleepHours)
    .filter((v): v is number => v !== undefined)

  const hasAnything =
    labs.length > 0 || daily.length > 0 || foodToday.length > 0 || body.length > 0

  return (
    <>
      <div className="view-date">{fmtWeekday(today)}</div>

      <Card
        eyebrow="Body systems"
        title="Systems check"
        action={
          <span className="note mono">
            {latest.size > 0 ? `${latest.size} markers` : ''}
          </span>
        }
      >
        <div className="systems-grid">
          {SYSTEMS.map((s) => {
            const sc = scores.get(s.id)
            return (
              <SystemRing
                key={s.id}
                name={s.name.replace('Cardiovascular', 'Cardio').replace('Micronutrients', 'Micro')}
                score={sc?.score}
                n={sc?.n ?? 0}
                onClick={() => onOpenSystem(s.id)}
              />
            )
          })}
        </div>
        {latest.size === 0 && (
          <p className="empty">
            Add blood test results in the Labs tab (or load sample data from
            Settings) and each system scores itself against optimal ranges.
          </p>
        )}
      </Card>

      <GoalSnapshot onGoGoals={onGoGoals} />

      <div className="tile-grid">
        <StatTile
          label="Steps"
          value={(todayMetrics?.steps ?? 0).toLocaleString()}
          sub={`goal ${profile.stepTarget.toLocaleString()}`}
        />
        <StatTile
          label="Calories"
          value={kcal.toLocaleString()}
          unit="kcal"
          sub={`of ${profile.calorieTarget.toLocaleString()}`}
        />
        <StatTile
          label="Protein"
          value={`${Math.round(protein)}`}
          unit="g"
          sub={`goal ${profile.proteinTarget}g`}
        />
        <StatTile
          label="Sleep"
          value={todayMetrics?.sleepHours?.toFixed(1) ?? '–'}
          unit="h"
          spark={sleepSpark}
        />
        <StatTile
          label="Weight"
          value={lastWeight?.weightKg?.toFixed(1) ?? '–'}
          unit="kg"
          deltaText={
            lastWeight?.weightKg !== undefined && prevWeight?.weightKg !== undefined
              ? `${lastWeight.weightKg - prevWeight.weightKg >= 0 ? '+' : ''}${(lastWeight.weightKg - prevWeight.weightKg).toFixed(1)}`
              : undefined
          }
          deltaGood={
            lastWeight?.weightKg !== undefined &&
            prevWeight?.weightKg !== undefined &&
            profile.weightTargetKg !== undefined
              ? Math.abs(lastWeight.weightKg - profile.weightTargetKg) <=
                Math.abs(prevWeight.weightKg - profile.weightTargetKg)
              : undefined
          }
          spark={weights.slice(-8).map((w) => w.weightKg!)}
        />
        <StatTile
          label="Resting HR"
          value={todayMetrics?.restingHr?.toString() ?? '–'}
          unit="bpm"
          spark={lastNDays(7)
            .map((d) => byDate.get(d)?.restingHr)
            .filter((v): v is number => v !== undefined)}
        />
      </div>

      <Card eyebrow="Movement" title="Steps, last 7 days">
        <Columns data={stepsSeries} unit="steps" target={profile.stepTarget} />
      </Card>

      <Card
        eyebrow="Fuel"
        title="Today’s macros"
        action={
          <button className="btn-ghost" onClick={onGoLog} type="button">
            Log food
          </button>
        }
      >
        {foodToday.length > 0 ? (
          <MacroBar
            segments={[
              { label: 'Protein', kcal: protein * 4, grams: protein, colorVar: '--series-1' },
              { label: 'Carbs', kcal: carbs * 4, grams: carbs, colorVar: '--series-2' },
              { label: 'Fat', kcal: fat * 9, grams: fat, colorVar: '--series-3' }
            ]}
          />
        ) : (
          <p className="empty">Nothing logged yet today.</p>
        )}
      </Card>

      {workoutsToday.length > 0 && (
        <Card eyebrow="Training" title="Today’s workouts">
          <div className="row-list">
            {workoutsToday.map((w) => (
              <div className="row-item" key={w.id}>
                <div className="row-main">
                  <div className="row-title">{w.type}</div>
                  <div className="row-sub">
                    {w.minutes} min
                    {w.distanceKm ? ` · ${w.distanceKm} km` : ''}
                    {w.avgHr ? ` · ${w.avgHr} bpm` : ''}
                  </div>
                </div>
                {w.calories !== undefined && (
                  <div className="row-value">
                    {w.calories}
                    <small> kcal</small>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {!hasAnything && (
        <p className="disclaimer">
          This is your health console. Everything you log stays in this
          browser (nothing is uploaded anywhere). Start with the Labs tab to
          enter blood test results, or open Settings (top right) and load
          sample data to explore.
        </p>
      )}
    </>
  )
}
