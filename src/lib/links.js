/**
 * Affiliate + deep-link helpers.
 * Replace bookingUrl / refId per venue (venues.json) or set VITE_AFFILIATE_REF globally.
 */
const DEFAULT_REF_PARAM = {
  eventbrite: 'aff',
  opentable: 'ref',
  resy: 'ref',
  direct: 'ref',
}

const GLOBAL_REF = import.meta.env.VITE_AFFILIATE_REF || 'findfunaround'

export function buildBookingUrl(venue) {
  const a = venue.affiliate
  if (!a?.bookingUrl) return null
  try {
    const url = new URL(a.bookingUrl)
    const param = a.refParam || DEFAULT_REF_PARAM[a.provider] || 'ref'
    url.searchParams.set(param, a.refId || GLOBAL_REF)
    url.searchParams.set('utm_source', 'findfunaround')
    url.searchParams.set('utm_medium', venue.isSponsored ? 'sponsored' : 'affiliate')
    url.searchParams.set('utm_campaign', venue.id)
    return url.toString()
  } catch {
    return null
  }
}

export function directionsUrl(venue) {
  const { lat, lng } = venue.location
  const place = venue.googlePlaceId ? `&destination_place_id=${venue.googlePlaceId}` : ''
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}${place}`
}

export const telUrl = (venue) => (venue.phone ? `tel:${venue.phone.replace(/[^\d+]/g, '')}` : null)

/** Lightweight click tracking: dataLayer + optional beacon endpoint. */
export function trackClick(type, venue) {
  const payload = {
    event: 'ffam_click',
    type,
    venueId: venue.id,
    sponsored: Boolean(venue.isSponsored || venue.sponsorTier === 'featured'),
    pinned: Boolean(venue.pinned),
    ts: Date.now(),
  }
  try {
    window.dataLayer?.push(payload)
    const endpoint = import.meta.env.VITE_TRACK_ENDPOINT
    if (endpoint && navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, JSON.stringify(payload))
    } else if (import.meta.env.DEV) {
      console.debug('[track]', payload)
    }
  } catch {
    /* tracking must never break the UI */
  }
}
