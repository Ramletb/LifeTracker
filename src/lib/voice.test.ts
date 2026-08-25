import { describe, expect, it } from 'vitest'
import { parseUtterance } from './voice'

// Monday 2026-08-24, 12:30 — fixes "today" and the default meal.
const NOW = new Date(2026, 7, 24, 12, 30)

describe('parseUtterance — workouts', () => {
  it('parses the canonical run sentence', () => {
    const e = parseUtterance('I ran for 25 minutes, completed 2 miles', NOW)
    expect(e).toMatchObject({
      kind: 'workout',
      type: 'Run',
      date: '2026-08-24',
      minutes: 25
    })
    if (e.kind === 'workout') expect(e.distanceKm).toBeCloseTo(3.22, 1)
  })
  it('parses "a 5k" style distances and hour durations', () => {
    const e = parseUtterance('ran a 5k in half an hour', NOW)
    expect(e).toMatchObject({ kind: 'workout', type: 'Run', minutes: 30, distanceKm: 5 })
  })
  it('parses number words', () => {
    const e = parseUtterance('I jogged for twenty five minutes', NOW)
    expect(e).toMatchObject({ kind: 'workout', type: 'Run', minutes: 25 })
  })
  it('parses other activities', () => {
    expect(parseUtterance('lifted weights for 45 minutes', NOW)).toMatchObject({
      kind: 'workout',
      type: 'Strength',
      minutes: 45
    })
    expect(parseUtterance('I biked 12 km in 40 minutes', NOW)).toMatchObject({
      kind: 'workout',
      type: 'Ride',
      minutes: 40,
      distanceKm: 12
    })
  })
})

describe('parseUtterance — dates & backfill', () => {
  it('handles yesterday', () => {
    expect(parseUtterance('yesterday I ran 3 miles', NOW)).toMatchObject({
      kind: 'workout',
      date: '2026-08-23'
    })
  })
  it('handles "last tuesday" (a week resolves behind today)', () => {
    // NOW is Monday 2026-08-24; last Tuesday is 2026-08-18.
    expect(parseUtterance('last tuesday I ran 4 miles', NOW)).toMatchObject({
      kind: 'workout',
      date: '2026-08-18'
    })
  })
  it('handles "3 days ago" and month-day dates', () => {
    expect(parseUtterance('3 days ago I ran a 10k', NOW)).toMatchObject({
      kind: 'workout',
      date: '2026-08-21',
      distanceKm: 10
    })
    expect(parseUtterance('on august 18th I ran 5 km', NOW)).toMatchObject({
      kind: 'workout',
      date: '2026-08-18',
      distanceKm: 5
    })
  })
})

describe('parseUtterance — food', () => {
  it('parses the canonical meal sentence with macros', () => {
    const e = parseUtterance(
      'I had grilled chicken and rice for lunch, about 650 calories, 40 grams of protein, 8 grams of saturated fat',
      NOW
    )
    expect(e).toMatchObject({
      kind: 'food',
      meal: 'lunch',
      calories: 650,
      protein: 40,
      satFat: 8
    })
    if (e.kind === 'food') expect(e.name.toLowerCase()).toContain('grilled chicken')
  })
  it('separates fat from saturated fat', () => {
    const e = parseUtterance('dinner was salmon, 20 grams of fat, 4 grams of saturated fat, 500 calories', NOW)
    expect(e).toMatchObject({ kind: 'food', meal: 'dinner', fat: 20, satFat: 4, calories: 500 })
  })
  it('defaults the meal from the time of day', () => {
    const e = parseUtterance('I ate a protein bar, 210 calories, 20 protein', NOW)
    expect(e).toMatchObject({ kind: 'food', meal: 'lunch', calories: 210, protein: 20 })
  })
})

describe('parseUtterance — daily & body', () => {
  it('parses steps (even when phrased as walking)', () => {
    expect(parseUtterance('I walked 9,500 steps yesterday', NOW)).toMatchObject({
      kind: 'daily',
      date: '2026-08-23',
      steps: 9500
    })
  })
  it('parses sleep and blood pressure', () => {
    expect(parseUtterance('slept 7 and a half hours', NOW)).toMatchObject({
      kind: 'daily',
      sleepHours: 7.5
    })
    expect(parseUtterance('blood pressure was 122 over 78', NOW)).toMatchObject({
      kind: 'daily',
      systolic: 122,
      diastolic: 78
    })
  })
  it('parses weight in pounds and kilos', () => {
    expect(parseUtterance('I weigh 188 pounds', NOW)).toMatchObject({
      kind: 'body',
      weightKg: 85.3
    })
    expect(parseUtterance('weighed in at 85.2 kilos', NOW)).toMatchObject({
      kind: 'body',
      weightKg: 85.2
    })
  })
})

describe('parseUtterance — unknown', () => {
  it('falls through to unknown for unrelated text', () => {
    expect(parseUtterance('remind me to call the dentist', NOW).kind).toBe('unknown')
  })
})
