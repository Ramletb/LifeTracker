import { describe, expect, it } from 'vitest'
import { markerStatus, scoreMarker, systemScores } from './score'
import { markerById, MARKERS, matchMarker } from '../data/markers'

const ldl = markerById.get('ldl')! // std < 130, opt < 80
const glucose = markerById.get('glucose')! // std 70–99, opt 72–90
const hdl = markerById.get('hdl')! // std > 40, opt 50–100

describe('markerStatus', () => {
  it('classifies two-sided ranges', () => {
    expect(markerStatus(glucose, 85)).toBe('optimal')
    expect(markerStatus(glucose, 95)).toBe('ok')
    expect(markerStatus(glucose, 110)).toBe('out')
    expect(markerStatus(glucose, 60)).toBe('out')
  })
  it('classifies upper-bound-only ranges', () => {
    expect(markerStatus(ldl, 70)).toBe('optimal')
    expect(markerStatus(ldl, 110)).toBe('ok')
    expect(markerStatus(ldl, 160)).toBe('out')
  })
  it('classifies lower-bound-only ranges', () => {
    expect(markerStatus(hdl, 60)).toBe('optimal')
    expect(markerStatus(hdl, 45)).toBe('ok')
    expect(markerStatus(hdl, 30)).toBe('out')
  })
})

describe('scoreMarker', () => {
  it('gives 100 inside the optimal range', () => {
    expect(scoreMarker(glucose, 85)).toBe(100)
    expect(scoreMarker(ldl, 60)).toBe(100)
  })
  it('gives 60–99 inside the standard range only', () => {
    const s = scoreMarker(glucose, 95)
    expect(s).toBeGreaterThanOrEqual(60)
    expect(s).toBeLessThan(100)
  })
  it('gives below 60 outside the standard range, falling with distance', () => {
    const near = scoreMarker(ldl, 140)
    const far = scoreMarker(ldl, 190)
    expect(near).toBeLessThan(60)
    expect(far).toBeLessThan(near)
    expect(far).toBeGreaterThanOrEqual(0)
  })
})

describe('systemScores', () => {
  it('averages per system and tracks the worst marker', () => {
    const latest = new Map<string, number>([
      ['ldl', 60], // 100
      ['glucose', 85] // 100 (different system)
    ])
    const scores = systemScores(MARKERS, latest)
    expect(scores.get('cardio')?.score).toBe(100)
    expect(scores.get('metabolic')?.score).toBe(100)
    expect(scores.get('liver')).toBeUndefined()
  })
})

describe('female range overrides', () => {
  const hgb = markerById.get('hemoglobin')!
  it('uses female ranges when sex is female', () => {
    expect(markerStatus(hgb, 13.0, 'female')).toBe('optimal')
    expect(markerStatus(hgb, 13.0)).toBe('out')
    expect(markerStatus(hgb, 13.0, 'male')).toBe('out')
  })
  it('falls back to default ranges for markers without overrides', () => {
    expect(markerStatus(glucose, 85, 'female')).toBe('optimal')
  })
})

describe('matchMarker aliases', () => {
  it('matches common lab-report spellings', () => {
    expect(matchMarker('Apolipoprotein B')).toBe('apob')
    expect(matchMarker('LDL-C')).toBe('ldl')
    expect(matchMarker('Hemoglobin A1c')).toBe('hba1c')
    expect(matchMarker('hs-CRP')).toBe('hscrp')
    expect(matchMarker('Vitamin D, 25-Hydroxy')).toBe('vitd')
    expect(matchMarker('made up thing')).toBeUndefined()
  })
})
