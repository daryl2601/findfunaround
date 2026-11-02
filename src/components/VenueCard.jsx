import { useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Crown, MapPin, Navigation, Phone, Star, Ticket } from 'lucide-react'
import { VIBES, VIBE_EMOJI } from '../lib/constants'
import { buildBookingUrl, directionsUrl, telUrl, trackClick } from '../lib/links'

function ScoreRing({ score }) {
  const r = 20
  const c = 2 * Math.PI * r
  return (
    <svg width="54" height="54" viewBox="0 0 52 52" aria-label={`${score}% match`}>
      <circle cx="26" cy="26" r="24" fill="rgba(18,8,38,.75)" />
      <g transform="rotate(-90 26 26)">
        <circle cx="26" cy="26" r={r} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="5" />
        <motion.circle
          cx="26"
          cy="26"
          r={r}
          fill="none"
          stroke="#5eead4"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - score / 100) }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </g>
      <text x="26" y="30" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">
        {score}%
      </text>
    </svg>
  )
}

function Price({ level }) {
  return (
    <span className="font-semibold">
      <span className="text-zap">{'$'.repeat(level)}</span>
      <span className="text-white/25">{'$'.repeat(4 - level)}</span>
    </span>
  )
}

function Hero({ venue }) {
  const [failed, setFailed] = useState(false)
  const emoji = VIBE_EMOJI[venue.vibes[0]] || '🎉'
  return (
    <div className="relative h-44 w-full overflow-hidden bg-grape">
      {failed ? (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blob/40 to-grape text-6xl">{emoji}</div>
      ) : (
        <img
          src={venue.image}
          alt={venue.name}
          loading="lazy"
          draggable={false}
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-night via-night/20 to-transparent" />
    </div>
  )
}

export default function VenueCard({ venue }) {
  const booking = buildBookingUrl(venue)
  const call = telUrl(venue)
  const sponsored = venue.isSponsored || venue.sponsorTier === 'featured'
  const vibeLabels = venue.vibes.map((id) => VIBES.find((v) => v.id === id)).filter(Boolean)

  const body = (
    <article className="overflow-hidden rounded-[22px] bg-night">
      <div className="relative">
        <Hero venue={venue} />

        {sponsored && (
          <motion.div
            className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-zap px-3 py-1 text-xs font-bold text-night"
            animate={{ boxShadow: ['0 0 0 0 rgba(250,204,21,.7)', '0 0 0 10px rgba(250,204,21,0)'] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: 'easeOut' }}
          >
            <Crown size={13} />
            {venue.pinned ? 'Top Pick · Sponsored Partner' : 'Sponsored Partner'}
          </motion.div>
        )}

        <div className="absolute right-3 top-3">
          <ScoreRing score={venue.matchScore} />
        </div>

        <div className="absolute bottom-3 left-4 right-4">
          <h3 className="text-2xl font-bold leading-tight drop-shadow">{venue.name}</h3>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <p className="text-sm italic text-mint">{venue.tagline}</p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-white/80">
          <Price level={venue.priceLevel} />
          <span className="flex items-center gap-1">
            <MapPin size={14} className="text-blob" />
            {venue.distanceKm < 10 ? venue.distanceKm.toFixed(1) : Math.round(venue.distanceKm)} km
          </span>
          <span className="flex items-center gap-1">
            <Star size={14} className="fill-zap text-zap" />
            {venue.rating.toFixed(1)}
          </span>
          <span className={`flex items-center gap-1 ${venue.isOpen ? 'text-mint' : 'text-rose-300'}`}>
            <Clock size={14} />
            {venue.openLabel}
          </span>
        </div>

        <p className="text-sm leading-relaxed text-white/65">{venue.description}</p>

        <div className="flex flex-wrap gap-1.5">
          {vibeLabels.map((v) => (
            <span key={v.id} className="rounded-full bg-white/10 px-2.5 py-1 text-xs">
              {v.emoji} {v.label}
            </span>
          ))}
        </div>

        <div className="space-y-2 pt-1">
          {booking && (
            <motion.a
              href={booking}
              target="_blank"
              rel="sponsored noopener noreferrer"
              onClick={() => trackClick('book', venue)}
              whileTap={{ scale: 0.96 }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-zap to-amber-400 py-3 text-base font-bold text-night shadow-lg shadow-zap/20"
            >
              <Ticket size={18} />
              {venue.affiliate.ctaLabel}
            </motion.a>
          )}
          <div className="grid grid-cols-2 gap-2">
            <motion.a
              href={directionsUrl(venue)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackClick('directions', venue)}
              whileTap={{ scale: 0.96 }}
              className="glass flex items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-semibold"
            >
              <Navigation size={16} /> Directions
            </motion.a>
            {call ? (
              <motion.a
                href={call}
                onClick={() => trackClick('call', venue)}
                whileTap={{ scale: 0.96 }}
                className="glass flex items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-semibold"
              >
                <Phone size={16} /> Call
              </motion.a>
            ) : (
              <div className="glass flex items-center justify-center rounded-2xl py-2.5 text-sm text-white/30">No phone</div>
            )}
          </div>
        </div>
      </div>
    </article>
  )

  // Sponsored cards get a gradient border + pulsing glow.
  if (sponsored) {
    return (
      <motion.div
        className="rounded-[24px] bg-gradient-to-br from-zap via-blob to-mint p-[2.5px]"
        animate={{ boxShadow: ['0 0 18px rgba(250,204,21,.25)', '0 0 34px rgba(255,79,216,.45)', '0 0 18px rgba(250,204,21,.25)'] }}
        transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
      >
        {body}
      </motion.div>
    )
  }
  return <div className="rounded-[24px] border border-white/10">{body}</div>
}
