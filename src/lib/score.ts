import type { MarkerDef, MarkerStatus, Range, SystemId } from '../types'

function within(r: Range, v: number): boolean {
  if (r.low !== undefined && v < r.low) return false
  if (r.high !== undefined && v > r.high) return false
  return true
}

/** Distance from v to the nearest edge of the range, 0 if inside. */
function distOutside(r: Range, v: number): number {
  if (r.low !== undefined && v < r.low) return r.low - v
  if (r.high !== undefined && v > r.high) return v - r.high
  return 0
}

/** A scale for "how far out is far": the range width, or the boundary value. */
function rangeScale(def: MarkerDef): number {
  const { std } = def
  if (std.low !== undefined && std.high !== undefined) return std.high - std.low
  const edge = std.high ?? std.low ?? 1
  return Math.max(Math.abs(edge) * 0.5, 1e-9)
}

export function markerStatus(def: MarkerDef, value: number): MarkerStatus {
  if (within(def.opt, value)) return 'optimal'
  if (within(def.std, value)) return 'ok'
  return 'out'
}

/**
 * Score a marker value 0–100.
 *  - inside the optimal range → 100
 *  - inside the standard range → 60–99, falling with distance from optimal
 *  - outside the standard range → below 60, falling toward 0
 */
export function scoreMarker(def: MarkerDef, value: number): number {
  if (within(def.opt, value)) return 100

  const scale = rangeScale(def)
  if (within(def.std, value)) {
    const dOpt = distOutside(def.opt, value)
    // Distance from the optimal edge to the standard edge on this side.
    const side =
      def.opt.low !== undefined && value < def.opt.low
        ? (def.opt.low ?? 0) - (def.std.low ?? def.opt.low - scale)
        : (def.std.high ?? (def.opt.high ?? 0) + scale) - (def.opt.high ?? 0)
    const span = Math.max(side, 1e-9)
    const f = Math.min(dOpt / span, 1)
    return Math.round(99 - f * 39) // 99 → 60
  }

  const dStd = distOutside(def.std, value)
  const f = Math.min(dStd / scale, 1)
  return Math.round(Math.max(0, 59 - f * 59))
}

export interface SystemScore {
  system: SystemId
  score: number
  n: number
  worst?: { markerId: string; score: number }
}

/**
 * Aggregate the latest value of each measured marker into a per-system score.
 * `latest` maps markerId → latest value.
 */
export function systemScores(
  defs: MarkerDef[],
  latest: Map<string, number>
): Map<SystemId, SystemScore> {
  const bySystem = new Map<SystemId, SystemScore>()
  for (const def of defs) {
    const v = latest.get(def.id)
    if (v === undefined) continue
    const s = scoreMarker(def, v)
    const cur = bySystem.get(def.category)
    if (!cur) {
      bySystem.set(def.category, {
        system: def.category,
        score: s,
        n: 1,
        worst: { markerId: def.id, score: s }
      })
    } else {
      cur.score += s
      cur.n += 1
      if (!cur.worst || s < cur.worst.score) cur.worst = { markerId: def.id, score: s }
    }
  }
  for (const entry of bySystem.values()) {
    entry.score = Math.round(entry.score / entry.n)
  }
  return bySystem
}

export type ScoreBand = 'good' | 'watch' | 'act'

export function scoreBand(score: number): ScoreBand {
  if (score >= 80) return 'good'
  if (score >= 55) return 'watch'
  return 'act'
}

/** Format a range like "40–60", "< 80" or "> 90" for display. */
export function fmtRange(r: Range, decimals = 0): string {
  const f = (v: number) => v.toFixed(decimals)
  if (r.low !== undefined && r.high !== undefined) return `${f(r.low)}–${f(r.high)}`
  if (r.high !== undefined) return `< ${f(r.high)}`
  if (r.low !== undefined) return `> ${f(r.low)}`
  return '—'
}
