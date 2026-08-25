import type { Meal } from '../types'
import { addDays, fromISO, toISO } from './dates'

/**
 * Turns a dictated sentence into a structured log entry. Designed for the
 * constrained things people actually say to a health tracker:
 *
 *   "I ran for 25 minutes, completed 2 miles"
 *   "Last Tuesday I ran a 5k in 32 minutes"
 *   "I had grilled chicken and rice for lunch, about 650 calories,
 *    40 grams of protein, 8 grams of saturated fat"
 *   "I walked 9,500 steps yesterday"
 *   "Slept 7 and a half hours"
 *   "I weigh 85.2 kilos"
 *
 * The result is always shown in an editable confirmation card before saving,
 * so the parser aims for "usually right", not "always right".
 */

export type ParsedEntry =
  | {
      kind: 'workout'
      date: string
      type: string
      minutes?: number
      distanceKm?: number
      calories?: number
      avgHr?: number
    }
  | {
      kind: 'food'
      date: string
      meal: Meal
      name: string
      calories?: number
      protein?: number
      carbs?: number
      fat?: number
      satFat?: number
      fiber?: number
      sodium?: number
    }
  | {
      kind: 'daily'
      date: string
      steps?: number
      sleepHours?: number
      restingHr?: number
      systolic?: number
      diastolic?: number
    }
  | { kind: 'body'; date: string; weightKg?: number; bodyFatPct?: number }
  | { kind: 'unknown'; date: string; text: string }

const MI_TO_KM = 1.60934
const LB_TO_KG = 0.453592

// ── Number words → digits ─────────────────────────────────────────
const UNITS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
  fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
  nineteen: 19
}
const TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70,
  eighty: 80, ninety: 90
}

function wordsToDigits(text: string): string {
  // "twenty five" → 25, "thirty" → 30, "seven" → 7
  let out = text.replace(
    /\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)([ -](one|two|three|four|five|six|seven|eight|nine))?\b/g,
    (_, tens: string, _pair?: string, unit?: string) =>
      String(TENS[tens] + (unit ? UNITS[unit] : 0))
  )
  out = out.replace(
    /\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen)\b/g,
    (m) => String(UNITS[m])
  )
  // "2 and a half" → 2.5 ; "half an hour" → 0.5 hours ; "an hour" → 1 hour
  out = out.replace(/\b(\d+)\s+and\s+a\s+half\b/g, (_, n) => `${n}.5`)
  out = out.replace(/\bhalf\s+an?\s+hour\b/g, '0.5 hours')
  out = out.replace(/\ban?\s+(hour|mile|kilometer|kilometre)\b/g, '1 $1')
  return out
}

// ── Date phrases ──────────────────────────────────────────────────
const WEEKDAYS = [
  'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
]
const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june', 'july',
  'august', 'september', 'october', 'november', 'december'
]

/** Extract a spoken date reference; returns the date and the text without it. */
export function extractDate(
  text: string,
  today: string
): { date: string; rest: string } {
  let date = today
  let rest = text

  const take = (re: RegExp, resolve: (m: RegExpMatchArray) => string | undefined) => {
    const m = rest.match(re)
    if (!m) return false
    const d = resolve(m)
    if (d === undefined) return false
    date = d
    rest = rest.replace(re, ' ')
    return true
  }

  if (take(/\byesterday( morning| afternoon| evening)?\b/, () => addDays(today, -1))) {
    return { date, rest }
  }
  if (take(/\b(\d+)\s+days?\s+ago\b/, (m) => addDays(today, -Number(m[1])))) {
    return { date, rest }
  }
  if (
    take(
      new RegExp(`\\b(?:last|on last)\\s+(${WEEKDAYS.join('|')})\\b`),
      (m) => {
        const target = WEEKDAYS.indexOf(m[1])
        const t = fromISO(today).getDay()
        const back = (t - target + 7) % 7 || 7
        return addDays(today, -back)
      }
    )
  ) {
    return { date, rest }
  }
  if (
    take(new RegExp(`\\b(?:on\\s+)?(${WEEKDAYS.join('|')})\\b`), (m) => {
      const target = WEEKDAYS.indexOf(m[1])
      const t = fromISO(today).getDay()
      const back = (t - target + 7) % 7 // today if same weekday
      return addDays(today, -back)
    })
  ) {
    return { date, rest }
  }
  if (
    take(
      new RegExp(`\\b(?:on\\s+)?(${MONTHS.join('|')})\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`),
      (m) => {
        const month = MONTHS.indexOf(m[1])
        const day = Number(m[2])
        if (day < 1 || day > 31) return undefined
        const t = fromISO(today)
        let year = t.getFullYear()
        const candidate = new Date(year, month, day)
        if (candidate.getTime() > t.getTime()) year -= 1 // logs are about the past
        return toISO(new Date(year, month, day))
      }
    )
  ) {
    return { date, rest }
  }
  if (
    take(/\b(?:on\s+)?the\s+(\d{1,2})(?:st|nd|rd|th)\b/, (m) => {
      const day = Number(m[1])
      if (day < 1 || day > 31) return undefined
      const t = fromISO(today)
      const sameMonth = new Date(t.getFullYear(), t.getMonth(), day)
      if (sameMonth.getTime() <= t.getTime()) return toISO(sameMonth)
      return toISO(new Date(t.getFullYear(), t.getMonth() - 1, day))
    })
  ) {
    return { date, rest }
  }
  rest = rest.replace(/\b(today|this morning|this afternoon|tonight|this evening|just now|earlier)\b/g, ' ')
  return { date, rest }
}

