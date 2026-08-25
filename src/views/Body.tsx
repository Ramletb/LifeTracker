import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { fmtMed, todayISO } from '../lib/dates'
import { TrendChart } from '../components/charts'
import { Card, StatTile } from '../components/ui'
import type { Profile } from '../types'

export function Body({ profile }: { profile: Profile }) {
  const entries = useLiveQuery(() => db.body.orderBy('date').toArray(), []) ?? []
  const [showAdd, setShowAdd] = useState(false)

  const weights = entries.filter((e) => e.weightKg !== undefined)
  const fats = entries.filter((e) => e.bodyFatPct !== undefined)
  const latest = entries[entries.length - 1]
  const latestWeight = weights[weights.length - 1]
  const latestFat = fats[fats.length - 1]

  const bmi =
    latestWeight?.weightKg !== undefined && profile.heightCm
      ? latestWeight.weightKg / Math.pow(profile.heightCm / 100, 2)
      : undefined

  const leanEntries = entries.filter((e) => e.leanMassKg !== undefined)
  const latestLean = leanEntries[leanEntries.length - 1]

  return (
    <>
      <div className="tile-grid" style={{ marginTop: 12 }}>
        <StatTile
          label="Weight"
          value={latestWeight?.weightKg?.toFixed(1) ?? '–'}
          unit="kg"
          sub={profile.weightTargetKg ? `target ${profile.weightTargetKg} kg` : undefined}
        />
        <StatTile
          label="Body fat"
          value={latestFat?.bodyFatPct?.toFixed(1) ?? '–'}
          unit="%"
          sub={latestFat ? fmtMed(latestFat.date) : undefined}
        />
        <StatTile
          label="Lean mass"
          value={latestLean?.leanMassKg?.toFixed(1) ?? '–'}
          unit="kg"
          sub={latestLean?.source}
        />
        <StatTile
          label="BMI"
          value={bmi?.toFixed(1) ?? '–'}
          sub={profile.heightCm ? `at ${profile.heightCm} cm` : 'set height in Settings'}
        />
      </div>

      {weights.length >= 2 && (
        <Card eyebrow="Trend" title="Weight">
          <TrendChart
            points={weights.map((e) => ({ date: e.date, value: e.weightKg! }))}
            unit="kg"
            decimals={1}
          />
        </Card>
      )}
      {fats.length >= 2 && (
        <Card eyebrow="Trend" title="Body fat">
          <TrendChart
            points={fats.map((e) => ({ date: e.date, value: e.bodyFatPct! }))}
            unit="%"
            decimals={1}
          />
        </Card>
      )}

      <div className="form-row">
        <button className="btn btn-primary" type="button" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? 'Hide form' : 'Add entry'}
        </button>
      </div>

      {showAdd && <AddBody onDone={() => setShowAdd(false)} />}

      <Card eyebrow="History" title="Entries">
        {entries.length === 0 ? (
          <p className="empty">
            Log weigh-ins and body scans (DEXA, InBody) here — weight, body
            fat, lean mass and visceral fat all trend over time.
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Weight</th>
                  <th>Fat %</th>
                  <th>Lean</th>
                  <th>Source</th>
                  <th aria-label="actions" />
                </tr>
              </thead>
              <tbody>
                {[...entries].reverse().map((e) => (
                  <tr key={e.id}>
                    <td>{fmtMed(e.date)}</td>
                    <td className="num">{e.weightKg?.toFixed(1) ?? ''}</td>
                    <td className="num">{e.bodyFatPct?.toFixed(1) ?? ''}</td>
                    <td className="num">{e.leanMassKg?.toFixed(1) ?? ''}</td>
                    <td>{e.source ?? ''}</td>
                    <td>
                      <button className="btn-ghost" type="button" onClick={() => db.body.delete(e.id!)}>
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {latest?.note && <p className="note">Latest note: {latest.note}</p>}
    </>
  )
}

function AddBody({ onDone }: { onDone: () => void }) {
  const [date, setDate] = useState(todayISO())
  const [weight, setWeight] = useState('')
  const [fat, setFat] = useState('')
  const [lean, setLean] = useState('')
  const [waist, setWaist] = useState('')
  const [visceral, setVisceral] = useState('')
  const [source, setSource] = useState('scale')

  return (
    <Card eyebrow="New entry" title="Body measurement">
      <form
        className="form-grid"
        onSubmit={async (e) => {
          e.preventDefault()
          await db.body.add({
            date,
            weightKg: weight ? Number(weight) : undefined,
            bodyFatPct: fat ? Number(fat) : undefined,
            leanMassKg: lean ? Number(lean) : undefined,
            waistCm: waist ? Number(waist) : undefined,
            visceralFat: visceral ? Number(visceral) : undefined,
            source
          })
          onDone()
        }}
      >
        <label className="field">
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>
        <label className="field">
          Source
          <select value={source} onChange={(e) => setSource(e.target.value)}>
            <option value="scale">Scale</option>
            <option value="DEXA">DEXA</option>
            <option value="InBody">InBody</option>
            <option value="tape">Tape measure</option>
          </select>
        </label>
        <label className="field">
          Weight (kg)
          <input type="number" step="0.1" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </label>
        <label className="field">
          Body fat (%)
          <input type="number" step="0.1" inputMode="decimal" value={fat} onChange={(e) => setFat(e.target.value)} />
        </label>
        <label className="field">
          Lean mass (kg)
          <input type="number" step="0.1" inputMode="decimal" value={lean} onChange={(e) => setLean(e.target.value)} />
        </label>
        <label className="field">
          Waist (cm)
          <input type="number" step="0.1" inputMode="decimal" value={waist} onChange={(e) => setWaist(e.target.value)} />
        </label>
        <label className="field">
          Visceral fat rating
          <input type="number" step="1" inputMode="numeric" value={visceral} onChange={(e) => setVisceral(e.target.value)} />
        </label>
        <div className="span-2">
          <button className="btn btn-primary" type="submit">
            Save entry
          </button>
        </div>
      </form>
    </Card>
  )
}
