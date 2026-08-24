import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, upsertDaily } from '../db'
import { addDays, fmtMed, todayISO } from '../lib/dates'
import {
  parseDailyCSV,
  parseFoodCSV,
  parseWorkoutsCSV
} from '../lib/csv'
import { MacroBar } from '../components/charts'
import { Card, FileButton, Seg } from '../components/ui'
import type { DailyMetrics, Meal, Profile } from '../types'

type SubTab = 'food' | 'workouts' | 'daily'

export function Log({ profile }: { profile: Profile }) {
  const [sub, setSub] = useState<SubTab>('food')
  const [date, setDate] = useState(todayISO())

  return (
    <>
      <Seg
        options={[
          { id: 'food', label: 'Food' },
          { id: 'workouts', label: 'Workouts' },
          { id: 'daily', label: 'Daily' }
        ]}
        value={sub}
        onChange={setSub}
      />
      <div className="form-row" style={{ marginTop: 0, alignItems: 'center' }}>
        <button className="btn btn-sm" type="button" onClick={() => setDate(addDays(date, -1))}>
          ←
        </button>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ width: 'auto', flex: 1 }}
        />
        <button
          className="btn btn-sm"
          type="button"
          disabled={date >= todayISO()}
          onClick={() => setDate(addDays(date, 1))}
        >
          →
        </button>
      </div>
      {sub === 'food' && <FoodLog date={date} profile={profile} />}
      {sub === 'workouts' && <WorkoutLog date={date} />}
      {sub === 'daily' && <DailyLog date={date} />}
    </>
  )
}

const MEALS: Meal[] = ['breakfast', 'lunch', 'dinner', 'snack']

