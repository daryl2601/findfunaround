# Find Fun Around Me — findfunaround.me

A playful, mobile-first venue recommender with an eye-tracking mascot, sponsored top slots, and affiliate booking links.

**Stack:** Vite + React 18 · Tailwind CSS · Framer Motion · Lucide icons

```bash
npm install
cp .env.example .env     # optional: add your keys
npm run dev              # http://localhost:5173
npm run build            # production build in /dist
```

## Project map

| Path | What it does |
| --- | --- |
| `src/hooks/useMousePosition.js` | Pointer/touch tracking (one update per animation frame) |
| `src/components/Mascot.jsx` | Eye-tracking blob mascot + `GooglyEyes` for buttons/logo |
| `src/components/Filters.jsx` | Budget, vibe, group size, and radius chips |
| `src/components/CardDeck.jsx` | Swipeable card stack |
| `src/components/VenueCard.jsx` | Match ring, sponsored badge, Book / Directions / Call |
| `src/components/MapView.jsx` | Illustrated map by default, live Google Map when a key is set |
| `src/lib/recommend.js` | Scoring and the sponsored-slot lock |
| `src/lib/links.js` | Affiliate URL builder, directions, tel, click tracking |
| `src/data/venues.json` | 10 mock venues |
| `src/data/venues.schema.json` | JSON Schema for a venue |

## Mascot moods

| Trigger | Reaction |
| --- | --- |
| Pointer / touch anywhere | Eyes follow it (pupils clamped inside the eye) |
| Party | Eyes pop out, body bounces, confetti |
| Chill | Heavy eyelids, slow sway |
| Outdoor | Sunglasses drop onto the face |
| Foodie | Tongue out, wiggle |
| Family | Open grin and blush |
| Date night | Heart pupils, heartbeat |
| Budget / group / radius change | Brief "wow" |
| Press the main button | Dizzy spiral eyes, then spinning and jumping with a radar pulse while searching, then a victory jump |
| No results | Sad face |

## How recommendations work

Each venue is scored from 0 to 100: vibe 40, budget 20, group size 20, distance 20, minus 10 when closed right now.

- Venues outside the chosen radius are dropped. Venues scoring 45 or more are shown.
- If nothing reaches 45, the closest five appear as "wildcards".
- **Sponsored slot:** a venue with `isSponsored: true` or `sponsorTier: 'featured'` is pinned to position #1 when it matches the selected vibe, is in radius, and scores 70 or more. `featured` beats `standard`, then the higher score wins. The pinned card gets the "Top Pick · Sponsored Partner" badge and a pulsing glow.

## Venue schema

See `src/data/venues.schema.json`. Key fields:

```jsonc
{
  "id": "v-neon-jungle",
  "googlePlaceId": null,                // optional, makes directions exact
  "name": "Neon Jungle Nightclub",
  "vibes": ["nightlife"],               // nightlife | chill | outdoor | foodie | family | date
  "priceLevel": 4,                      // 1-4
  "groupSizes": ["couple", "small", "squad"],   // solo | couple | small | squad
  "location": { "lat": 6.4325, "lng": 3.4285 },
  "hours": { "open": "21:00", "close": "05:00", "closedDays": [] },   // close < open = after midnight
  "isSponsored": true,
  "sponsorTier": "featured",            // featured | standard | null
  "sponsorName": "Neon Jungle",
  "affiliate": {
    "provider": "eventbrite",           // opentable | resy | eventbrite | direct
    "bookingUrl": "https://www.eventbrite.com/e/...",
    "refParam": "aff",
    "refId": null,                      // falls back to VITE_AFFILIATE_REF
    "ctaLabel": "Get Tickets"
  }
}
```

The images, phone numbers, and booking URLs in the mock data are **placeholders**. Replace them before launch.

---

## Connect live Google Maps

