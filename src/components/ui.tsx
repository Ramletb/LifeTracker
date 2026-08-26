import type { ReactNode } from 'react'
import { useRef } from 'react'
import type { MarkerStatus } from '../types'
import { Sparkline } from './charts'
import { scoreBand } from '../lib/score'

export function Card({
  title,
  eyebrow,
  action,
  children,
  className = ''
}: {
  title?: string
  eyebrow?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`card ${className}`}>
      {(title || eyebrow || action) && (
        <header className="card-head">
          <div>
            {eyebrow && <div className="eyebrow">{eyebrow}</div>}
            {title && <h2 className="card-title">{title}</h2>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}

export function StatTile({
  label,
  value,
  unit,
  sub,
  spark,
  deltaText,
  deltaGood
}: {
  label: string
  value: string
  unit?: string
  sub?: string
  spark?: number[]
  deltaText?: string
  deltaGood?: boolean
}) {
  return (
    <div className="stat-tile">
      <div className="stat-label">{label}</div>
      <div className="stat-value-row">
        <span className="stat-value">{value}</span>
        {unit && <span className="stat-unit">{unit}</span>}
      </div>
      {(sub || deltaText) && (
        <div className="stat-sub">
          {deltaText && (
            <span
              className={`stat-delta${
                deltaGood === undefined ? '' : deltaGood ? ' is-good' : ' is-bad'
              }`}
            >
              {deltaText}
            </span>
          )}
          {sub && <span>{sub}</span>}
        </div>
      )}
      {spark && spark.length > 1 && <Sparkline points={spark} />}
    </div>
  )
}

/**
 * The signature mark: a compact arc gauge scoring one body system 0–100
 * from its latest lab markers.
 */
export function SystemRing({
  name,
  score,
  n,
  onClick
}: {
  name: string
  score?: number
  n: number
  onClick?: () => void
}) {
  const R = 24
  const C = 2 * Math.PI * R
  const frac = score !== undefined ? score / 100 : 0
  const band = score !== undefined ? scoreBand(score) : undefined
  return (
    <button className="system-ring" onClick={onClick} type="button">
      <svg viewBox="0 0 60 60" width="60" height="60" aria-hidden="true">
        <circle cx="30" cy="30" r={R} className="ring-track" />
        {score !== undefined && (
          <circle
            cx="30"
            cy="30"
            r={R}
            className={`ring-arc band-${band}`}
            strokeDasharray={`${(frac * C).toFixed(1)} ${C.toFixed(1)}`}
            transform="rotate(-90 30 30)"
          />
        )}
        <text x="30" y="34" textAnchor="middle" className="ring-score">
          {score !== undefined ? score : '–'}
        </text>
      </svg>
      <span className="ring-name">{name}</span>
      <span className="ring-n">{n > 0 ? `${n} marker${n > 1 ? 's' : ''}` : 'no data'}</span>
    </button>
  )
}

export function StatusPill({ status }: { status: MarkerStatus }) {
  const text =
    status === 'optimal' ? 'Optimal' : status === 'ok' ? 'In range' : 'Out of range'
  const icon = status === 'optimal' ? '●' : status === 'ok' ? '◐' : '▲'
  return (
    <span className={`pill pill-${status}`}>
      <span aria-hidden="true">{icon}</span> {text}
    </span>
  )
}

export function Seg<T extends string>({
  options,
  value,
  onChange
}: {
  options: { id: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="seg" role="tablist">
      {options.map((o) => (
        <button
          key={o.id}
          role="tab"
          aria-selected={value === o.id}
          className={`seg-btn${value === o.id ? ' is-active' : ''}`}
          onClick={() => onChange(o.id)}
          type="button"
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Button that opens a file picker and returns the file's text. */
export function FileButton({
  label,
  accept,
  onText,
  className = 'btn'
}: {
  label: string
  accept: string
  onText: (text: string, name: string) => void
  className?: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <>
      <button type="button" className={className} onClick={() => ref.current?.click()}>
        {label}
      </button>
      <input
        ref={ref}
        type="file"
        accept={accept}
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (file) onText(await file.text(), file.name)
          e.target.value = ''
        }}
      />
    </>
  )
}

const ICONS: Record<string, ReactNode> = {
  today: (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d="M3 13h4l2.5-6 4 10 2.5-4H21"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  labs: (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d="M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3M8 3h8M7.5 15h9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  log: (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d="M12 5v14M5 12h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="9.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  goals: (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d="M6 21V4m0 0h11l-2.5 4L17 12H6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  coach: (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d="M12 21c-4.5-3.6-8-6.4-8-10a4.6 4.6 0 0 1 8-3.1A4.6 4.6 0 0 1 20 11c0 3.6-3.5 6.4-8 10Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export type TabId = 'today' | 'labs' | 'log' | 'goals' | 'coach'

export function TabBar({
  tab,
  onChange
}: {
  tab: TabId
  onChange: (t: TabId) => void
}) {
  // The active tab wears its chapter hue (assigned per id in CSS).
  const tabs: { id: TabId; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'labs', label: 'Labs' },
    { id: 'log', label: 'Log' },
    { id: 'goals', label: 'Goals' },
    { id: 'coach', label: 'Coach' }
  ]
  return (
    <nav className="tabbar">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`tab${tab === t.id ? ' is-active' : ''}`}
          aria-current={tab === t.id ? 'page' : undefined}
          data-tab={t.id}
          onClick={() => onChange(t.id)}
        >
          {ICONS[t.id]}
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  )
}