// ── Quantity grabbing ─────────────────────────────────────────────
const NUM = '(\\d+(?:[.,]\\d+)?)'

function toNum(raw: string): number {
  return Number(raw.replace(/,(?=\d{3}\b)/g, '').replace(',', '.'))
}

/** Match value-before-keyword ("40 grams of protein") or after ("protein 40"). */
function grab(
  text: string,
  keywords: string[]
): { value: number; rest: string } | undefined {
  const kw = `(?:${keywords.join('|')})`
  const before = new RegExp(
    `${NUM}\\s*(?:grams?|g|milligrams?|mg)?\\s*(?:of\\s+)?${kw}\\b`,
    'i'
  )
  const after = new RegExp(
    `\\b${kw}[,:]?\\s*(?:was|is|of|about|around|approximately)?\\s*${NUM}\\s*(?:grams?|g|milligrams?|mg)?\\b`,
    'i'
  )
  for (const re of [before, after]) {
    const m = text.match(re)
    if (m) return { value: toNum(m[1]), rest: text.replace(re, ' ') }
  }
  return undefined
}

function grabUnit(
  text: string,
  units: string[]
): { value: number; rest: string } | undefined {
  const re = new RegExp(`${NUM}\\s*(?:${units.join('|')})\\b`, 'i')
  const m = text.match(re)
  if (m) return { value: toNum(m[1]), rest: text.replace(re, ' ') }
  return undefined
}

interface Quantities {
  minutes?: number
  distanceKm?: number
  calories?: number
  avgHr?: number
  rest: string
}

function extractWorkoutQuantities(text: string): Quantities {
  let rest = text
  let minutes: number | undefined

  const hours = grabUnit(rest, ['hours?', 'hrs?'])
  if (hours) {
    minutes = hours.value * 60
    rest = hours.rest
  }
  const mins = grabUnit(rest, ['minutes?', 'mins?'])
  if (mins) {
    minutes = (minutes ?? 0) + mins.value
    rest = mins.rest
  }

  let distanceKm: number | undefined
  const miles = grabUnit(rest, ['miles?', 'mi'])
  if (miles) {
    distanceKm = miles.value * MI_TO_KM
    rest = miles.rest
  } else {
    const km = grabUnit(rest, ['kilometers?', 'kilometres?', 'km'])
    if (km) {
      distanceKm = km.value
      rest = km.rest
    } else {
      // "did a 5k", "ran a 10k"
      const kShort = rest.match(new RegExp(`\\b${NUM}\\s?k\\b`, 'i'))
      if (kShort) {
        distanceKm = toNum(kShort[1])
        rest = rest.replace(kShort[0], ' ')
      }
    }
  }
  if (distanceKm !== undefined) distanceKm = Math.round(distanceKm * 100) / 100

  let calories: number | undefined
  const cals = grab(rest, ['calories', 'kcals?', 'cals?'])
  if (cals) {
    calories = Math.round(cals.value)
    rest = cals.rest
  }
  let avgHr: number | undefined
  const hr = grab(rest, ['bpm', 'heart\\s*rate'])
  if (hr) {
    avgHr = Math.round(hr.value)
    rest = hr.rest
  }
  return { minutes, distanceKm, calories, avgHr, rest }
}

