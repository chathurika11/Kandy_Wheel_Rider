export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(amount)
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-LK', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-LK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export function today() {
  return getLocalDateTimeInput().slice(0, 10)
}

export function getLocalDateTimeInput(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function getRentalQuote(pickup: string, returnDate: string, dailyRate: number, extraHourlyRate: number) {
  if (!pickup || !returnDate) return null
  const start = new Date(pickup)
  const end = new Date(returnDate)
  const durationMs = end.getTime() - start.getTime()
  if (!Number.isFinite(durationMs) || durationMs < 86_400_000) return null

  const fullRentalDays = Math.floor(durationMs / 86_400_000)
  const extraHours = Math.ceil((durationMs % 86_400_000) / 3_600_000)
  return {
    fullRentalDays,
    extraHours,
    total: fullRentalDays * dailyRate + extraHours * extraHourlyRate,
  }
}
