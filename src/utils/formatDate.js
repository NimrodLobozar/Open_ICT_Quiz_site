// Datums zoals in de designs: "24 okt", "sep 2026", "2 dagen geleden". Altijd Nederlands.

const day = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short' })
const dayTime = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const monthYear = new Intl.DateTimeFormat('nl-NL', { month: 'short', year: 'numeric' })

// Intl zet een punt achter afkortingen ("24 okt."); het design gebruikt geen punt.
const clean = (text) => text.replace(/\./g, '')

/** "24 okt" */
export const formatDay = (date) => clean(day.format(new Date(date)))

/** "24 okt, 10:42" */
export const formatDayTime = (date) => clean(dayTime.format(new Date(date)))

/** "sep 2026" */
export const formatMonthYear = (date) => clean(monthYear.format(new Date(date)))

/** "nu", "5 min geleden", "gisteren", "3 dagen geleden", of de datum als het langer geleden is. */
export function formatAgo(date, now = Date.now()) {
  if (!date) return '—'
  const minutes = Math.round((now - new Date(date).getTime()) / 60000)
  if (minutes < 5) return 'nu actief'
  if (minutes < 60) return `${minutes} min geleden`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} uur geleden`
  const days = Math.round(hours / 24)
  if (days === 1) return 'gisteren'
  if (days < 7) return `${days} dagen geleden`
  return formatDay(date)
}

/** Plaats als "1e", "2e". */
export const formatPlace = (rank) => (rank == null ? '–' : `${rank}e`)