// ── Intent detection ──────────────────────────────────────────────
const WORKOUT_TYPES: [RegExp, string][] = [
  [/\b(ran|run(ning)?|jog(ged|ging)?)\b/, 'Run'],
  [/\b(hiked?|hiking)\b/, 'Hike'],
  [/\b(walked|walking|walk)\b/, 'Walk'],
  [/\b(biked?|biking|cycl(ed|ing)|rode|ride|riding|spin class)\b/, 'Ride'],
  [/\b(swam|swim(ming)?)\b/, 'Swim'],
  [/\b(lifted|lifting|strength|weights?|weight training|gym session)\b/, 'Strength'],
  [/\byoga\b/, 'Yoga'],
  [/\bhiit\b/, 'HIIT']
]

const MEAL_WORDS: [RegExp, Meal][] = [
  [/\bbreakfast\b/, 'breakfast'],
  [/\blunch\b/, 'lunch'],
  [/\b(dinner|supper)\b/, 'dinner'],
  [/\bsnack\b/, 'snack']
]

function defaultMeal(hour: number): Meal {
  if (hour >= 5 && hour < 11) return 'breakfast'
  if (hour >= 11 && hour < 15) return 'lunch'
  if (hour >= 16 && hour < 22) return 'dinner'
  return 'snack'
}

