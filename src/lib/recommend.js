import { RADII } from './constants'
import { getOpenStatus } from './hours'

export function haversineKm(a, b) {
  const R = 6371
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

const isSponsoredVenue = (v) => v.isSponsored === true || v.sponsorTier === 'featured'

/**
 * Score a venue 0-100:
 *  vibe 40 · budget 20 · group 20 · distance 20 (-10 if closed right now)
 */
function scoreVenue(v, filters, distanceKm, radiusKm, isOpen) {
  const vibeMatch = !filters.vibe || v.vibes.includes(filters.vibe)
  const vibe = vibeMatch ? 40 : 0

  let budget = 20
  if (filters.budget !== 'any') {
    const gap = Math.abs(v.priceLevel - filters.budget)
    budget = gap === 0 ? 20 : gap === 1 ? 10 : 0
  }

  const group = !filters.group || v.groupSizes.includes(filters.group) ? 20 : 0
  const distance = Math.max(6, Math.round(20 * (1 - distanceKm / radiusKm)))

  const score = Math.max(0, Math.min(100, vibe + budget + group + distance - (isOpen ? 0 : 10)))
  return { score, vibeMatch }
}

/**
 * Returns { results, usedFallback }.
 * Sponsored venues whose criteria match are locked into slot #1 (`pinned: true`);
 * `featured` tier beats `standard`, then higher match score wins.
 */
export function recommend(venues, filters, origin, now = new Date()) {
  const radius = RADII.find((r) => r.id === filters.radius) || RADII[1]

  const scored = venues
    .map((v) => {
      const distanceKm = haversineKm(origin, v.location)
      const status = getOpenStatus(v.hours, now)
      const { score, vibeMatch } = scoreVenue(v, filters, distanceKm, radius.km, status.isOpen)
      return {
        ...v,
        distanceKm,
        isOpen: status.isOpen,
        openLabel: status.label,
        matchScore: score,
        vibeMatch,
        pinned: false,
      }
    })
    .filter((v) => v.distanceKm <= radius.km)

  if (scored.length === 0) return { results: [], usedFallback: false }

  const byScore = (a, b) => b.matchScore - a.matchScore || a.distanceKm - b.distanceKm

  // When a vibe is selected, only show other vibes if nothing in range matches it.
  const pool = filters.vibe && scored.some((v) => v.vibeMatch) ? scored.filter((v) => v.vibeMatch) : scored

  let rest = pool.filter((v) => v.matchScore >= 45).sort(byScore)
  let usedFallback = false
  if (rest.length === 0) {
    rest = [...pool].sort(byScore).slice(0, 5)
    usedFallback = true
  }

  const sponsorCandidates = scored
    .filter((v) => isSponsoredVenue(v) && v.vibeMatch && v.matchScore >= 70)
    .sort((a, b) => {
      const tier = Number(b.sponsorTier === 'featured') - Number(a.sponsorTier === 'featured')
      return tier || byScore(a, b)
    })

  const top = sponsorCandidates[0]
  if (top) {
    rest = [{ ...top, pinned: true }, ...rest.filter((v) => v.id !== top.id)]
  }

  return { results: rest, usedFallback }
}
