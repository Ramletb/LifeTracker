import { useState } from 'react'
import { saveProfile, wipeAllData } from '../db'
import { exportBackup, importBackup } from '../lib/backup'
import { loadSampleData } from '../lib/sample'
import { FileButton } from '../components/ui'
import { Modal } from './Labs'
import type { Profile } from '../types'

export function Settings({
  profile,
  onClose
}: {
  profile: Profile
  onClose: () => void
}) {
  const [form, setForm] = useState<Profile>(profile)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [confirmWipe, setConfirmWipe] = useState(false)

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const numField = (
    key: keyof Profile,
    label: string,
    step = '1'
  ) => (
    <label className="field" key={String(key)}>
      {label}
      <input
        type="number"
        step={step}
        inputMode="decimal"
        value={(form[key] as number | undefined) ?? ''}
        onChange={(e) =>
          set(key, (e.target.value === '' ? undefined : Number(e.target.value)) as never)
        }
      />
    </label>
  )

  return (
    <Modal title="Settings" onClose={onClose}>
      <div className="group-head" style={{ marginTop: 0 }}>
        Profile
      </div>
      <div className="form-grid">
        <label className="field">
          Name
          <input value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} />
        </label>
        <label className="field">
          Sex (for reference ranges)
          <select
            value={form.sex ?? ''}
            onChange={(e) => set('sex', (e.target.value || undefined) as Profile['sex'])}
          >
            <option value="">—</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </label>
        {numField('birthYear', 'Birth year')}
        {numField('heightCm', 'Height (cm)')}
      </div>

      <div className="group-head">Daily targets</div>
      <div className="form-grid">
        {numField('calorieTarget', 'Calories (kcal)')}
        {numField('proteinTarget', 'Protein (g)')}
        {numField('fiberTarget', 'Fiber (g)')}
        {numField('stepTarget', 'Steps')}
        {numField('sleepTarget', 'Sleep (h)', '0.1')}
        {numField('weightTargetKg', 'Weight target (kg)', '0.1')}
      </div>

      <div className="group-head">Appearance</div>
      <label className="field">
        Theme
        <select
          value={form.theme}
          onChange={(e) => set('theme', e.target.value as Profile['theme'])}
        >
          <option value="auto">Match system</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>

      <div className="form-row">
        <button
          className="btn btn-primary"
          type="button"
          onClick={async () => {
            await saveProfile(form)
            setMsg('Saved.')
          }}
        >
          Save settings
        </button>
        {msg && <span className="msg-ok">{msg}</span>}
      </div>

      <div className="group-head">Your data</div>
      <p className="note">
        Everything lives in this browser’s local storage — nothing is uploaded.
        Export a backup before clearing the browser or switching phones.
      </p>
      <div className="form-row">
        <button className="btn" type="button" onClick={() => exportBackup()}>
          Export backup
        </button>
        <FileButton
          label="Restore backup"
          accept=".json,application/json"
          onText={async (t) => {
            try {
              setMsg(await importBackup(t))
              setErr(null)
            } catch (e) {
              setErr(e instanceof Error ? e.message : 'Import failed.')
            }
          }}
        />
      </div>
      <div className="form-row">
        <button
          className="btn"
          type="button"
          onClick={async () => {
            await loadSampleData()
            setMsg('Sample data loaded — explore the tabs.')
          }}
        >
          Load sample data
        </button>
        {!confirmWipe ? (
          <button className="btn btn-danger" type="button" onClick={() => setConfirmWipe(true)}>
            Delete all data…
          </button>
        ) : (
          <button
            className="btn btn-danger"
            type="button"
            onClick={async () => {
              await wipeAllData()
              setConfirmWipe(false)
              setMsg('All data deleted.')
            }}
          >
            Tap again to confirm delete
          </button>
        )}
      </div>
      {err && <p className="msg-err">{err}</p>}

      <p className="disclaimer">
        Ramlet Life Tracker is a personal wellness journal, not a medical
        device. Reference and “optimal” ranges are general adult defaults —
        your lab’s ranges and your clinician’s judgment take precedence.
      </p>
    </Modal>
  )
}