function extractFoodName(text: string): string {
  let t = text
  // Everything after the eat-verb, up to the first number clause.
  const verb = t.match(/\b(?:i\s+)?(?:just\s+)?(?:ate|had|grabbed|eaten|finished)\b/)
  if (verb) t = t.slice((verb.index ?? 0) + verb[0].length)
  const firstNum = t.search(/\d/)
  if (firstNum > 0) t = t.slice(0, firstNum)
  t = t
    .replace(/\b(for|as)\s+(breakfast|lunch|dinner|supper|a\s+snack|snack)\b/g, ' ')
    .replace(/\b(about|approximately|approx|around|roughly|maybe|which was|it was|with|containing|came to|total(ing)?)\b.*$/, ' ')
    .replace(/[,.;:]+\s*$/g, '')
    .replace(/^\s*[,.;:]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  t = t.replace(/^(a|an|some|the)\s+/, '')
  return t.length >= 3 ? t[0].toUpperCase() + t.slice(1) : 'Voice-logged meal'
}

/**
 * Parse one dictated sentence. `now` fixes "today" and the default meal for
 * tests; defaults to the current moment.
 */
export function parseUtterance(raw: string, now: Date = new Date()): ParsedEntry {
  const today = toISO(now)
  const normalized = wordsToDigits(
    raw.toLowerCase().replace(/\s+/g, ' ').trim()
  )
  const { date, rest } = extractDate(normalized, today)

  // Workout?
  for (const [re, type] of WORKOUT_TYPES) {
    if (re.test(rest)) {
      // "walked 9,500 steps" is a daily metric, not a workout
      if (type === 'Walk' && /\bsteps\b/.test(rest)) break
      const q = extractWorkoutQuantities(rest)
      return {
        kind: 'workout',
        date,
        type,
        minutes: q.minutes !== undefined ? Math.round(q.minutes) : undefined,
        distanceKm: q.distanceKm,
        calories: q.calories,
        avgHr: q.avgHr
      }
    }
  }

  // Daily metrics?
  if (/\b(steps?|slept|sleep|blood pressure|resting heart rate|resting hr)\b/.test(rest)) {
    const out: Extract<ParsedEntry, { kind: 'daily' }> = { kind: 'daily', date }
    const steps = grab(rest, ['steps?'])
    if (steps) out.steps = Math.round(steps.value)
    const sleepM = rest.match(new RegExp(`(?:slept|sleep(?:ed)?)[^\\d]*${NUM}\\s*(?:hours?|hrs?)?`))
    if (sleepM) out.sleepHours = toNum(sleepM[1])
    else {
      const sleepAlt = rest.match(new RegExp(`${NUM}\\s*(?:hours?|hrs?)\\s+of\\s+sleep`))
      if (sleepAlt) out.sleepHours = toNum(sleepAlt[1])
    }
    const bp = rest.match(new RegExp(`(?:blood pressure|bp)[^\\d]*${NUM}\\s*over\\s*${NUM}`))
    if (bp) {
      out.systolic = Math.round(toNum(bp[1]))
      out.diastolic = Math.round(toNum(bp[2]))
    }
    const rhr = rest.match(new RegExp(`resting (?:heart rate|hr)[^\\d]*${NUM}`))
    if (rhr) out.restingHr = Math.round(toNum(rhr[1]))
    if (out.steps !== undefined || out.sleepHours !== undefined || out.systolic !== undefined || out.restingHr !== undefined) {
      return out
    }
  }

  // Body?
  if (/\b(weigh(?:ed)?|weight|body fat)\b/.test(rest) && !/\bweights\b/.test(rest)) {
    const out: Extract<ParsedEntry, { kind: 'body' }> = { kind: 'body', date }
    const lbs = grabUnit(rest, ['pounds?', 'lbs?'])
    if (lbs) out.weightKg = Math.round(lbs.value * LB_TO_KG * 10) / 10
    else {
      const kg = grabUnit(rest, ['kilos?', 'kilograms?', 'kgs?'])
      if (kg) out.weightKg = Math.round(kg.value * 10) / 10
      else {
        const w = rest.match(new RegExp(`weigh(?:ed)?(?:\\s+in\\s+at)?\\s+${NUM}`))
        if (w) out.weightKg = Math.round(toNum(w[1]) * 10) / 10
      }
    }
    const bf = rest.match(new RegExp(`${NUM}\\s*(?:%|percent)\\s*body fat|body fat[^\\d]*${NUM}`))
    if (bf) out.bodyFatPct = toNum(bf[1] ?? bf[2])
    if (out.weightKg !== undefined || out.bodyFatPct !== undefined) return out
  }

  // Food?
  const mealWord = MEAL_WORDS.find(([re]) => re.test(rest))
  const ateVerb = /\b(ate|had|eaten|grabbed|finished)\b/.test(rest)
  const calorieWord = /\b(calories|kcal|cals?)\b/.test(rest)
  if (mealWord || (ateVerb && (calorieWord || /\b(meal|food)\b/.test(rest))) || (ateVerb && rest.length > 12)) {
    let r = rest
    const val = (keywords: string[]) => {
      const g = grab(r, keywords)
      if (!g) return undefined
      r = g.rest
      return g.value
    }
    const satFat = val(['saturated fat', 'sat fat'])
    const protein = val(['protein'])
    const carbs = val(['carbs?', 'carbohydrates?'])
    const fat = val(['fat'])
    const fiber = val(['fiber', 'fibre'])
    const sodium = val(['sodium', 'salt'])
    const calories = val(['calories', 'kcals?', 'cals?'])
    return {
      kind: 'food',
      date,
      meal: mealWord ? mealWord[1] : defaultMeal(now.getHours()),
      name: extractFoodName(rest),
      calories: calories !== undefined ? Math.round(calories) : undefined,
      protein,
      carbs,
      fat,
      satFat,
      fiber,
      sodium
    }
  }

  return { kind: 'unknown', date, text: raw.trim() }
}

export const kmToMiles = (km: number) => km / MI_TO_KM

/** One-line human summary of a parsed entry, for confirmation UI. */
export function describeEntry(e: ParsedEntry): string {
  switch (e.kind) {
    case 'workout': {
      const bits = [e.type]
      if (e.minutes) bits.push(`${e.minutes} min`)
      if (e.distanceKm) bits.push(`${kmToMiles(e.distanceKm).toFixed(1)} mi (${e.distanceKm.toFixed(1)} km)`)
      if (e.calories) bits.push(`${e.calories} kcal`)
      return bits.join(' · ')
    }
    case 'food': {
      const bits = [`${e.meal}: ${e.name}`]
      if (e.calories) bits.push(`${e.calories} kcal`)
      if (e.protein) bits.push(`P${Math.round(e.protein)}`)
      return bits.join(' · ')
    }
    case 'daily': {
      const bits: string[] = []
      if (e.steps) bits.push(`${e.steps.toLocaleString()} steps`)
      if (e.sleepHours) bits.push(`${e.sleepHours}h sleep`)
      if (e.systolic) bits.push(`BP ${e.systolic}/${e.diastolic}`)
      if (e.restingHr) bits.push(`RHR ${e.restingHr}`)
      return bits.join(' · ') || 'Daily metrics'
    }
    case 'body': {
      const bits: string[] = []
      if (e.weightKg) bits.push(`${e.weightKg} kg`)
      if (e.bodyFatPct) bits.push(`${e.bodyFatPct}% body fat`)
      return bits.join(' · ') || 'Body entry'
    }
    case 'unknown':
      return e.text
  }
}
