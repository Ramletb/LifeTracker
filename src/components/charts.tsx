import { useMemo, useRef, useState } from 'react'
import type { Range } from '../types'
import { fmtMed, fmtShort } from '../lib/dates'

export interface Point {
  date: string
  value: number
}

function niceTicks(min: number, max: number, count = 4): number[] {
  if (min === max) {
    const pad = Math.abs(min) * 0.1 || 1
    min -= pad
    max += pad
  }
  const span = max - min
  const step0 = span / count
  const mag = Math.pow(10, Math.floor(Math.log10(step0)))
  const candidates = [1, 2, 2.5, 5, 10].map((m) => m * mag)
  const step = candidates.find((c) => span / c <= count) ?? candidates[4]
  const lo = Math.ceil(min / step) * step
  const ticks: number[] = []
  for (let v = lo; v <= max + 1e-9; v += step) ticks.push(Number(v.toFixed(10)))
  return ticks
}

const dayNum = (iso: string) => new Date(`${iso}T00:00:00`).getTime() / 86400000

/**
 * Single-series trend over time with an optional optimal-range band.
 * One y-axis, hairline grid, 2px line, 8px markers with a surface ring,
 * endpoint direct-labeled; crosshair + tooltip on hover/touch.
 */
export function TrendChart({
  points,
  unit,
  decimals = 0,
  opt,
  height = 190
}: {
  points: Point[]
  unit: string
  decimals?: number
  opt?: Range
  height?: number
}) {
  const [hover, setHover] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const W = 360
  const H = height
  const P = { l: 42, r: 16, t: 14, b: 26 }
  const plotW = W - P.l - P.r
  const plotH = H - P.t - P.b

  const model = useMemo(() => {
    const values = points.map((p) => p.value)
    let lo = Math.min(...values)
    let hi = Math.max(...values)
    if (opt?.low !== undefined) lo = Math.min(lo, opt.low)
    if (opt?.high !== undefined) hi = Math.max(hi, opt.high)
    const pad = (hi - lo) * 0.12 || Math.abs(hi) * 0.1 || 1
    lo -= pad
    hi += pad
    const ticks = niceTicks(lo, hi)
    const y = (v: number) => P.t + plotH - ((v - lo) / (hi - lo)) * plotH

    const t0 = dayNum(points[0].date)
    const t1 = dayNum(points[points.length - 1].date)
    const span = Math.max(t1 - t0, 1)
    const x = (iso: string) =>
      points.length === 1
        ? P.l + plotW / 2
        : P.l + ((dayNum(iso) - t0) / span) * plotW
    return { lo, hi, ticks, x, y }
  }, [points, opt, plotH, plotW, P.l, P.t])

  const { x, y, ticks } = model
  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.date).toFixed(1)},${y(p.value).toFixed(1)}`)
    .join(' ')

  const last = points[points.length - 1]

  const onMove = (e: React.PointerEvent) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const fx = ((e.clientX - rect.left) / rect.width) * W
    let best = 0
    let bestD = Infinity
    points.forEach((p, i) => {
      const d = Math.abs(x(p.date) - fx)
      if (d < bestD) {
        bestD = d
        best = i
      }
    })
    setHover(best)
  }

  // Optimal band: two-sided → between edges; one-sided → toward the open side.
  let bandY: [number, number] | null = null
  if (opt && (opt.low !== undefined || opt.high !== undefined)) {
    const top = opt.high !== undefined ? y(opt.high) : P.t
    const bottom = opt.low !== undefined ? y(opt.low) : P.t + plotH
    bandY = [top, bottom]
  }

  const hoverP = hover !== null ? points[hover] : null

  return (
    <div className="chart-wrap">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="chart"
        role="img"
        aria-label={`Trend chart, latest value ${last.value.toFixed(decimals)} ${unit}`}
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setHover(null)}
      >
        {bandY && (
          <rect
            x={P.l}
            y={Math.min(...bandY)}
            width={plotW}
            height={Math.abs(bandY[1] - bandY[0])}
            className="chart-band"
          />
        )}
        {ticks.map((t) => (
          <g key={t}>
            <line x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} className="chart-grid" />
            <text x={P.l - 6} y={y(t) + 3} className="chart-tick" textAnchor="end">
              {t.toLocaleString()}
            </text>
          </g>
        ))}
        <line
          x1={P.l}
          x2={W - P.r}
          y1={P.t + plotH}
          y2={P.t + plotH}
          className="chart-axis"
        />
        {hoverP && (
          <line
            x1={x(hoverP.date)}
            x2={x(hoverP.date)}
            y1={P.t}
            y2={P.t + plotH}
            className="chart-crosshair"
          />
        )}
        <path d={path} className="chart-line" />
        {points.map((p, i) => (
          <circle
            key={p.date + i}
            cx={x(p.date)}
            cy={y(p.value)}
            r={4.5}
            className={`chart-dot${hover === i ? ' is-hover' : ''}`}
          />
        ))}
        <text
          x={Math.min(x(last.date), W - P.r)}
          y={y(last.value) - 10}
          className="chart-endlabel"
          textAnchor="end"
        >
          {last.value.toFixed(decimals)} {unit}
        </text>
        <text x={P.l} y={H - 8} className="chart-tick" textAnchor="start">
          {fmtShort(points[0].date)}
        </text>
        <text x={W - P.r} y={H - 8} className="chart-tick" textAnchor="end">
          {fmtShort(last.date)}
        </text>
      </svg>
      {hoverP && (
        <div
          className="chart-tooltip"
          style={{ left: `${(x(hoverP.date) / W) * 100}%` }}
        >
          <span className="tt-date">{fmtMed(hoverP.date)}</span>
          <span className="tt-value">
            {hoverP.value.toFixed(decimals)} {unit}
          </span>
        </div>
      )}
    </div>
  )
}

/**
 * Daily columns (steps, calories): single series, ≤24px bars with 4px
 * rounded caps growing from the baseline, optional goal hairline.
 */
export function Columns({
  data,
  unit,
  target,
  height = 150,
  compactLabels = false
}: {
  data: Point[]
  unit: string
  target?: number
  height?: number
  compactLabels?: boolean
}) {
  const [hover, setHover] = useState<number | null>(null)
  const W = 360
  const H = height
  const P = { l: 8, r: 40, t: 16, b: 22 }
  const plotW = W - P.l - P.r
  const plotH = H - P.t - P.b
  const max = Math.max(...data.map((d) => d.value), target ?? 0, 1)
  const y = (v: number) => P.t + plotH - (v / (max * 1.08)) * plotH
  const band = plotW / data.length
  const bw = Math.min(band - 6, 24)

  const fmtVal = (v: number) =>
    v >= 10000 ? `${(v / 1000).toFixed(1)}K` : Math.round(v).toLocaleString()

  return (
    <div className="chart-wrap">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="chart"
        role="img"
        aria-label={`Bar chart in ${unit}`}
        onPointerLeave={() => setHover(null)}
      >
        {target !== undefined && (
          <g>
            <line
              x1={P.l}
              x2={W - P.r}
              y1={y(target)}
              y2={y(target)}
              className="chart-target"
            />
            <text
              x={W - P.r + 4}
              y={y(target) + 3}
              className="chart-tick"
              textAnchor="start"
            >
              goal
            </text>
          </g>
        )}
        <line
          x1={P.l}
          x2={W - P.r}
          y1={P.t + plotH}
          y2={P.t + plotH}
          className="chart-axis"
        />
        {data.map((d, i) => {
          const cx = P.l + band * i + band / 2
          const bx = cx - bw / 2
          const by = y(d.value)
          const h = Math.max(P.t + plotH - by, 0)
          const r = Math.min(4, h)
          const barPath = `M${bx},${by + h} L${bx},${by + r} Q${bx},${by} ${bx + r},${by} L${bx + bw - r},${by} Q${bx + bw},${by} ${bx + bw},${by + r} L${bx + bw},${by + h} Z`
          return (
            <g key={d.date}>
              <rect
                x={P.l + band * i}
                y={P.t}
                width={band}
                height={plotH}
                fill="transparent"
                onPointerEnter={() => setHover(i)}
                onPointerDown={() => setHover(i)}
              />
              {h > 0 && (
                <path d={barPath} className={`chart-bar${hover === i ? ' is-hover' : ''}`} pointerEvents="none" />
              )}
              {(!compactLabels || i % 2 === 0 || data.length <= 7) && (
                <text x={cx} y={H - 6} className="chart-tick" textAnchor="middle">
                  {fmtShort(d.date).split(' ')[1]}
                </text>
              )}
            </g>
          )
        })}
        {data.length > 0 && (
          <text
            x={P.l + band * (data.length - 1) + band / 2}
            y={y(data[data.length - 1].value) - 6}
            className="chart-endlabel"
            textAnchor="middle"
          >
            {fmtVal(data[data.length - 1].value)}
          </text>
        )}
      </svg>
      {hover !== null && data[hover] && (
        <div
          className="chart-tooltip"
          style={{ left: `${((P.l + band * hover + band / 2) / W) * 100}%` }}
        >
          <span className="tt-date">{fmtMed(data[hover].date)}</span>
          <span className="tt-value">
            {Math.round(data[hover].value).toLocaleString()} {unit}
          </span>
        </div>
      )}
    </div>
  )
}

/** Tiny inline trend, no axes — for stat tiles. */
export function Sparkline({ points, width = 72, height = 24 }: { points: number[]; width?: number; height?: number }) {
  if (points.length < 2) return null
  const min = Math.min(...points)
  const max = Math.max(...points)
  const span = max - min || 1
  const x = (i: number) => 2 + (i / (points.length - 1)) * (width - 4)
  const y = (v: number) => height - 3 - ((v - min) / span) * (height - 6)
  const d = points.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const lastX = x(points.length - 1)
  const lastY = y(points[points.length - 1])
  return (
    <svg width={width} height={height} className="sparkline" aria-hidden="true">
      <path d={d} className="spark-line" />
      <circle cx={lastX} cy={lastY} r={3} className="spark-dot" />
    </svg>
  )
}

export interface MacroSeg {
  label: string
  kcal: number
  grams: number
  colorVar: string
}

/**
 * One horizontal stacked bar of macro calories with 2px surface gaps and a
 * legend (swatch + label + grams) — identity never rides on color alone.
 */
export function MacroBar({ segments }: { segments: MacroSeg[] }) {
  const total = segments.reduce((a, s) => a + s.kcal, 0)
  return (
    <div className="macrobar">
      {total > 0 && (
        <div className="macrobar-track" role="img" aria-label="Macro calorie split">
          {segments.map(
            (s) =>
              s.kcal > 0 && (
                <div
                  key={s.label}
                  className="macrobar-seg"
                  style={{
                    width: `${(s.kcal / total) * 100}%`,
                    background: `var(${s.colorVar})`
                  }}
                />
              )
          )}
        </div>
      )}
      <div className="macrobar-legend">
        {segments.map((s) => (
          <span key={s.label} className="legend-item">
            <span className="legend-swatch" style={{ background: `var(${s.colorVar})` }} />
            {s.label} {Math.round(s.grams)}g
            <span className="legend-sub">
              {total > 0 ? ` · ${Math.round((s.kcal / total) * 100)}%` : ''}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}
