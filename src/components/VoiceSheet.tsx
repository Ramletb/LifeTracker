import { useEffect, useRef, useState } from 'react'
import { saveParsedEntry } from '../db'
import { createRecognizer, speechSupported, type Recognizer } from '../lib/speech'
import { describeEntry, parseUtterance, type ParsedEntry } from '../lib/voice'
import { Modal } from '../views/Labs'
import type { Meal } from '../types'

const EXAMPLES = [
  '“I ran for 25 minutes, completed 2 miles”',
  '“Grilled chicken and rice for lunch, about 650 calories, 40 grams of protein”',
  '“Last Tuesday I ran a 5k”',
  '“Slept 7 and a half hours”',
  '“I weigh 188 pounds”'
]

const MEALS: Meal[] = ['breakfast', 'lunch', 'dinner', 'snack']
const WORKOUT_TYPES = ['Run', 'Walk', 'Ride', 'Strength', 'Swim', 'Yoga', 'HIIT', 'Hike', 'Other']

export function VoiceSheet({ onClose }: { onClose: () => void }) {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [entry, setEntry] = useState<ParsedEntry | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savedLog, setSavedLog] = useState<string[]>([])
  const [typed, setTyped] = useState('')
  const recRef = useRef<Recognizer | null>(null)
  const supported = speechSupported()

  useEffect(() => () => recRef.current?.stop(), [])

  const handleText = (text: string) => {
    if (!text.trim()) return
    setTranscript(text)
    setError(null)
    const parsed = parseUtterance(text)
    setEntry(parsed)
    if (parsed.kind === 'unknown') setTyped(text) // hand it back for editing
  }

  const startListening = () => {
    setError(null)
    setEntry(null)
    setTranscript('')
    const rec = createRecognizer()
    if (!rec) {
      setError('Speech recognition is not available in this browser — type your entry below.')
      return
    }
    recRef.current = rec
    rec.onResult((text, isFinal) => {
      setTranscript(text)
      if (isFinal) handleText(text)
    })
    rec.onEnd(() => setListening(false))
    rec.onError((msg) => {
      setError(msg)
      setListening(false)
    })
    rec.start()
    setListening(true)
  }

  const stopListening = () => {
    recRef.current?.stop()
    setListening(false)
  }

  const save = async () => {
    if (!entry || entry.kind === 'unknown') return
    try {
      const msg = await saveParsedEntry(entry)
      setSavedLog((l) => [`${msg} — ${describeEntry(entry)}`, ...l].slice(0, 6))
      setEntry(null)
      setTranscript('')
      setTyped('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save that entry.')
    }
  }

  return (
    <Modal title="Voice log" onClose={onClose}>
      <div className="voice-stage">
        <button
          type="button"
          className={`voice-mic${listening ? ' is-listening' : ''}`}
          onClick={listening ? stopListening : startListening}
          aria-label={listening ? 'Stop listening' : 'Start listening'}
        >
          <MicIcon />
        </button>
        <p className="voice-status">
          {listening
            ? 'Listening… speak your entry'
            : supported
              ? 'Tap the mic and say what happened'
              : 'Speech not supported here — type your entry below'}
        </p>
        {transcript && <p className="voice-transcript">“{transcript}”</p>}
      </div>

      {error && <p className="msg-err">{error}</p>}

      {entry && entry.kind !== 'unknown' && (
        <div className="voice-preview">
          <div className="eyebrow">Heard — check &amp; save</div>
          <EntryEditor entry={entry} onChange={setEntry} />
          <div className="form-row">
            <button className="btn btn-primary" type="button" onClick={save}>
              Save {entry.kind === 'daily' ? 'metrics' : entry.kind}
            </button>
            <button className="btn" type="button" onClick={() => { setEntry(null); setTranscript('') }}>
              Discard
            </button>
          </div>
        </div>
      )}
      {entry && entry.kind === 'unknown' && (
        <p className="msg-err">
          Couldn’t find a loggable entry in that. Try one of the examples, or
          edit the text below and parse again.
        </p>
      )}

      <label className="field" style={{ marginTop: 12 }}>
        Or type it
        <div className="voice-typerow">
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="I ran for 25 minutes, completed 2 miles"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleText(typed)
            }}
          />
          <button className="btn" type="button" onClick={() => handleText(typed)}>
            Parse
          </button>
        </div>
      </label>

      {savedLog.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div className="eyebrow">Saved this session</div>
          {savedLog.map((s, i) => (
            <p key={i} className="msg-ok" style={{ margin: '4px 0' }}>
              ✓ {s}
            </p>
          ))}
        </div>
      )}

      {!entry && savedLog.length === 0 && (
        <div style={{ marginTop: 12 }}>
          <div className="eyebrow">Things you can say</div>
          <ul className="voice-examples">
            {EXAMPLES.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
          <p className="note">
            Backdating works too — start with “yesterday”, “last Tuesday” or
            “on August 18th”.
          </p>
        </div>
      )}
    </Modal>
  )
}

