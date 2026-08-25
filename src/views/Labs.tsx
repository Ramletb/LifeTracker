import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, importLabResults } from '../db'
import { MARKERS, SYSTEMS, markerById, systemName } from '../data/markers'
import { fmtMed, todayISO } from '../lib/dates'
import { parseLabsCSV, type LabImportResult } from '../lib/csv'
import { fmtRange, markerStatus, rangesFor, type Sex } from '../lib/score'
import { Sparkline, TrendChart } from '../components/charts'
import { Card, FileButton, StatusPill } from '../components/ui'
import type { MarkerDef, Profile, SystemId } from '../types'

type Filter = 'all' | SystemId

export function Labs({
  profile,
  focusSystem,
  onFocusHandled
}: {
  profile: Profile
  focusSystem: SystemId | null
  onFocusHandled: () => void
}) {
  const sex = profile.sex
  const [filter, setFilter] = useState<Filter>('all')
  const [openMarker, setOpenMarker] = useState<string | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    if (focusSystem) {
      setFilter(focusSystem)
      onFocusHandled()
    }
  }, [focusSystem, onFocusHandled])

  const labs = useLiveQuery(() => db.labs.orderBy('date').toArray(), []) ?? []

  const byMarker = useMemo(() => {
    const m = new Map<string, typeof labs>()
    for (const r of labs) {
      const arr = m.get(r.markerId) ?? []
      arr.push(r)
      m.set(r.markerId, arr)
    }
    return m
  }, [labs])

  const visible = MARKERS.filter((d) => filter === 'all' || d.category === filter)
  const tracked = visible.filter((d) => byMarker.has(d.id))
  const untracked = visible.filter((d) => !byMarker.has(d.id))

  const grouped = new Map<SystemId, MarkerDef[]>()
  for (const d of tracked) {
    const arr = grouped.get(d.category) ?? []
    arr.push(d)
    grouped.set(d.category, arr)
  }

  return (
    <>
      <div className="chip-row">
        <button
          type="button"
          className={`chip${filter === 'all' ? ' is-active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        {SYSTEMS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`chip${filter === s.id ? ' is-active' : ''}`}
            onClick={() => setFilter(s.id)}
          >
            {s.name}
          </button>
        ))}
      </div>

      <div className="form-row">
        <button className="btn btn-primary" onClick={() => setShowAdd(true)} type="button">
          Add result
        </button>
        <button className="btn" onClick={() => setShowImport(true)} type="button">
          Import CSV
        </button>
      </div>

      {tracked.length === 0 && (
        <p className="empty">
          No results yet{filter !== 'all' ? ' in this system' : ''}. Add one
          result at a time, or import a CSV with columns{' '}
          <span className="mono">date, marker, value</span>.
        </p>
      )}

      {[...grouped.entries()].map(([sys, defs]) => (
        <div key={sys}>
          <div className="group-head">{systemName(sys)}</div>
          <Card>
            <div className="row-list">
              {defs.map((def) => {
                const rows = byMarker.get(def.id)!
                const latest = rows[rows.length - 1]
                const status = markerStatus(def, latest.value, sex)
                return (
                  <button
                    key={def.id}
                    type="button"
                    className="row-item"
                    onClick={() => setOpenMarker(def.id)}
                  >
                    <div className="row-main">
                      <div className="row-title">{def.short}</div>
                      <div className="row-sub">{fmtMed(latest.date)}</div>
                    </div>
                    <Sparkline points={rows.map((r) => r.value)} width={56} height={20} />
                    <div className="row-value">
                      {latest.value.toFixed(def.decimals)}
                      <small> {def.unit}</small>
                    </div>
                    <StatusPill status={status} />
                  </button>
                )
              })}
            </div>
          </Card>
        </div>
      ))}

      {untracked.length > 0 && (
        <>
          <div className="group-head">Not tracked yet</div>
          <Card>
            <div className="row-list">
              {untracked.map((def) => (
                <button
                  key={def.id}
                  type="button"
                  className="row-item"
                  onClick={() => setOpenMarker(def.id)}
                >
                  <div className="row-main">
                    <div className="row-title">{def.name}</div>
                    <div className="row-sub">{systemName(def.category)}</div>
                  </div>
                  <span className="note">＋</span>
                </button>
              ))}
            </div>
          </Card>
        </>
      )}

      {openMarker && (
        <MarkerDetail
          def={markerById.get(openMarker)!}
          sex={sex}
          onClose={() => setOpenMarker(null)}
        />
      )}
      {showImport && <ImportLabs onClose={() => setShowImport(false)} />}
      {showAdd && <AddResult sex={sex} onClose={() => setShowAdd(false)} />}
    </>
  )
}

function Modal({
  title,
  onClose,
  children
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h2 className="modal-title">{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close" type="button">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export { Modal }

function MarkerDetail({
  def,
  sex,
  onClose
}: {
  def: MarkerDef
  sex?: Sex
  onClose: () => void
}) {
  const rows =
    useLiveQuery(
      () => db.labs.where('markerId').equals(def.id).sortBy('date'),
      [def.id]
    ) ?? []
  const [date, setDate] = useState(todayISO())
  const [value, setValue] = useState('')

  const latest = rows[rows.length - 1]
  const { std, opt } = rangesFor(def, sex)

  return (
    <Modal title={def.name} onClose={onClose}>
      {latest && (
        <p className="note" style={{ marginTop: 0 }}>
          Latest: <b className="mono">{latest.value.toFixed(def.decimals)} {def.unit}</b>{' '}
          ({fmtMed(latest.date)}) <StatusPill status={markerStatus(def, latest.value, sex)} />
        </p>
      )}
      {rows.length > 0 && (
        <TrendChart
          points={rows.map((r) => ({ date: r.date, value: r.value }))}
          unit={def.unit}
          decimals={def.decimals}
          opt={opt}
        />
      )}
      <p className="note">
        Optimal <b className="mono">{fmtRange(opt, def.decimals)}</b> · reference{' '}
        <b className="mono">{fmtRange(std, def.decimals)}</b> {def.unit}
      </p>
      <p style={{ fontSize: 13.5 }}>{def.desc}</p>
      {def.advice && (
        <p style={{ fontSize: 13.5 }} className="note">
          <b>If it needs work:</b> {def.advice}
        </p>
      )}

      <form
        className="form-grid"
        onSubmit={async (e) => {
          e.preventDefault()
          const v = Number(value)
          if (!Number.isFinite(v)) return
          await db.labs.add({ date, markerId: def.id, value: v })
          setValue('')
        }}
      >
        <label className="field">
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>
        <label className="field">
          Value ({def.unit})
          <input
            type="number"
            step="any"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
          />
        </label>
        <div className="span-2">
          <button className="btn btn-primary" type="submit">
            Save result
          </button>
        </div>
      </form>

      {rows.length > 0 && (
        <div className="table-wrap" style={{ marginTop: 14 }}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Value</th>
                <th>Status</th>
                <th aria-label="actions" />
              </tr>
            </thead>
            <tbody>
              {[...rows].reverse().map((r) => (
                <tr key={r.id}>
                  <td>{fmtMed(r.date)}</td>
                  <td className="num">
                    {r.value.toFixed(def.decimals)} {def.unit}
                  </td>
                  <td>
                    <StatusPill status={markerStatus(def, r.value, sex)} />
                  </td>
                  <td>
                    <button
                      className="btn-ghost"
                      type="button"
                      onClick={() => db.labs.delete(r.id!)}
                      aria-label={`Delete result from ${r.date}`}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  )
}

function AddResult({ sex, onClose }: { sex?: Sex; onClose: () => void }) {
  const [markerId, setMarkerId] = useState(MARKERS[0].id)
  const [date, setDate] = useState(todayISO())
  const [value, setValue] = useState('')
  const [saved, setSaved] = useState<string | null>(null)
  const def = markerById.get(markerId)!
  const { std, opt } = rangesFor(def, sex)

  return (
    <Modal title="Add lab result" onClose={onClose}>
      <form
        className="form-grid"
        onSubmit={async (e) => {
          e.preventDefault()
          const v = Number(value)
          if (!Number.isFinite(v)) return
          await db.labs.add({ date, markerId, value: v })
          setSaved(`Saved ${def.name}: ${v} ${def.unit}`)
          setValue('')
        }}
      >
        <label className="field span-2">
          Marker
          <select value={markerId} onChange={(e) => setMarkerId(e.target.value)}>
            {SYSTEMS.map((s) => (
              <optgroup key={s.id} label={s.name}>
                {MARKERS.filter((m) => m.category === s.id).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.unit})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="field">
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>
        <label className="field">
          Value ({def.unit})
          <input
            type="number"
            step="any"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
          />
        </label>
        <div className="span-2 form-row" style={{ marginTop: 0 }}>
          <button className="btn btn-primary" type="submit">
            Save
          </button>
          <button className="btn" type="button" onClick={onClose}>
            Done
          </button>
          {saved && <span className="msg-ok">{saved}</span>}
        </div>
      </form>
      <p className="note">
        Optimal {fmtRange(opt, def.decimals)} · reference{' '}
        {fmtRange(std, def.decimals)} {def.unit}. {def.desc}
      </p>
    </Modal>
  )
}

function ImportLabs({ onClose }: { onClose: () => void }) {
  const [pasted, setPasted] = useState('')
  const [preview, setPreview] = useState<LabImportResult | null>(null)
  const [done, setDone] = useState<string | null>(null)

  const runPreview = (text: string) => {
    setPreview(parseLabsCSV(text))
    setDone(null)
  }

  return (
    <Modal title="Import lab results" onClose={onClose}>
      <p className="note">
        CSV with a header row and columns <span className="mono">date, marker, value</span>{' '}
        — e.g. <span className="mono">2026-08-01, ApoB, 84</span>. Marker names
        are matched loosely (LDL-C, "Apolipoprotein B", A1c…). Values must be
        in the units shown on the Labs list.
      </p>
      <div className="form-row">
        <FileButton
          label="Choose CSV file"
          accept=".csv,text/csv"
          onText={(t) => runPreview(t)}
        />
      </div>
      <label className="field" style={{ marginTop: 10 }}>
        Or paste CSV
        <textarea
          rows={5}
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          placeholder={'date,marker,value\n2026-08-01,ApoB,84'}
        />
      </label>
      {pasted.trim() && (
        <div className="form-row">
          <button className="btn" type="button" onClick={() => runPreview(pasted)}>
            Preview
          </button>
        </div>
      )}
      {preview && (
        <div style={{ marginTop: 10 }}>
          <p className="msg-ok">{preview.results.length} results matched.</p>
          {preview.unmatched.length > 0 && (
            <p className="msg-err">
              Unrecognized markers (skipped): {preview.unmatched.join(', ')}
            </p>
          )}
          {preview.errors.map((e, i) => (
            <p key={i} className="msg-err">
              {e}
            </p>
          ))}
          {preview.results.length > 0 && !done && (
            <button
              className="btn btn-primary"
              type="button"
              onClick={async () => {
                const { added, skipped } = await importLabResults(preview.results)
                setDone(
                  `Imported ${added} results.${skipped > 0 ? ` Skipped ${skipped} already-recorded duplicates.` : ''}`
                )
              }}
            >
              Import {preview.results.length} results
            </button>
          )}
          {done && <p className="msg-ok">{done}</p>}
        </div>
      )}
    </Modal>
  )
}