function FoodLog({ date, profile }: { date: string; profile: Profile }) {
  const entries =
    useLiveQuery(() => db.food.where('date').equals(date).toArray(), [date]) ?? []
  const [msg, setMsg] = useState<string | null>(null)

  const kcal = entries.reduce((a, f) => a + f.calories, 0)
  const protein = entries.reduce((a, f) => a + f.protein, 0)
  const carbs = entries.reduce((a, f) => a + f.carbs, 0)
  const fat = entries.reduce((a, f) => a + f.fat, 0)
  const fiber = entries.reduce((a, f) => a + (f.fiber ?? 0), 0)

  return (
    <>
      <Card
        eyebrow="Day total"
        title={`${kcal.toLocaleString()} kcal`}
        action={
          <span className="note mono">
            of {profile.calorieTarget.toLocaleString()}
          </span>
        }
      >
        <MacroBar
          segments={[
            { label: 'Protein', kcal: protein * 4, grams: protein, colorVar: '--series-1' },
            { label: 'Carbs', kcal: carbs * 4, grams: carbs, colorVar: '--series-2' },
            { label: 'Fat', kcal: fat * 9, grams: fat, colorVar: '--series-3' }
          ]}
        />
        <p className="note" style={{ marginBottom: 0 }}>
          Fiber {Math.round(fiber)}g of {profile.fiberTarget}g
        </p>
      </Card>

      {MEALS.map((meal) => {
        const rows = entries.filter((e) => e.meal === meal)
        if (rows.length === 0) return null
        return (
          <Card key={meal} eyebrow={meal} title={`${rows.reduce((a, r) => a + r.calories, 0)} kcal`}>
            <div className="row-list">
              {rows.map((r) => (
                <div className="row-item" key={r.id}>
                  <div className="row-main">
                    <div className="row-title">{r.name}</div>
                    <div className="row-sub">
                      P{Math.round(r.protein)} C{Math.round(r.carbs)} F{Math.round(r.fat)}
                    </div>
                  </div>
                  <div className="row-value">
                    {r.calories}
                    <small> kcal</small>
                  </div>
                  <button
                    className="btn-ghost"
                    type="button"
                    onClick={() => db.food.delete(r.id!)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )
      })}

      <AddFood date={date} />

      <Card eyebrow="Import" title="MyNetDiary / CSV">
        <p className="note">
          Export your food log from MyNetDiary (CSV) and import it here. Any
          CSV with date, food name and calories columns works — meal, protein,
          carbs, fat, fiber and sodium come along when present.
        </p>
        <div className="form-row">
          <FileButton
            label="Import food CSV"
            accept=".csv,text/csv"
            onText={async (t) => {
              const res = parseFoodCSV(t)
              if (res.entries.length > 0) await db.food.bulkAdd(res.entries)
              setMsg(
                res.errors.length > 0
                  ? res.errors.join(' ')
                  : `Imported ${res.entries.length} food entries.`
              )
            }}
          />
        </div>
        {msg && <p className={msg.startsWith('Imported') ? 'msg-ok' : 'msg-err'}>{msg}</p>}
      </Card>
    </>
  )
}

function AddFood({ date }: { date: string }) {
  const [meal, setMeal] = useState<Meal>('snack')
  const [name, setName] = useState('')
  const [cal, setCal] = useState('')
  const [p, setP] = useState('')
  const [c, setC] = useState('')
  const [f, setF] = useState('')
  const [fib, setFib] = useState('')

  return (
    <Card eyebrow="Quick add" title="Add food">
      <form
        className="form-grid"
        onSubmit={async (e) => {
          e.preventDefault()
          if (!name || !cal) return
          await db.food.add({
            date,
            meal,
            name,
            calories: Number(cal),
            protein: Number(p) || 0,
            carbs: Number(c) || 0,
            fat: Number(f) || 0,
            fiber: fib ? Number(fib) : undefined
          })
          setName('')
          setCal('')
          setP('')
          setC('')
          setF('')
          setFib('')
        }}
      >
        <label className="field span-2">
          Food
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Salmon & rice bowl" required />
        </label>
        <label className="field">
          Meal
          <select value={meal} onChange={(e) => setMeal(e.target.value as Meal)}>
            {MEALS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Calories
          <input type="number" inputMode="numeric" value={cal} onChange={(e) => setCal(e.target.value)} required />
        </label>
        <label className="field">
          Protein (g)
          <input type="number" inputMode="numeric" value={p} onChange={(e) => setP(e.target.value)} />
        </label>
        <label className="field">
          Carbs (g)
          <input type="number" inputMode="numeric" value={c} onChange={(e) => setC(e.target.value)} />
        </label>
        <label className="field">
          Fat (g)
          <input type="number" inputMode="numeric" value={f} onChange={(e) => setF(e.target.value)} />
        </label>
        <label className="field">
          Fiber (g)
          <input type="number" inputMode="numeric" value={fib} onChange={(e) => setFib(e.target.value)} />
        </label>
        <div className="span-2">
          <button className="btn btn-primary" type="submit">
            Add to {meal}
          </button>
        </div>
      </form>
    </Card>
  )
}

const WORKOUT_TYPES = [
  'Walk',
  'Run',
  'Ride',
  'Strength',
  'Swim',
  'Yoga',
  'HIIT',
  'Hike',
  'Other'
]

function WorkoutLog({ date }: { date: string }) {
  const recent =
    useLiveQuery(
      () => db.workouts.where('date').aboveOrEqual(addDays(date, -13)).and((w) => w.date <= date).sortBy('date'),
      [date]
    ) ?? []
  const [type, setType] = useState('Strength')
  const [minutes, setMinutes] = useState('')
  const [calories, setCalories] = useState('')
  const [distance, setDistance] = useState('')
  const [hr, setHr] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  return (
    <>
      <Card eyebrow="Quick add" title={`Workout on ${fmtMed(date)}`}>
        <form
          className="form-grid"
          onSubmit={async (e) => {
            e.preventDefault()
            if (!minutes) return
            await db.workouts.add({
              date,
              type,
              minutes: Number(minutes),
              calories: calories ? Number(calories) : undefined,
              distanceKm: distance ? Number(distance) : undefined,
              avgHr: hr ? Number(hr) : undefined
            })
            setMinutes('')
            setCalories('')
            setDistance('')
            setHr('')
          }}
        >
          <label className="field">
            Type
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {WORKOUT_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Minutes
            <input type="number" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} required />
          </label>
          <label className="field">
            Calories
            <input type="number" inputMode="numeric" value={calories} onChange={(e) => setCalories(e.target.value)} />
          </label>
          <label className="field">
            Distance (km)
            <input type="number" step="any" inputMode="decimal" value={distance} onChange={(e) => setDistance(e.target.value)} />
          </label>
          <label className="field">
            Avg HR
            <input type="number" inputMode="numeric" value={hr} onChange={(e) => setHr(e.target.value)} />
          </label>
          <div className="span-2">
            <button className="btn btn-primary" type="submit">
              Add workout
            </button>
          </div>
        </form>
      </Card>

      <Card eyebrow="History" title="Last 14 days">
        {recent.length === 0 ? (
          <p className="empty">No workouts logged in this window.</p>
        ) : (
          <div className="row-list">
            {[...recent].reverse().map((w) => (
              <div className="row-item" key={w.id}>
                <div className="row-main">
                  <div className="row-title">{w.type}</div>
                  <div className="row-sub">
                    {fmtMed(w.date)} · {w.minutes} min
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
                <button className="btn-ghost" type="button" onClick={() => db.workouts.delete(w.id!)}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card eyebrow="Import" title="Apple Watch / CSV">
        <p className="note">
          Export workouts from Apple Health (via an app like "Health Export
          CSV") and import them here. Needs date, type and minutes columns;
          calories, distance and average heart rate come along when present.
        </p>
        <div className="form-row">
          <FileButton
            label="Import workouts CSV"
            accept=".csv,text/csv"
            onText={async (t) => {
              const res = parseWorkoutsCSV(t)
              if (res.entries.length > 0) await db.workouts.bulkAdd(res.entries)
              setMsg(
                res.errors.length > 0
                  ? res.errors.join(' ')
                  : `Imported ${res.entries.length} workouts.`
              )
            }}
          />
        </div>
        {msg && <p className={msg.startsWith('Imported') ? 'msg-ok' : 'msg-err'}>{msg}</p>}
      </Card>
    </>
  )
}

function DailyLog({ date }: { date: string }) {
  const row = useLiveQuery(() => db.daily.where('date').equals(date).first(), [date])
  const [msg, setMsg] = useState<string | null>(null)

  const save = async (field: keyof DailyMetrics, raw: string) => {
    const v = raw === '' ? undefined : Number(raw)
    if (v !== undefined && !Number.isFinite(v)) return
    await upsertDaily(date, { [field]: v } as Partial<DailyMetrics>)
  }

  const fields: { key: keyof DailyMetrics; label: string; step?: string }[] = [
    { key: 'steps', label: 'Steps' },
    { key: 'sleepHours', label: 'Sleep (h)', step: '0.1' },
    { key: 'restingHr', label: 'Resting HR (bpm)' },
    { key: 'activeCalories', label: 'Active calories' },
    { key: 'systolic', label: 'BP systolic' },
    { key: 'diastolic', label: 'BP diastolic' }
  ]

  return (
    <>
      <Card eyebrow="Daily metrics" title={fmtMed(date)}>
        <p className="note">
          Steps and sleep from your watch, blood pressure from a cuff. Values
          save as you leave each field.
        </p>
        <div className="form-grid">
          {fields.map((f) => (
            <label className="field" key={String(f.key)}>
              {f.label}
              <input
                type="number"
                step={f.step ?? '1'}
                inputMode="decimal"
                key={`${date}-${String(f.key)}-${row?.[f.key] ?? ''}`}
                defaultValue={(row?.[f.key] as number | undefined) ?? ''}
                onBlur={(e) => save(f.key, e.target.value)}
              />
            </label>
          ))}
        </div>
      </Card>

      <Card eyebrow="Import" title="Daily metrics CSV">
        <p className="note">
          CSV with a <span className="mono">date</span> column plus any of{' '}
          <span className="mono">steps, sleep_hours, resting_hr, active_calories, systolic, diastolic</span>.
          Existing days are updated, not duplicated.
        </p>
        <div className="form-row">
          <FileButton
            label="Import daily CSV"
            accept=".csv,text/csv"
            onText={async (t) => {
              const res = parseDailyCSV(t)
              for (const entry of res.entries) {
                const { date: d, ...patch } = entry
                await upsertDaily(d, patch)
              }
              setMsg(
                res.errors.length > 0
                  ? res.errors.join(' ')
                  : `Imported ${res.entries.length} days.`
              )
            }}
          />
        </div>
        {msg && <p className={msg.startsWith('Imported') ? 'msg-ok' : 'msg-err'}>{msg}</p>}
      </Card>
    </>
  )
}
