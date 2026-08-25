import { describe, expect, it } from 'vitest'
import { parseCSV, parseDailyCSV, parseFoodCSV, parseLabsCSV, parseWorkoutsCSV } from './csv'
import { parseDate } from './dates'

describe('parseCSV', () => {
  it('handles quoted fields, escaped quotes and CRLF', () => {
    const rows = parseCSV('a,"b,1","say ""hi"""\r\nc,d,e\n')
    expect(rows).toEqual([
      ['a', 'b,1', 'say "hi"'],
      ['c', 'd', 'e']
    ])
  })
})

describe('parseLabsCSV', () => {
  it('imports rows and matches marker aliases', () => {
    const res = parseLabsCSV(
      'Date,Test,Result\n2026-08-01,ApoB,84\n8/1/2026,"Cholesterol, Total",186\n2026-08-01,Mystery,5'
    )
    expect(res.results).toHaveLength(2)
    expect(res.results[0]).toMatchObject({ date: '2026-08-01', markerId: 'apob', value: 84 })
    expect(res.results[1].markerId).toBe('total_chol')
    expect(res.unmatched).toEqual(['Mystery'])
  })
  it('reports missing columns', () => {
    const res = parseLabsCSV('foo,bar\n1,2')
    expect(res.errors.length).toBeGreaterThan(0)
    expect(res.results).toHaveLength(0)
  })
})

describe('parseFoodCSV (MyNetDiary-style)', () => {
  it('maps generous header names', () => {
    const res = parseFoodCSV(
      'Date,Meal,Food Name,Calories,Protein (g),Carbs (g),Total Fat (g),Dietary Fiber (g)\n' +
        '2026-08-20,Breakfast,"Oatmeal, cooked",320,12,54,6,8'
    )
    expect(res.entries).toHaveLength(1)
    expect(res.entries[0]).toMatchObject({
      date: '2026-08-20',
      meal: 'breakfast',
      name: 'Oatmeal, cooked',
      calories: 320,
      protein: 12,
      carbs: 54,
      fat: 6,
      fiber: 8
    })
  })
})

describe('parseDailyCSV', () => {
  it('imports partial columns', () => {
    const res = parseDailyCSV('date,steps,sleep_hours\n2026-08-20,9200,7.4')
    expect(res.entries[0]).toMatchObject({ date: '2026-08-20', steps: 9200, sleepHours: 7.4 })
  })
  it('leaves blank cells out entirely so they cannot delete stored values', () => {
    const res = parseDailyCSV(
      'date,steps,systolic,diastolic\n2026-08-20,9000,,\n2026-08-21,,,'
    )
    expect(res.entries).toHaveLength(1)
    expect(res.entries[0]).toEqual({ date: '2026-08-20', steps: 9000 })
    expect('systolic' in res.entries[0]).toBe(false)
  })
})

describe('parseDate', () => {
  it('accepts common formats', () => {
    expect(parseDate('2026-08-24')).toBe('2026-08-24')
    expect(parseDate('8/24/2026')).toBe('2026-08-24')
    expect(parseDate('Aug 24, 2026')).toBe('2026-08-24')
  })
  it('swaps unambiguous day-first dates instead of misparsing', () => {
    expect(parseDate('24/08/2026')).toBe('2026-08-24')
  })
  it('rejects impossible month/day values', () => {
    expect(parseDate('2026-13-45')).toBeUndefined()
    expect(parseDate('0/40/2026')).toBeUndefined()
  })
})

describe('num rejection of time-formatted values', () => {
  it('skips workout rows whose duration is h:mm:ss instead of minutes', () => {
    const res = parseWorkoutsCSV('date,type,minutes\n2026-08-20,Run,0:31:47')
    expect(res.entries).toHaveLength(0)
  })
})

describe('parseWorkoutsCSV', () => {
  it('imports workouts with optional fields', () => {
    const res = parseWorkoutsCSV(
      'date,type,minutes,calories,distance_km,avg_hr\n2026-08-20,Run,32,410,5.2,148'
    )
    expect(res.entries[0]).toMatchObject({
      date: '2026-08-20',
      type: 'Run',
      minutes: 32,
      calories: 410,
      distanceKm: 5.2,
      avgHr: 148
    })
  })
})
