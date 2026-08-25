import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { buildPlan, isRunType, type Plan, type PlanWeek } from '../lib/plan'
import { fmtMed, fmtShort, todayISO } from '../lib/dates'
import { kmToMiles } from '../lib/voice'
import { Card, StatTile } from '../components/ui'
import type { Goal } from '../types'

/** Miles first — that's how runs get tracked here — with km alongside. */
const fmtDist = (km: number) => `${kmToMiles(km).toFixed(1)} mi · ${km.toFixed(1)} km`
const mi = (km: number) => kmToMiles(km).toFixed(1)

export function Goals({ onOpenVoice }: { onOpenVoice: () => void }) {
  const goals = useLiveQuery(() => db.goals.toArray(), []) ?? []
  const workouts = useLiveQuery(() => db.workouts.orderBy('date').toArray(), []) ?? []
  const goal = goals[0]

  if (!goal) return <CreateGoal />

  const today = todayISO()
  const plan = buildPlan(goal, workouts, today)
  const runs = workouts.filter((w) => isRunType(w.type)).reverse()

  return (
    <>
      <div className="view-date" style={{ marginTop: 4 }}>
        {goal.title} · {fmtMed(goal.date)}
      </div>

      <Card
        eyebrow="Training plan"
        title={
          plan.raceDone
            ? 'Race week — or done! 🎉'
            : `${plan.weeksLeft} week${plan.weeksLeft === 1 ? '' : 's'} to race day`
        }
        action={
          <button className="btn-ghost" type="button" onClick={onOpenVoice}>
            Log a run
          </button>
        }
      >
        <RunnerTrack plan={plan} goal={goal} />
        <div className="track-legend">
          <span className="legend-item">
            <span className="legend-swatch" style={{ background: 'var(--series-1)' }} />
            longest run done
          </span>
          <span className="legend-item">
            <span className="legend-swatch legend-swatch-ghost" />
            planned long run
          </span>
        </div>
        {!plan.achievable && (
          <p className="msg-err" style={{ marginBottom: 0 }}>
            Heads-up: with a safe weekly build (+15%), the longest run reaches{' '}
            {mi(plan.peakKm)} mi ({plan.peakKm} km) before race day, short of{' '}
            {mi(goal.distanceKm)} mi ({goal.distanceKm} km).
            You can still run-walk the race — or keep logging runs and this
            plan re-plots itself.
          </p>
        )}
      </Card>

      {plan.thisWeek && !plan.raceDone && (
        <Card eyebrow="This week" title={`Long run ${fmtDist(plan.thisWeek.targetKm)}`}>
          <p className="note" style={{ marginTop: 0 }}>
            Plus 2 easy runs of about {fmtDist(plan.thisWeek.easyKm)} each.
            {plan.thisWeek.longDone
              ? ' Long run: done ✓'
              : plan.thisWeek.runsDone > 0
                ? ` Logged ${plan.thisWeek.runsDone} run${plan.thisWeek.runsDone > 1 ? 's' : ''} so far (longest ${mi(plan.thisWeek.longestKm)} mi).`
                : ' Nothing logged yet this week.'}
          </p>
        </Card>
      )}

      <div className="tile-grid">
        <StatTile
          label="Ability now"
          value={mi(plan.currentKm)}
          unit="mi"
          sub={`${plan.currentKm.toFixed(1)} km longest recent`}
        />
        <StatTile
          label="Since start"
          value={`+${mi(Math.max(0, plan.currentKm - plan.baselineKm))}`}
          unit="mi"
          sub={`from a ${mi(plan.baselineKm)} mi base`}
        />
        <StatTile
          label="Logged"
          value={kmToMiles(plan.totalLoggedKm).toFixed(0)}
          unit="mi"
          sub={`${plan.runsLogged} run${plan.runsLogged === 1 ? '' : 's'} · ${plan.totalLoggedKm.toFixed(0)} km`}
        />
      </div>

      <Card eyebrow="Week by week" title="Schedule">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Week</th>
                <th>Dates</th>
                <th>Long run</th>
                <th>Done</th>
              </tr>
            </thead>
            <tbody>
              {plan.weeks.map((w) => (
                <tr key={w.index} className={w.isCurrent ? 'row-current' : undefined}>
                  <td>{w.isRaceWeek ? '🏁' : w.index + 1}</td>
                  <td>
                    {fmtShort(w.start)}–{fmtShort(w.end)}
                  </td>
                  <td className="num">
                    {w.targetKm !== null
                      ? `${mi(w.targetKm)} mi · ${w.targetKm.toFixed(1)} km`
                      : '—'}
                  </td>
                  <td className="num">
                    {w.actualKm > 0
                      ? `${mi(w.actualKm)} mi${w.targetKm !== null && w.actualKm >= w.targetKm ? ' ✓' : ''}`
                      : w.isPast
                        ? '·'
                        : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="note">
          Targets are the week’s longest run and re-plot automatically from
          your logged history — backfill a missed week by voice (“last Tuesday
          I ran 4 miles”) and the plan adjusts.
        </p>
      </Card>

      <Card eyebrow="History" title="Runs logged">
        {runs.length === 0 ? (
          <p className="empty">
            No runs yet. Tap the mic and say “I ran for 25 minutes, completed
            2 miles”.
          </p>
        ) : (
          <div className="row-list">
            {runs.slice(0, 20).map((w) => (
              <div className="row-item" key={w.id}>
                <div className="row-main">
                  <div className="row-title">
                    {w.distanceKm ? fmtDist(w.distanceKm) : w.type}
                  </div>
                  <div className="row-sub">
                    {fmtMed(w.date)} · {w.minutes} min
                    {w.avgHr ? ` · ${w.avgHr} bpm` : ''}
                  </div>
                </div>
                <button className="btn-ghost" type="button" onClick={() => db.workouts.delete(w.id!)}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="form-row">
        <button
          className="btn btn-danger btn-sm"
          type="button"
          onClick={async () => {
            if (goal.id !== undefined) await db.goals.delete(goal.id)
          }}
        >
          Delete goal
        </button>
      </div>
    </>
  )
}

function CreateGoal() {
  const [title, setTitle] = useState('10K race')
  const [distance, setDistance] = useState('10')
  const [date, setDate] = useState('2026-11-26')
  const [startDate, setStartDate] = useState(todayISO())

  return (
    <Card eyebrow="New goal" title="Train toward a race">
      <p className="note" style={{ marginTop: 0 }}>
        Set the race and the plan builds itself from your logged runs: a
        weekly long-run ramp (max +15%/week) from your current ability to
        race distance, with a taper. Every run you log — by voice or by hand,
        even backdated — re-plots the remaining weeks.
      </p>
      <form
        className="form-grid"
        onSubmit={async (e) => {
          e.preventDefault()
          await db.goals.add({
            title,
            distanceKm: Number(distance),
            date,
            startDate
          })
        }}
      >
        <label className="field span-2">
          Goal name
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label className="field">
          Distance
          <select value={distance} onChange={(e) => setDistance(e.target.value)}>
            <option value="5">5K (3.1 mi)</option>
            <option value="10">10K (6.2 mi)</option>
            <option value="21.1">Half marathon (13.1 mi)</option>
            <option value="42.2">Marathon (26.2 mi)</option>
          </select>
        </label>
        <label className="field">
          Race day
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>
        <label className="field">
          Training starts
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </label>
        <div className="span-2">
          <button className="btn btn-primary" type="submit">
            Create goal
          </button>
        </div>
      </form>
    </Card>
  )
}

/**
 * The signature Goals visualization: a linear track from training start to
 * race day. Filled bars are the longest run completed each week; ghost bars
 * are the planned long runs ahead; the runner stands at today; the flag is
 * the race.
 */
function RunnerTrack({ plan, goal }: { plan: Plan; goal: Goal }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [tip, setTip] = useState<PlanWeek | null>(null)

  const step = 30
  const W = Math.max(352, plan.weeks.length * step + 24)
  const H = 132
  const baseY = 96
  const maxKm = Math.max(
    goal.distanceKm,
    plan.peakKm,
    ...plan.weeks.map((w) => w.actualKm)
  )
  const barH = (km: number) => (km / maxKm) * 64

  const currentIdx = plan.weeks.findIndex((w) => w.isCurrent)

  useEffect(() => {
    // Bring "today" into view on first render.
    const el = wrapRef.current
    if (el && currentIdx > 4) {
      el.scrollLeft = Math.max(0, currentIdx * step - el.clientWidth / 2)
    }
  }, [currentIdx])

  const runnerX = (currentIdx >= 0 ? currentIdx : plan.weeks.length - 1) * step + 12 + step / 2

  return (
    <div className="track-wrap" ref={wrapRef}>
      <svg
        width={W}
        height={H}
        className="track-svg"
        role="img"
        aria-label={`Training plan: ${plan.weeks.length} weeks to a ${goal.distanceKm} km race`}
      >
        <line x1={8} x2={W - 8} y1={baseY} y2={baseY} className="chart-axis" />
        {plan.weeks.map((w) => {
          const cx = w.index * step + 12 + step / 2
          const bw = 14
          const showTarget = w.targetKm !== null && !w.isPast
          const showActual = w.actualKm > 0
          return (
            <g
              key={w.index}
              onPointerEnter={() => setTip(w)}
              onPointerDown={() => setTip(w)}
              onPointerLeave={() => setTip(null)}
            >
              <rect x={cx - step / 2} y={16} width={step} height={baseY - 14} fill="transparent" />
              {showTarget && (
                <rect
                  x={cx - bw / 2}
                  y={baseY - barH(w.targetKm!)}
                  width={bw}
                  height={barH(w.targetKm!)}
                  rx={3}
                  className="track-bar-planned"
                />
              )}
              {showActual && (
                <rect
                  x={cx - bw / 2}
                  y={baseY - barH(w.actualKm)}
                  width={bw}
                  height={barH(w.actualKm)}
                  rx={3}
                  className="track-bar-done"
                />
              )}
              {(w.index % 4 === 0 || w.isRaceWeek) && (
                <text x={cx} y={baseY + 16} textAnchor="middle" className="chart-tick">
                  {w.isRaceWeek ? 'RACE' : fmtShort(w.start).split(' ').join(' ')}
                </text>
              )}
            </g>
          )
        })}
        {/* finish flag */}
        <g transform={`translate(${(plan.weeks.length - 1) * step + 12 + step / 2 + 9}, ${baseY - 40})`}>
          <line x1={0} y1={0} x2={0} y2={40} stroke="var(--muted)" strokeWidth={1.5} />
          <path d="M0 0 h12 v9 h-12 z" fill="var(--critical)" />
        </g>
        {/* runner at today */}
        <g transform={`translate(${runnerX}, ${baseY - 4})`} className="track-runner">
          <circle cx={0} cy={-20} r={3.4} fill="var(--accent)" />
          <path
            d="M0 -17 L-1 -9 M0 -14 L5 -11 M0 -14 L-5 -12 M-1 -9 L4 -3 M-1 -9 L-5 -2"
            stroke="var(--accent)"
            strokeWidth={2.2}
            strokeLinecap="round"
            fill="none"
          />
        </g>
      </svg>
      {tip && (
        <div className="chart-tooltip track-tip">
          <span className="tt-date">
            {tip.isRaceWeek ? '🏁 Race week · ' : `Week ${tip.index + 1} · `}
            {fmtShort(tip.start)}–{fmtShort(tip.end)}
          </span>
          <span className="tt-value">
            {tip.targetKm !== null ? `target ${mi(tip.targetKm)} mi (${tip.targetKm.toFixed(1)} km)` : ''}
            {tip.targetKm !== null && tip.actualKm > 0 ? ' · ' : ''}
            {tip.actualKm > 0 ? `done ${mi(tip.actualKm)} mi` : tip.isPast ? 'no runs' : ''}
          </span>
        </div>
      )}
    </div>
  )
}

/** Compact goal status for the Today view. Renders nothing without a goal. */
export function GoalSnapshot({ onGoGoals }: { onGoGoals: () => void }) {
  const goals = useLiveQuery(() => db.goals.toArray(), []) ?? []
  const workouts = useLiveQuery(() => db.workouts.orderBy('date').toArray(), []) ?? []
  const goal = goals[0]
  if (!goal) return null
  const plan = buildPlan(goal, workouts, todayISO())
  return (
    <Card
      eyebrow="Goal"
      title={`${goal.title} · ${plan.weeksLeft} wk${plan.weeksLeft === 1 ? '' : 's'} out`}
      action={
        <button className="btn-ghost" type="button" onClick={onGoGoals}>
          Open →
        </button>
      }
    >
      {plan.thisWeek && (
        <p className="note" style={{ margin: 0 }}>
          This week: long run {fmtDist(plan.thisWeek.targetKm)}
          {plan.thisWeek.longDone
            ? ' — done ✓'
            : ` · ${plan.thisWeek.runsDone} run${plan.thisWeek.runsDone === 1 ? '' : 's'} logged`}
        </p>
      )}
    </Card>
  )
}
