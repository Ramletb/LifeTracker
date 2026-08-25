import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { addDays, todayISO } from '../lib/dates'
import { buildInsights, untestedKeyMarkers } from '../lib/insights'
import { Card } from '../components/ui'
import type { Insight, Profile } from '../types'

const TAGS: Record<Insight['severity'], string> = {
  act: 'Act',
  watch: 'Watch',
  good: 'Win',
  info: 'Note'
}

export function Coach({ profile }: { profile: Profile }) {
  const today = todayISO()
  const cutoff = addDays(today, -14)

  const labs = useLiveQuery(() => db.labs.toArray(), []) ?? []
  const food =
    useLiveQuery(() => db.food.where('date').aboveOrEqual(cutoff).toArray(), [cutoff]) ?? []
  const workouts =
    useLiveQuery(() => db.workouts.where('date').aboveOrEqual(cutoff).toArray(), [cutoff]) ?? []
  const daily =
    useLiveQuery(() => db.daily.where('date').aboveOrEqual(cutoff).toArray(), [cutoff]) ?? []
  const body = useLiveQuery(() => db.body.orderBy('date').toArray(), []) ?? []

  const insights = buildInsights({ labs, food, workouts, daily, body, profile })
  const untested = untestedKeyMarkers(labs)

  return (
    <>
      <div className="view-date" style={{ marginTop: 4 }}>
        Coaching from your last 14 days + latest labs
      </div>

      {insights.map((ins) => (
        <article key={ins.id} className={`insight insight-${ins.severity}`}>
          <h3 className="insight-title">
            <span className="insight-tag">{TAGS[ins.severity]}</span>
            {ins.title}
          </h3>
          <p className="insight-body">{ins.body}</p>
          {ins.dataLine && <div className="insight-data">{ins.dataLine}</div>}
        </article>
      ))}

      {untested.length > 0 && (
        <Card eyebrow="Blind spots" title="Worth testing next">
          <p className="note" style={{ marginTop: 0 }}>
            High-signal markers you haven’t logged yet: {untested.join(', ')}.
            Most can ride along on a routine panel — ask for them at your next
            draw.
          </p>
        </Card>
      )}

      <p className="disclaimer">
        This coaching is generated from your own data with simple, transparent
        rules. It is general wellness information, not medical advice, and it
        can’t see your full history — review lab results and any changes
        (especially medication-adjacent ones) with your clinician.
      </p>
    </>
  )
}
