import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { LayoutGrid, LocateFixed, Map as MapIcon } from 'lucide-react'
import venues from './data/venues.json'
import Mascot, { GooglyEyes } from './components/Mascot'
import Filters from './components/Filters'
import CardDeck from './components/CardDeck'
import MapView from './components/MapView'
import { DEMO_ORIGIN, MOOD_LINES, VIBE_MOOD } from './lib/constants'
import { haversineKm, recommend } from './lib/recommend'

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

function getLiveLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null)
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, label: 'Your location', live: true }),
      () => resolve(null),
      { timeout: 4000, maximumAge: 300000 }
    )
  })
}

const baseMood = (filters) => (filters.vibe ? VIBE_MOOD[filters.vibe] : 'idle')

export default function App() {
  const [filters, setFilters] = useState({ budget: 'any', vibe: null, group: null, radius: 'city' })
  const [mood, setMood] = useState('idle')
  const [phase, setPhase] = useState('idle') // idle | loading | done
  const [results, setResults] = useState([])
  const [meta, setMeta] = useState({ origin: DEMO_ORIGIN, note: '', fallback: false })
  const [view, setView] = useState('cards')
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(-1)

  const filtersRef = useRef(filters)
  const timers = useRef([])
  const resultsRef = useRef(null)
  filtersRef.current = filters

  const later = useCallback((fn, ms) => {
    const t = setTimeout(fn, ms)
    timers.current.push(t)
    return t
  }, [])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const handleChange = (key, value) => {
    if (phase === 'loading') return
    const next = { ...filters, [key]: key === 'vibe' || key === 'group' ? (filters[key] === value ? null : value) : value }
    setFilters(next)
    if (key === 'vibe') {
      setMood(next.vibe ? VIBE_MOOD[next.vibe] : 'idle')
    } else {
      setMood('wow')
      later(() => setMood(baseMood(filtersRef.current)), 1500)
    }
  }

  const onFind = async () => {
    if (phase === 'loading') return
    setPhase('loading')
    setView('cards')
    setIndex(0)
    setMood('dizzy')

    const geo = getLiveLocation()
    await wait(700)
    setMood('loading')
    await wait(1500)

    let origin = (await geo) || DEMO_ORIGIN
    let note = origin.live ? 'Using your live location' : 'Demo data around Victoria Island, Lagos'

    // Mock venues only exist in Lagos: if the user is elsewhere, use the demo origin.
    if (origin.live && !venues.some((v) => haversineKm(origin, v.location) <= 80)) {
      origin = DEMO_ORIGIN
      note = 'No sample venues near you yet — showing Lagos demo data'
    }

    const out = recommend(venues, filtersRef.current, origin)
    setResults(out.results)
    setMeta({ origin, note, fallback: out.usedFallback })
    setPhase('done')

    if (out.results.length === 0) {
      setMood('sad')
    } else {
      setMood('celebrate')
      later(() => setMood(baseMood(filtersRef.current)), 2600)
    }
    later(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 350)
  }

  const step = (delta, dir) => {
    setDirection(dir)
    setIndex((i) => (i + delta + results.length) % results.length)
  }

  const selectFromMap = (id) => {
    const i = results.findIndex((v) => v.id === id)
    if (i >= 0) {
      setDirection(-1)
      setIndex(i)
    }
  }

  const loading = phase === 'loading'
  const activeId = results.length ? results[index % results.length]?.id : null

  return (
    <div className="relative mx-auto min-h-screen max-w-md overflow-x-hidden font-display">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-blob/25 blur-3xl" />
        <div className="absolute -right-24 top-96 h-80 w-80 rounded-full bg-mint/15 blur-3xl" />
        <div className="absolute -bottom-20 left-10 h-72 w-72 rounded-full bg-zap/10 blur-3xl" />
      </div>

      <header className="px-5 pt-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wide">
          <GooglyEyes size={16} />
          findfunaround.me
        </div>
        <h1 className="mt-3 text-4xl font-bold leading-none">
          Find <span className="text-blob">Fun</span> Around Me
        </h1>
        <p className="mt-2 text-sm text-white/60">Boredom has left the chat.</p>
      </header>

      <section className="flex flex-col items-center px-5 pt-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={mood}
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="relative mb-1 rounded-2xl bg-white px-4 py-2 text-center text-sm font-semibold text-night shadow-lg"
          >
            {MOOD_LINES[mood]}
            <span className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-white" />
          </motion.div>
        </AnimatePresence>
        <Mascot mood={mood} size={190} />
      </section>

      <main className="space-y-8 px-5 pb-40 pt-2">
        <div className="glass rounded-3xl p-4">
          <Filters filters={filters} onChange={handleChange} />
        </div>

        <div ref={resultsRef} className="scroll-mt-4">
          <AnimatePresence mode="wait">
            {phase === 'done' && (
              <motion.section key="results" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {results.length ? `${results.length} spot${results.length > 1 ? 's' : ''} found` : 'No fun found'}
                    </h2>
                    <p className="flex items-center gap-1 text-xs text-white/50">
                      <LocateFixed size={12} /> {meta.note}
                    </p>
                  </div>

                  {results.length > 0 && (
                    <div className="glass flex rounded-full p-1">
                      {[
                        ['cards', LayoutGrid, 'Cards'],
                        ['map', MapIcon, 'Map'],
                      ].map(([id, Icon, label]) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setView(id)}
                          aria-pressed={view === id}
                          className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                            view === id ? 'bg-zap text-night' : 'text-white/70'
                          }`}
                        >
                          <Icon size={14} /> {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {meta.fallback && results.length > 0 && (
                  <p className="rounded-2xl bg-white/5 p-3 text-xs text-white/60">
                    Nothing matched perfectly, so here are the closest wildcards.
                  </p>
                )}

                {results.length === 0 ? (
                  <div className="glass rounded-3xl p-6 text-center text-sm text-white/70">
                    Nothing in that radius. Try <b>Citywide</b> or <b>Deep Dive</b> and I’ll look harder.
                  </div>
                ) : view === 'cards' ? (
                  <CardDeck items={results} index={index} direction={direction} onStep={step} />
                ) : (
                  <MapView venues={results} origin={meta.origin} activeId={activeId} onSelect={selectFromMap} />
                )}

                {view === 'map' && activeId && (
                  <button
                    type="button"
                    onClick={() => setView('cards')}
                    className="w-full rounded-2xl bg-white/10 py-2.5 text-sm font-semibold"
                  >
                    See this pick as a card
                  </button>
                )}

                <p className="pt-2 text-center text-[11px] leading-relaxed text-white/35">
                  Sponsored placements are marked. Booking links may earn us a commission at no extra cost to you.
                </p>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md bg-gradient-to-t from-night via-night/95 to-transparent px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-8">
        <motion.button
          type="button"
          onClick={onFind}
          disabled={loading}
          whileTap={{ scale: 0.94 }}
          whileHover={{ scale: 1.02 }}
          animate={loading ? { scale: [1, 1.03, 1] } : { scale: 1 }}
          transition={loading ? { repeat: Infinity, duration: 0.7 } : undefined}
          className="flex w-full items-center justify-center gap-3 rounded-3xl bg-gradient-to-r from-zap via-amber-300 to-blob py-4 text-xl font-bold text-night shadow-[0_10px_40px_-8px_rgba(255,79,216,.7)] disabled:cursor-wait"
        >
          <GooglyEyes size={26} />
          {loading ? 'Scanning for fun…' : 'Find Fun Around Me'}
        </motion.button>
      </div>
    </div>
  )
}
