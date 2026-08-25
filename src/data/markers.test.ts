import { describe, expect, it } from 'vitest'
import { MARKERS, matchMarker, normalizeMarkerName } from './markers'
import type { Range } from '../types'

describe('marker alias index integrity', () => {
  it('no normalized key is claimed by two different markers', () => {
    const claims = new Map<string, Set<string>>()
    for (const m of MARKERS) {
      for (const raw of [m.name, m.short, m.id, ...(m.aliases ?? [])]) {
        const key = normalizeMarkerName(raw)
        if (!key) continue
        const set = claims.get(key) ?? new Set<string>()
        set.add(m.id)
        claims.set(key, set)
      }
    }
    const collisions = [...claims.entries()]
      .filter(([, ids]) => ids.size > 1)
      .map(([key, ids]) => `${key} ← ${[...ids].join(', ')}`)
    expect(collisions).toEqual([])
  })

  it('generic and degenerate keys never match a marker', () => {
    for (const bad of ['test', 'tg', 'hr', 'na', 'co', '3', 'x', '']) {
      expect(matchMarker(bad), `"${bad}" should not match`).toBeUndefined()
    }
  })

  it('deliberate chemical symbols still match', () => {
    expect(matchMarker('K')).toBe('potassium')
    expect(matchMarker('Ca')).toBe('calcium')
    expect(matchMarker('Mg')).toBe('magnesium')
    expect(matchMarker('Cl')).toBe('chloride')
  })

  it('every optimal range sits inside its standard range, for each sex', () => {
    const contained = (std: Range, opt: Range, label: string) => {
      if (opt.low !== undefined && std.low !== undefined) {
        expect(opt.low, `${label} opt.low below std.low`).toBeGreaterThanOrEqual(std.low)
      }
      if (opt.high !== undefined && std.high !== undefined) {
        expect(opt.high, `${label} opt.high above std.high`).toBeLessThanOrEqual(std.high)
      }
      // A one-sided std must not gain a bound the opt lacks the other way:
      // opt bounds outside a bounded std side are the dangerous case, checked above.
    }
    for (const m of MARKERS) {
      contained(m.std, m.opt, `${m.id} (default)`)
      if (m.femStd) {
        // Whatever opt applies to female users must fit their std range.
        contained(m.femStd, m.femOpt ?? m.opt, `${m.id} (female)`)
      }
    }
  })
})
