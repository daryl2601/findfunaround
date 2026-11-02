export const BUDGETS = [
  { id: 'any', label: 'Any' },
  { id: 1, label: '$' },
  { id: 2, label: '$$' },
  { id: 3, label: '$$$' },
  { id: 4, label: '$$$$' },
]

export const VIBES = [
  { id: 'nightlife', label: 'Party', emoji: '🪩', mood: 'party' },
  { id: 'chill', label: 'Chill / Lounge', emoji: '🛋️', mood: 'chill' },
  { id: 'outdoor', label: 'Outdoor', emoji: '🏞️', mood: 'outdoor' },
  { id: 'foodie', label: 'Foodie', emoji: '🍜', mood: 'foodie' },
  { id: 'family', label: 'Family / Group', emoji: '🎈', mood: 'family' },
  { id: 'date', label: 'Date Night', emoji: '💘', mood: 'date' },
]

export const GROUPS = [
  { id: 'solo', label: 'Solo', hint: '1' },
  { id: 'couple', label: 'Couple', hint: '2' },
  { id: 'small', label: 'Small Group', hint: '3-5' },
  { id: 'squad', label: 'Party Squad', hint: '6+' },
]

export const RADII = [
  { id: 'near', label: 'Near Me', hint: '< 5 km', km: 5 },
  { id: 'city', label: 'Citywide', hint: '15 km', km: 15 },
  { id: 'deep', label: 'Deep Dive', hint: '30+ km', km: 80 },
]

export const VIBE_MOOD = Object.fromEntries(VIBES.map((v) => [v.id, v.mood]))
export const VIBE_EMOJI = Object.fromEntries(VIBES.map((v) => [v.id, v.emoji]))

export const MOOD_LINES = {
  idle: 'Pick your vibe. I’m watching. 👀',
  party: 'EYES. POPPING. OUT. 🪩',
  chill: 'Low lights, lower expectations. Perfect.',
  outdoor: 'Shades on. Sunscreen optional.',
  foodie: 'Is it dinner yet? It’s always dinner.',
  family: 'Bring everyone! (And snacks.)',
  date: 'Ooh la la. I’ll look away. (I won’t.)',
  wow: 'Ooooh, interesting choice… 👀',
  dizzy: 'Whoa. The room is spinning…',
  loading: 'Scanning for fun… beep boop 📡',
  celebrate: 'Found some! Go go go! 🎉',
  sad: 'Hmm. Slim pickings. Loosen a filter?',
}

export const DEMO_ORIGIN = {
  lat: 6.4281,
  lng: 3.4219,
  label: 'Victoria Island, Lagos (demo location)',
  live: false,
}