1. **Create a key.** In Google Cloud Console, create a project, enable billing, and enable **Maps JavaScript API**. For live venue data also enable **Places API (New)**.
2. **Restrict the key.** Under Credentials, set *Application restrictions* to *HTTP referrers* and add `https://findfunaround.me/*`, `https://www.findfunaround.me/*`, and `http://localhost:5173/*`. Under *API restrictions*, allow only the APIs you enabled.
3. **Add it locally.** Put `VITE_GOOGLE_MAPS_API_KEY=your_key` in `.env`, then restart `npm run dev`. The Map toggle switches from the illustrated map to a live, dark-styled Google Map with numbered pins (sponsored pins are gold).
4. **Add it in production.** Set the same variable in your host (Vercel, Netlify, Cloudflare Pages) and redeploy. Vite inlines `VITE_*` values at build time, so the referrer restriction in step 2 is what protects the key.
5. **Pull real venues (optional).** Replace the `venues.json` import in `App.jsx` with a fetch. Use a small serverless function so your server-side key stays private:

   ```js
   // POST https://places.googleapis.com/v1/places:searchNearby
   // Headers: X-Goog-Api-Key: <SERVER KEY>, X-Goog-FieldMask: places.id,places.displayName,places.location,places.priceLevel,places.rating,places.photos,places.nationalPhoneNumber,places.regularOpeningHours,places.formattedAddress
   // Body: { includedTypes: ["night_club","restaurant","park"], maxResultCount: 20,
   //         locationRestriction: { circle: { center: { latitude, longitude }, radius: 15000 } } }
   ```

   Map each result to the schema: `id` and `googlePlaceId` from `place.id`, `location` from `place.location`, `priceLevel` from the `PRICE_LEVEL_*` enum (1-4), and `vibes` from the `types` array. Then merge in your sponsor and affiliate records, which live in your own database keyed by `googlePlaceId`.
6. **Check Google's terms.** Google restricts caching Places content and requires attribution, so review them before storing results.

`MapView.jsx` uses `google.maps.Marker` for simplicity. If Google's deprecation of it affects you, switch to `AdvancedMarkerElement` (requires a Map ID).

## Connect affiliate URLs

1. **Join the programs.** Apply to the affiliate or partner program of each platform you link to (OpenTable, Resy, Eventbrite, or the venue's own). Each gives you a partner ID and tells you which query parameter to use.
2. **Set your IDs.** Global default: `VITE_AFFILIATE_REF=your-id` in `.env`. Per venue: fill `affiliate.refId` and `affiliate.refParam` in the venue data. Defaults live in `src/lib/links.js` (`eventbrite → aff`, others → `ref`). Change them to whatever your network specifies.
3. **Use real booking URLs.** Set `affiliate.bookingUrl` to the venue's real page. `buildBookingUrl()` appends your ref param plus `utm_source`, `utm_medium` (`sponsored` or `affiliate`), and `utm_campaign` (venue id), and returns e.g. `https://…?aff=your-id&utm_source=findfunaround&…`.
4. **If a network needs redirect links.** Some networks give you a tracking link (`https://network.example/click?...&u=<destination>`) rather than a param. In that case set `bookingUrl` to the network's link template and adjust `buildBookingUrl()` to substitute the destination.
5. **Measure clicks.** Every Book / Directions / Call click calls `trackClick()`. It pushes to `window.dataLayer` (Google Tag Manager) and, if `VITE_TRACK_ENDPOINT` is set, sends a beacon to your endpoint with `venueId`, `type`, `sponsored`, and `pinned`. Use it to report to sponsors.
6. **Stay compliant.** Affiliate links already carry `rel="sponsored"` and the page shows a commission disclosure. Keep both, and check each program's terms and your local advertising rules for sponsored content.

## Deploy to findfunaround.me

Push to GitHub, import the repo in Vercel or Netlify (build `npm run build`, output `dist`), add the env vars, then point the domain's DNS records at the host.

## Using Next.js instead

The components are plain React. Copy `src/` into an App Router project, add `"use client"` at the top of `App.jsx` and each component that uses hooks, rename `import.meta.env.VITE_*` to `process.env.NEXT_PUBLIC_*`, and move the Fredoka `<link>` into `app/layout.jsx`.