function EntryEditor({
  entry,
  onChange
}: {
  entry: ParsedEntry
  onChange: (e: ParsedEntry) => void
}) {
  const set = (key: string, value: unknown) =>
    onChange({ ...entry, [key]: value } as ParsedEntry)

  const numField = (key: string, label: string, value: number | undefined, step = 'any') => (
    <label className="field" key={key}>
      {label}
      <input
        type="number"
        step={step}
        inputMode="decimal"
        value={value ?? ''}
        onChange={(e) => set(key, e.target.value === '' ? undefined : Number(e.target.value))}
      />
    </label>
  )
  const dateField = (
    <label className="field" key="date">
      Date
      <input type="date" value={entry.kind === 'unknown' ? '' : entry.date} onChange={(e) => set('date', e.target.value)} />
    </label>
  )

  switch (entry.kind) {
    case 'workout':
      return (
        <div className="form-grid">
          {dateField}
          <label className="field">
            Type
            <select value={entry.type} onChange={(e) => set('type', e.target.value)}>
              {WORKOUT_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          {numField('minutes', 'Minutes', entry.minutes, '1')}
          <label className="field" key="distanceMi">
            Distance (mi)
            <input
              type="number"
              step="any"
              inputMode="decimal"
              value={
                entry.distanceKm !== undefined
                  ? Math.round((entry.distanceKm / 1.60934) * 100) / 100
                  : ''
              }
              onChange={(e) =>
                set(
                  'distanceKm',
                  e.target.value === ''
                    ? undefined
                    : Math.round(Number(e.target.value) * 1.60934 * 100) / 100
                )
              }
            />
          </label>
          {numField('calories', 'Calories', entry.calories, '1')}
          {numField('avgHr', 'Avg HR', entry.avgHr, '1')}
        </div>
      )
    case 'food':
      return (
        <div className="form-grid">
          <label className="field span-2">
            Food
            <input value={entry.name} onChange={(e) => set('name', e.target.value)} />
          </label>
          {dateField}
          <label className="field">
            Meal
            <select value={entry.meal} onChange={(e) => set('meal', e.target.value as Meal)}>
              {MEALS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
          {numField('calories', 'Calories', entry.calories, '1')}
          {numField('protein', 'Protein (g)', entry.protein)}
          {numField('carbs', 'Carbs (g)', entry.carbs)}
          {numField('fat', 'Fat (g)', entry.fat)}
          {numField('satFat', 'Sat fat (g)', entry.satFat)}
          {numField('fiber', 'Fiber (g)', entry.fiber)}
        </div>
      )
    case 'daily':
      return (
        <div className="form-grid">
          {dateField}
          {numField('steps', 'Steps', entry.steps, '1')}
          {numField('sleepHours', 'Sleep (h)', entry.sleepHours, '0.1')}
          {numField('restingHr', 'Resting HR', entry.restingHr, '1')}
          {numField('systolic', 'BP systolic', entry.systolic, '1')}
          {numField('diastolic', 'BP diastolic', entry.diastolic, '1')}
        </div>
      )
    case 'body':
      return (
        <div className="form-grid">
          {dateField}
          {numField('weightKg', 'Weight (kg)', entry.weightKg, '0.1')}
          {numField('bodyFatPct', 'Body fat (%)', entry.bodyFatPct, '0.1')}
        </div>
      )
    case 'unknown':
      return null
  }
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" />
      <path
        d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}
