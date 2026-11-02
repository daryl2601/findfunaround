import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Navigation } from 'lucide-react'
import { VIBE_EMOJI } from '../lib/constants'
import { directionsUrl } from '../lib/links'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

const DARK_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1d1038' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#b8a5e0' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#120826' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#3a1f6b' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0c1f3d' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
]

let googleLoader
function loadGoogle(key) {
  if (window.google?.maps) return Promise.resolve(window.google)
  if (!googleLoader) {
    googleLoader = new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&v=weekly`
      s.async = true
      s.onload = () => resolve(window.google)
      s.onerror = () => {
        googleLoader = null
        reject(new Error('Google Maps failed to load'))
      }
      document.head.appendChild(s)
    })
  }
  return googleLoader
}

const isSponsored = (v) => v.isSponsored || v.sponsorTier === 'featured'

/* ---------- Live Google Map (only when VITE_GOOGLE_MAPS_API_KEY is set) ---------- */
function GoogleMap({ venues, origin, activeId, onSelect, onError }) {
  const ref = useRef(null)
  const mapRef = useRef(null)
  const markers = useRef([])

  useEffect(() => {
    let cancelled = false
    loadGoogle(API_KEY)
      .then((google) => {
        if (cancelled || !ref.current) return
        const map = new google.maps.Map(ref.current, {
          center: { lat: origin.lat, lng: origin.lng },
          zoom: 11,
          disableDefaultUI: true,
          zoomControl: true,
          styles: DARK_STYLE,
        })
        mapRef.current = map
        const bounds = new google.maps.LatLngBounds()

        new google.maps.Marker({
          map,
          position: origin,
          title: 'You',
          icon: { path: google.maps.SymbolPath.CIRCLE, scale: 7, fillColor: '#5eead4', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 3 },
        })
        bounds.extend(origin)

        markers.current = venues.map((v, i) => {
          const marker = new google.maps.Marker({
            map,
            position: v.location,
            title: v.name,
            label: { text: String(i + 1), color: '#120826', fontWeight: '700' },
          })
          marker.addListener('click', () => onSelect(v.id))
          bounds.extend(v.location)
          return { id: v.id, sponsored: isSponsored(v), marker }
        })
        if (venues.length) map.fitBounds(bounds, 48)
      })
      .catch(onError)

    return () => {
      cancelled = true
      markers.current.forEach((m) => m.marker.setMap(null))
      markers.current = []
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venues, origin])

  useEffect(() => {
    const g = window.google
    if (!g?.maps) return
    markers.current.forEach(({ id, sponsored, marker }) => {
      const active = id === activeId
      marker.setIcon({
        path: g.maps.SymbolPath.CIRCLE,
        scale: active ? 16 : 12,
        fillColor: sponsored ? '#facc15' : '#ff4fd8',
        fillOpacity: 1,
        strokeColor: '#120826',
        strokeWeight: 3,
      })
      marker.setZIndex(active ? 999 : 1)
    })
    const a = markers.current.find((m) => m.id === activeId)
    if (a && mapRef.current) mapRef.current.panTo(a.marker.getPosition())
  }, [activeId, venues, origin])

  return <div ref={ref} className="h-full w-full" />
}

/* ---------- Built-in illustrated map (no API key needed) ---------- */
function PinMap({ venues, origin, activeId, onSelect }) {
  const pts = useMemo(() => {
    const all = [origin, ...venues.map((v) => v.location)]
    const lats = all.map((p) => p.lat)
    const lngs = all.map((p) => p.lng)
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)
    const spanLat = maxLat - minLat || 0.01
    const spanLng = maxLng - minLng || 0.01
    const project = (p) => ({
      left: 10 + ((p.lng - minLng) / spanLng) * 80,
      top: 10 + (1 - (p.lat - minLat) / spanLat) * 78,
    })
    return { user: project(origin), venues: venues.map((v) => ({ v, ...project(v.location) })) }
  }, [venues, origin])

  return (
    <div className="map-grid relative h-full w-full overflow-hidden bg-gradient-to-br from-grape to-night">
      <svg className="absolute inset-0 h-full w-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 70 C25 55 40 85 65 60 S100 50 100 45" stroke="#7c5cff" strokeWidth="1.2" fill="none" />
        <path d="M20 0 C30 30 15 60 40 100" stroke="#7c5cff" strokeWidth="1" fill="none" />
        <path d="M0 20 C30 25 60 10 100 30" stroke="#7c5cff" strokeWidth="0.8" fill="none" />
        <path d="M0 96 C30 88 55 98 100 90 L100 100 L0 100 Z" fill="#0c2a5a" />
      </svg>

      <div className="absolute" style={{ left: `${pts.user.left}%`, top: `${pts.user.top}%` }}>
        <motion.span
          className="absolute -left-4 -top-4 block h-8 w-8 rounded-full bg-mint/40"
          animate={{ scale: [0.6, 1.6], opacity: [0.8, 0] }}
          transition={{ repeat: Infinity, duration: 1.6 }}
        />
        <span className="absolute -left-1.5 -top-1.5 block h-3 w-3 rounded-full border-2 border-white bg-mint" />
        <span className="absolute left-3 top-1 whitespace-nowrap text-[10px] font-semibold text-mint">You</span>
      </div>

      {pts.venues.map(({ v, left, top }, i) => {
        const active = v.id === activeId
        return (
          <motion.button
            key={v.id}
            type="button"
            onClick={() => onSelect(v.id)}
            aria-label={v.name}
            initial={{ scale: 0, y: -20 }}
            animate={{ scale: active ? 1.25 : 1, y: 0 }}
            transition={{ type: 'spring', delay: i * 0.05, stiffness: 300, damping: 14 }}
            className="absolute z-10 -translate-x-1/2 -translate-y-full"
            style={{ left: `${left}%`, top: `${top}%`, zIndex: active ? 20 : 10 }}
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-night text-lg shadow-lg ${
                isSponsored(v) ? 'bg-zap' : 'bg-blob'
              }`}
            >
              {VIBE_EMOJI[v.vibes[0]]}
            </span>
            {active && (
              <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-night/90 px-2 py-0.5 text-[10px] font-semibold">
                {v.name}
              </span>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}

export default function MapView({ venues, origin, activeId, onSelect }) {
  const [googleFailed, setGoogleFailed] = useState(false)
  const live = Boolean(API_KEY) && !googleFailed
  const active = venues.find((v) => v.id === activeId)

  return (
    <div className="space-y-3">
      <div className="h-[380px] overflow-hidden rounded-3xl border border-white/10">
        {live ? (
          <GoogleMap venues={venues} origin={origin} activeId={activeId} onSelect={onSelect} onError={() => setGoogleFailed(true)} />
        ) : (
          <PinMap venues={venues} origin={origin} activeId={activeId} onSelect={onSelect} />
        )}
      </div>

      {!live && (
        <p className="px-1 text-center text-[11px] text-white/40">
          Illustrated preview map · add <code>VITE_GOOGLE_MAPS_API_KEY</code> for live Google Maps
        </p>
      )}

      {active && (
        <div className="glass flex items-center justify-between gap-3 rounded-2xl p-3">
          <div className="min-w-0">
            <div className="truncate font-semibold">{active.name}</div>
            <div className="truncate text-xs text-white/60">{active.address}</div>
          </div>
          <a
            href={directionsUrl(active)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-zap px-3 py-2 text-sm font-bold text-night"
          >
            <Navigation size={15} /> Go
          </a>
        </div>
      )}
    </div>
  )
}
