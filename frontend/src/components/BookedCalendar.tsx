import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import type { VehicleBookedDate } from '../types'

type BookedCalendarProps = {
  bookedDates: VehicleBookedDate[]
}

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function dateKeyFromValue(value: string) {
  return toDateKey(new Date(value))
}

export function BookedCalendar({ bookedDates }: BookedCalendarProps) {
  const [month, setMonth] = useState(() => {
    const current = new Date()
    const todayKey = toDateKey(current)
    const firstUpcomingDate = bookedDates
      .map(({ pickupDate, returnDate }) => {
        const start = dateKeyFromValue(pickupDate)
        const end = dateKeyFromValue(returnDate)
        return end > todayKey ? (start > todayKey ? start : todayKey) : ''
      })
      .filter(Boolean)
      .sort()[0]
    if (!firstUpcomingDate) return new Date(current.getFullYear(), current.getMonth(), 1)
    const [year, monthNumber] = firstUpcomingDate.split('-').map(Number)
    return new Date(year, monthNumber - 1, 1)
  })
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1)
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const monthLabel = new Intl.DateTimeFormat('en-LK', { month: 'long', year: 'numeric' }).format(month)
  const todayKey = toDateKey(new Date())
  const cells = Array.from({ length: firstDay.getDay() + daysInMonth }, (_, index) => {
    if (index < firstDay.getDay()) return null
    const day = index - firstDay.getDay() + 1
    const dateKey = toDateKey(new Date(month.getFullYear(), month.getMonth(), day))
    const dayStart = new Date(month.getFullYear(), month.getMonth(), day)
    const dayEnd = new Date(month.getFullYear(), month.getMonth(), day + 1)
    const bookingStatus = bookedDates.find(({ pickupDate, returnDate }) => (
      new Date(pickupDate) < dayEnd && new Date(returnDate) > dayStart
    ))?.status
    return { day, dateKey, bookingStatus }
  })

  function changeMonth(offset: number) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1))
  }

  return (
    <section className="booked-calendar" aria-label="Scooter availability calendar">
      <div className="booked-calendar-heading">
        <h2>Booked dates</h2>
        <div>
          <button type="button" onClick={() => changeMonth(-1)} aria-label="Previous month"><ChevronLeft size={18} /></button>
          <strong>{monthLabel}</strong>
          <button type="button" onClick={() => changeMonth(1)} aria-label="Next month"><ChevronRight size={18} /></button>
        </div>
      </div>
      <div className="booked-calendar-grid" role="grid" aria-label={monthLabel}>
        {weekdays.map((weekday) => <span className="booked-calendar-weekday" role="columnheader" key={weekday}>{weekday}</span>)}
        {cells.map((cell, index) => cell ? (
          <span
            key={cell.dateKey}
            className={`booked-calendar-day${cell.bookingStatus === 'CONFIRMED' ? ' is-booked' : ''}${cell.bookingStatus === 'PENDING' ? ' is-pending' : ''}${cell.dateKey === todayKey ? ' is-today' : ''}`}
            role="gridcell"
            aria-label={`${cell.dateKey}${cell.bookingStatus === 'CONFIRMED' ? ', confirmed booking' : cell.bookingStatus === 'PENDING' ? ', booking pending review' : ', available'}`}
          >
            {cell.day}
          </span>
        ) : <span className="booked-calendar-day is-empty" role="presentation" key={`empty-${index}`} />)}
      </div>
      <div className="booked-calendar-legend"><span><i className="legend-booked" /> Confirmed</span><span><i className="legend-pending" /> Pending review</span><span><i className="legend-available" /> Available</span></div>
      <p className="booked-calendar-note">Confirmed bookings are highlighted. Pending requests are shown separately and also temporarily reserve the scooter.</p>
    </section>
  )
}
