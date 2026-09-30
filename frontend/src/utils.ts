export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(amount)
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-LK', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
}

export function today() {
  return new Date().toISOString().slice(0, 10)
}

export function getRentalDays(pickup?: string, returnDate?: string) {
  if (!pickup || !returnDate) return 0
  const start = new Date(pickup)
  const end = new Date(returnDate)
  const difference = Math.ceil((end.getTime() - start.getTime()) / 86_400_000)
  return Number.isFinite(difference) && difference > 0 ? difference : 0
}
