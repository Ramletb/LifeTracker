# Life Tracker

A personal health console you run on your own phone: blood biomarkers, food,
exercise, sleep and body composition in one place, scored against optimal
ranges and turned into plain-language coaching.

**Local-first by design.** Everything you log lives in your browser's
IndexedDB on your device. Nothing is uploaded anywhere; backup and restore is
a JSON file you control.

## What it does

- **Voice logging (the front door)** — a floating mic on every screen.
  Say “I ran for 25 minutes, completed 2 miles”, “grilled chicken and rice
  for lunch, about 650 calories, 40 grams of protein, 8 grams of saturated
  fat”, “slept 7 and a half hours” or “I weigh 188 pounds” and the entry is
  parsed, shown in an editable confirmation card, and saved. Backdating
  works — “last Tuesday I ran a 5k”, “on August 18th…”. Uses the browser’s
  built-in speech recognition (Chrome/Android); a type-it-in fallback covers
  everything else.
- **Goals** — set a race (e.g. a 10K on Nov 26) and get an adaptive
  training plan: a weekly long-run ramp (capped at +15%/week) from your
  current ability to race distance, with a taper. The plan is recomputed
  live from your logged runs — voice in a missed week later and every
  remaining target re-plots. The runner track shows completed weeks as
  filled bars, planned long runs as ghost bars, a runner at today and the
  flag at race day.
- **Today** — a systems board that scores eight body systems
  (cardiovascular, metabolic, inflammation, liver, kidney, thyroid, blood,
  micronutrients) from your latest labs, plus tiles for steps, calories,
  protein, sleep, weight and resting heart rate.
- **Labs** — track ~35 biomarkers (ApoB, Lp(a), LDL-C, hs-CRP, HbA1c,
  fasting insulin, vitamin D, thyroid panel, CBC…) with trend charts,
  standard reference ranges *and* tighter optimal targets. Add results one
  at a time or import a CSV (`date, marker, value`) — marker names are
  matched loosely ("Apolipoprotein B", "LDL-C", "A1c"…).
- **Log** — food (quick add or MyNetDiary CSV export import), workouts
  (quick add or Apple Health/Watch CSV import) and daily metrics (steps,
  sleep, resting HR, blood pressure).
- **Body** (inside Log) — weigh-ins and body scans (DEXA/InBody): weight,
  body fat %, lean mass, waist, visceral fat, with trends and BMI.
- **Coach** — transparent, rule-based coaching: which markers are out of
  their optimal range and what usually moves them, HOMA-IR when glucose +
  insulin were drawn together, protein/fiber/step/sleep gaps, strength
  training reminders, and a "worth testing next" list of blind spots.

> Ramlet Life Tracker is a personal wellness journal, not a medical device.
> Reference and "optimal" ranges are general adult defaults — your lab's
> ranges and your clinician's judgment take precedence.

## Using it on your phone

The app is a PWA. Once it's deployed (see below), open the URL in Chrome on
Android → menu → **Add to Home screen**. It installs like a native app,
works offline, and keeps your data on the device.

## Development

```bash
npm install
npm run dev        # local dev server
npm test           # unit tests (scoring, CSV parsing)
npm run build      # typecheck + production build to dist/
```

## Deploying to GitHub Pages (free hosting)

The repo ships with `.github/workflows/deploy.yml`, which builds and deploys
on every push to `main` and enables Pages automatically on first run. The
app goes live at `https://<user>.github.io/<repo>/`.

Two GitHub-account caveats: Pages on a **private** repo requires GitHub
Pro/Team (on the Free plan, make the repo public — the app holds no personal
data; everything you log stays in your own browser). And the deploy uploads
a small build artifact, so it can fail temporarily if the account's Actions
artifact storage quota is exhausted — re-run the workflow after the quota
window resets.

## Import formats

| Data | Expected CSV columns |
|---|---|
| Labs | `date, marker, value` (marker names matched loosely) |
| Food | `date, meal, food name, calories, protein, carbs, fat, fiber, sodium` — MyNetDiary export headers work |
| Workouts | `date, type, minutes, calories, distance_km, avg_hr` |
| Daily | `date, steps, sleep_hours, resting_hr, active_calories, systolic, diastolic` |

Dates accept `yyyy-mm-dd`, `m/d/yyyy` and "Aug 24, 2026" styles. Only the
columns you have are needed (labs need all three).

## Roadmap ideas

- Automatic sync from Apple Health / Health Connect
- Food database lookup for quick-add
- Trend targets and experiment tracking (n=1 biohacks with before/after labs)
- LLM-powered coaching on top of the rule engine
