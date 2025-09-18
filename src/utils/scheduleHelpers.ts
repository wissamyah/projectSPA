import { Booking } from '../types/schedule'

// Date formatting helpers
export const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const formatDateHeader = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

export const getWeekStart = (date: Date): Date => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day
  d.setDate(diff)
  return d
}

export const getWeekEnd = (date: Date): Date => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + 6
  d.setDate(diff)
  return d
}

// Time slot helpers
export const getTimeSlots = (): string[] => {
  const slots = []
  for (let hour = 9; hour < 18; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`)
    slots.push(`${hour.toString().padStart(2, '0')}:30`)
  }
  return slots
}

// Booking helpers
export const getBookingForSlot = (
  bookings: Booking[],
  staffId: string,
  date: string,
  time: string
): Booking | undefined => {
  return bookings.find(b => {
    const matchesStaff = b.staff?.id === staffId || b.staff_id === staffId
    const matchesDateTime = b.booking_date === date &&
                           b.booking_time.startsWith(time.substring(0, 5))
    return matchesStaff && matchesDateTime
  })
}

// Service color helper
export const getServiceColor = (serviceName: string): string => {
  const colors = [
    'bg-blue-100 border-blue-300 text-blue-900',
    'bg-green-100 border-green-300 text-green-900',
    'bg-purple-100 border-purple-300 text-purple-900',
    'bg-pink-100 border-pink-300 text-pink-900',
    'bg-yellow-100 border-yellow-300 text-yellow-900',
    'bg-indigo-100 border-indigo-300 text-indigo-900'
  ]

  let hash = 0
  for (let i = 0; i < serviceName.length; i++) {
    hash = serviceName.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

// Get days in view for weekly view
export const getDaysInView = (selectedDate: Date, viewMode: 'daily' | 'weekly'): Date[] => {
  if (viewMode === 'daily') return [selectedDate]

  const days = []
  const start = getWeekStart(selectedDate)
  for (let i = 0; i < 7; i++) {
    const day = new Date(start)
    day.setDate(start.getDate() + i)
    days.push(day)
  }
  return days
}

// Print date range helper
export const getPrintDateRange = (selectedDate: Date, viewMode: 'daily' | 'weekly'): string => {
  if (viewMode === 'daily') {
    return formatDateHeader(selectedDate)
  } else {
    const start = getWeekStart(selectedDate)
    const end = getWeekEnd(selectedDate)
    return `${start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })} - ${end.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })}`
  }
}

// Organize bookings by staff
export const getBookingsByStaff = (
  bookings: Booking[],
  staffToShow: { id: string; name: string; email: string }[]
): { [key: string]: Booking[] } => {
  const bookingsByStaff: { [key: string]: Booking[] } = {}

  staffToShow.forEach(staff => {
    bookingsByStaff[staff.id] = bookings.filter(b => {
      const matchesStaff = b.staff?.id === staff.id || b.staff_id === staff.id
      return matchesStaff
    }).sort((a, b) => {
      if (a.booking_date === b.booking_date) {
        return a.booking_time.localeCompare(b.booking_time)
      }
      return a.booking_date.localeCompare(b.booking_date)
    })
  })

  return bookingsByStaff
}