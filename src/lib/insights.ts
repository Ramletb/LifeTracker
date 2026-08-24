import { MARKERS, markerById } from '../data/markers'
import type {
  BodyEntry,
  DailyMetrics,
  FoodEntry,
  Insight,
  LabResult,
  Profile,
  Workout
} from '../types'
import { fmtMed } from './dates'
import { fmtRange, markerStatus, scoreMarker } from './score'

export interface InsightInputs {
  labs: LabResult[]
  food: FoodEntry[] // last 14 days
  workouts: Workout[] // last 14 days
  daily: DailyMetrics[] // last 14 days
  body: BodyEntry[] // all, sorted by date asc
  profile: Profile
}

/** Latest result per marker. */
export function latestLabs(labs: LabResult[]): Map<string, LabResult> {
  const latest = new Map<string, LabResult>()
  for (const r of labs) {
    const cur = latest.get(r.markerId)
    if (!cur || r.date > cur.date) latest.set(r.markerId, r)
  }
  return latest
}

const mean = (xs: number[]) =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : undefined

/**
 * Rule-based coaching: turns the latest labs plus recent lifestyle logs into
 * prioritized, plain-language insight cards. Informational only — not a
 * medical device and not medical advice.
 */
export function buildInsights(inp: InsightInputs): Insight[] {
  const out: Insight[] = []
  const latest = latestLabs(inp.labs)

  // ── Lab-driven cards, worst first ─────────────────────────────────
  const scored = [...latest.values()]
    .map((r) => {
      const def = markerById.get(r.markerId)
      if (!def) return undefined
      return { r, def, score: scoreMarker(def, r.value), status: markerStatus(def, r.value) }
    })
    .filter((x): x is NonNullable<typeof x> => x !== undefined)
    .filter((x) => x.status !== 'optimal')
    .sort((a, b) => a.score - b.score)

  for (const { r, def, status } of scored.slice(0, 6)) {
    out.push({
      id: `lab-${def.id}`,
      severity: status === 'out' ? 'act' : 'watch',
      title: `${def.name}: ${r.value.toFixed(def.decimals)} ${def.unit}`,
      body: def.advice ?? def.desc,
      dataLine: `Drawn ${fmtMed(r.date)} · optimal ${fmtRange(def.opt, def.decimals)} · reference ${fmtRange(def.std, def.decimals)} ${def.unit}`
    })
  }

  // HOMA-IR when glucose and insulin were drawn together
  const glu = latest.get('glucose')
  const ins = latest.get('insulin')
  if (glu && ins && glu.date === ins.date) {
    const homa = (glu.value * ins.value) / 405
    out.push({
      id: 'homa-ir',
      severity: homa >= 2.5 ? 'act' : homa >= 1.5 ? 'watch' : 'good',
      title: `HOMA-IR: ${homa.toFixed(1)}`,
      body:
        homa >= 2.5
          ? 'Your glucose and insulin together suggest meaningful insulin resistance. Muscle is your biggest glucose sink — prioritize resistance training, post-meal walks and weight management, and share this with your clinician.'
          : homa >= 1.5
            ? 'Early insulin resistance territory. Now is the cheap time to act: more muscle, more daily movement, fewer refined carbs.'
            : 'Insulin sensitivity looks good — your fasting glucose and insulin are working as a low-effort team.',
      dataLine: `Computed from glucose ${glu.value} mg/dL × insulin ${ins.value} µIU/mL (${fmtMed(glu.date)})`
    })
  }

  // ── Lifestyle: last 7 days of logs ────────────────────────────────
  const last7 = new Set(
    inp.daily
      .map((d) => d.date)
      .sort()
      .slice(-7)
  )
  const week = inp.daily.filter((d) => last7.has(d.date))

  const steps = mean(week.map((d) => d.steps).filter((v): v is number => v !== undefined))
  if (steps !== undefined) {
    const target = inp.profile.stepTarget
    if (steps < target * 0.8) {
      out.push({
        id: 'steps',
        severity: 'watch',
        title: `Averaging ${Math.round(steps).toLocaleString()} steps`,
        body: `You're under your ${target.toLocaleString()}-step goal. Daily steps are the quietest lever on triglycerides, glucose and mood — try anchoring a 15-minute walk to a meal you never skip.`
      })
    } else if (steps >= target) {
      out.push({
        id: 'steps',
        severity: 'good',
        title: `Step goal met: ${Math.round(steps).toLocaleString()}/day`,
        body: 'Averaging at or above your step goal this week. Consistency here compounds — keep the streak.'
      })
    }
  }

  const sleep = mean(
    week.map((d) => d.sleepHours).filter((v): v is number => v !== undefined)
  )
  if (sleep !== undefined && sleep < inp.profile.sleepTarget - 0.5) {
    out.push({
      id: 'sleep',
      severity: 'watch',
      title: `Sleep averaging ${sleep.toFixed(1)}h`,
      body: `Below your ${inp.profile.sleepTarget}h target. Short sleep raises next-day glucose and hunger hormones — protect a consistent lights-out time before optimizing anything else.`
    })
  }

  // Food: protein and fiber over logged days
  const foodDays = new Map<string, FoodEntry[]>()
  for (const f of inp.food) {
    const arr = foodDays.get(f.date) ?? []
    arr.push(f)
    foodDays.set(f.date, arr)
  }
  if (foodDays.size >= 3) {
    const perDay = [...foodDays.values()]
    const protein = mean(perDay.map((es) => es.reduce((a, e) => a + e.protein, 0)))
    const fiber = mean(
      perDay.map((es) => es.reduce((a, e) => a + (e.fiber ?? 0), 0))
    )
    if (protein !== undefined && protein < inp.profile.proteinTarget * 0.85) {
      out.push({
        id: 'protein',
        severity: 'watch',
        title: `Protein averaging ${Math.round(protein)}g/day`,
        body: `Under your ${inp.profile.proteinTarget}g goal. Protein protects muscle while you lean out and blunts glucose spikes — aim for 30–40g per meal, starting with breakfast.`
      })
    }
    if (fiber !== undefined && fiber < inp.profile.fiberTarget * 0.8) {
      out.push({
        id: 'fiber',
        severity: 'watch',
        title: `Fiber averaging ${Math.round(fiber)}g/day`,
        body: `Below your ${inp.profile.fiberTarget}g goal. Soluble fiber directly lowers LDL and ApoB — oats, beans, lentils and psyllium are the efficient sources.`
      })
    }
  }

  // Strength training frequency
  const strength = inp.workouts.filter((w) =>
    /strength|weights|lift|resistance|gym/i.test(w.type)
  )
  if (inp.workouts.length > 0 && strength.length === 0) {
    out.push({
      id: 'strength',
      severity: 'info',
      title: 'No strength sessions logged recently',
      body: 'Cardio is covered, but muscle is the organ of longevity — two 30–45 minute resistance sessions a week moves nearly every marker you track (glucose, insulin, testosterone, body composition).'
    })
  }

  // Weight trend from body entries (last ~30 days, linear fit)
  const weights = inp.body
    .filter((b) => b.weightKg !== undefined)
    .slice(-10)
  if (weights.length >= 3 && inp.profile.weightTargetKg !== undefined) {
    const latestW = weights[weights.length - 1].weightKg!
    const firstW = weights[0].weightKg!
    const delta = latestW - firstW
    const toGo = latestW - inp.profile.weightTargetKg
    if (Math.abs(toGo) > 1 && delta * toGo < 0) {
      out.push({
        id: 'weight',
        severity: 'good',
        title: `Weight trending the right way (${delta > 0 ? '+' : ''}${delta.toFixed(1)} kg)`,
        body: `Moving toward your ${inp.profile.weightTargetKg} kg target — ${Math.abs(toGo).toFixed(1)} kg to go at the current pace.`
      })
    }
  }

  if (out.length === 0) {
    out.push({
      id: 'empty',
      severity: 'info',
      title: 'Log some data to get coaching',
      body: 'Add blood test results, food, workouts or daily metrics and this page turns them into prioritized suggestions. Try the sample data in Settings to see how it works.'
    })
  }

  // Everything optimal?
  if (
    latest.size > 0 &&
    [...latest.values()].every((r) => {
      const def = markerById.get(r.markerId)
      return def ? markerStatus(def, r.value) === 'optimal' : true
    })
  ) {
    out.unshift({
      id: 'all-optimal',
      severity: 'good',
      title: 'Every tracked marker is in its optimal range',
      body: 'Genuinely rare and worth protecting. Keep the habits that got you here, and re-test in 6–12 months to confirm the trend.'
    })
  }

  return out
}

/** Markers worth measuring that have no data yet — a "consider testing" list. */
export function untestedKeyMarkers(labs: LabResult[]): string[] {
  const have = new Set(labs.map((l) => l.markerId))
  const key = ['apob', 'lpa', 'hscrp', 'hba1c', 'insulin', 'vitd', 'omega3']
  return key.filter((k) => !have.has(k)).map((k) => markerById.get(k)?.name ?? k)
}

export const ALL_MARKERS = MARKERS
