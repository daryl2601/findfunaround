const toMin = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

const fmt = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`
}

/** Returns { isOpen, label } for a venue's hours at `now` (browser-local time). */
export function getOpenStatus(hours, now = new Date()) {
  if (!hours) return { isOpen: true, label: 'Hours unknown' }
  const day = now.getDay()
  const mins = now.getHours() * 60 + now.getMinutes()
  const open = toMin(hours.open)
  const close = toMin(hours.close)
  const closedDays = hours.closedDays || []
  const closedOn = (d) => closedDays.includes(d)

  let isOpen = false
  if (close > open) {
    isOpen = !closedOn(day) && mins >= open && mins < close
  } else if (mins >= open) {
    isOpen = !closedOn(day)
  } else if (mins < close) {
    isOpen = !closedOn((day + 6) % 7)
  }

  return {
    isOpen,
    label: isOpen ? `Open · closes ${fmt(hours.close)}` : `Closed · opens ${fmt(hours.open)}`,
  }
}
