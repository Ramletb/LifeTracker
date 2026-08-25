import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { getProfile } from './db'
import { DEFAULT_PROFILE, type Profile, type SystemId } from './types'
import { TabBar, type TabId } from './components/ui'
import { Today } from './views/Today'
import { Labs } from './views/Labs'
import { Log } from './views/Log'
import { Body } from './views/Body'
import { Coach } from './views/Coach'
import { Settings } from './views/Settings'

export default function App() {
  const [tab, setTab] = useState<TabId>('today')
  const [showSettings, setShowSettings] = useState(false)
  const [focusSystem, setFocusSystem] = useState<SystemId | null>(null)

  const profile: Profile = useLiveQuery(getProfile, []) ?? DEFAULT_PROFILE

  useEffect(() => {
    const root = document.documentElement
    if (profile.theme === 'auto') delete root.dataset.theme
    else root.dataset.theme = profile.theme
  }, [profile.theme])

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">
          Ramlet<span className="tick">/</span>Life
        </h1>
        <div className="header-side">
          <button
            className="icon-btn"
            aria-label="Settings"
            type="button"
            onClick={() => setShowSettings(true)}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path
                d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </header>

      <main>
        {tab === 'today' && (
          <Today
            profile={profile}
            onOpenSystem={(s) => {
              setFocusSystem(s)
              setTab('labs')
            }}
            onGoLog={() => setTab('log')}
          />
        )}
        {tab === 'labs' && (
          <Labs
            profile={profile}
            focusSystem={focusSystem}
            onFocusHandled={() => setFocusSystem(null)}
          />
        )}
        {tab === 'log' && <Log profile={profile} />}
        {tab === 'body' && <Body profile={profile} />}
        {tab === 'coach' && <Coach profile={profile} />}
      </main>

      <TabBar tab={tab} onChange={setTab} />
      {showSettings && (
        <Settings profile={profile} onClose={() => setShowSettings(false)} />
      )}
    </div>
  )
}
