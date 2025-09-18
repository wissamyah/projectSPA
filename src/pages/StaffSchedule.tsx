import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Calendar, Clock, User, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'

interface Booking {
  id: string
  booking_date: string
  booking_time: string
  customer_name: string
  status: string
  service: any
}

interface Staff {
  id: string
  name: string
  email: string
}

const StaffSchedule = () => {
  const { staffId } = useParams()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [staff, setStaff] = useState<Staff | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    fetchData()

    // Auto-refresh every 5 minutes
    const interval = autoRefresh ? setInterval(fetchData, 5 * 60 * 1000) : null

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [staffId, selectedDate, autoRefresh])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch staff info
      const { data: staffData } = await supabase
        .from('staff')
        .select('*')
        .eq('id', staffId)
        .single()

      if (staffData) setStaff(staffData)

      // Get week range
      const weekStart = getWeekStart(selectedDate)
      const weekEnd = getWeekEnd(selectedDate)

      // Format dates in local timezone to avoid date shifting
      const formatLocalDate = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }

      // Fetch bookings for the week
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select(`
          *,
          service:service_uuid(name, duration, price)
        `)
        .eq('staff_id', staffId)
        .gte('booking_date', formatLocalDate(weekStart))
        .lte('booking_date', formatLocalDate(weekEnd))
        .neq('status', 'cancelled')
        .order('booking_date')
        .order('booking_time')

      if (bookingsData) setBookings(bookingsData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getWeekStart = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day
    d.setDate(diff)
    d.setHours(0, 0, 0, 0)
    return d
  }

  const getWeekEnd = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + 6
    d.setDate(diff)
    d.setHours(23, 59, 59, 999)
    return d
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    setSelectedDate(newDate)
  }

  const getDaysInWeek = () => {
    const days = []
    const start = getWeekStart(selectedDate)
    for (let i = 0; i < 7; i++) {
      const day = new Date(start)
      day.setDate(start.getDate() + i)
      days.push(day)
    }
    return days
  }

  const getBookingsForDay = (date: Date) => {
    // Format date in local timezone to match database format
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    return bookings.filter(b => b.booking_date === dateStr)
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isCurrentTime = (time: string) => {
    const now = new Date()
    const [hours, minutes] = time.split(':').map(Number)
    return now.getHours() === hours && now.getMinutes() >= minutes && now.getMinutes() < minutes + 30
  }

  const getServiceColor = (index: number) => {
    const colors = [
      'bg-blue-100 border-blue-300 text-blue-900',
      'bg-green-100 border-green-300 text-green-900',
      'bg-purple-100 border-purple-300 text-purple-900',
      'bg-pink-100 border-pink-300 text-pink-900',
      'bg-yellow-100 border-yellow-300 text-yellow-900'
    ]
    return colors[index % colors.length]
  }

  const daysInWeek = getDaysInWeek()

  if (loading && !staff) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700"></div>
          <p className="mt-4 text-slate-600">Loading schedule...</p>
        </div>
      </div>
    )
  }

  if (!staff) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Staff member not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="h-8 w-8 text-slate-600" />
              <div>
                <h1 className="text-xl font-bold text-slate-900">{staff.name}'s Schedule</h1>
                <p className="text-sm text-slate-600">Week View</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchData}
                className="p-2 hover:bg-slate-100 rounded-lg"
                title="Refresh"
              >
                <RefreshCw className="h-5 w-5 text-slate-600" />
              </button>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                Auto-refresh
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 hover:bg-slate-100 rounded-lg"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="text-center">
              <div className="font-semibold text-slate-900">
                {getWeekStart(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} -
                {' '}{getWeekEnd(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 hover:bg-slate-100 rounded-lg"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div className="flex justify-center mt-2">
            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm"
            >
              Current Week
            </button>
          </div>
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {daysInWeek.map((day, index) => {
            const dayBookings = getBookingsForDay(day)
            const isCurrentDay = isToday(day)

            return (
              <div
                key={day.toISOString()}
                className={`bg-white rounded-lg shadow-sm ${isCurrentDay ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className={`p-3 border-b ${isCurrentDay ? 'bg-blue-50' : 'bg-slate-50'}`}>
                  <div className="font-semibold text-slate-900">
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="text-sm text-slate-600">
                    {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  {isCurrentDay && (
                    <div className="text-xs text-blue-600 font-semibold mt-1">TODAY</div>
                  )}
                </div>

                <div className="p-3 space-y-2 min-h-[200px]">
                  {dayBookings.length === 0 ? (
                    <div className="text-center text-slate-400 py-8">
                      <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No appointments</p>
                    </div>
                  ) : (
                    dayBookings.map((booking, bookingIndex) => {
                      const isCurrent = isCurrentDay && isCurrentTime(booking.booking_time)

                      return (
                        <div
                          key={booking.id}
                          className={`p-3 rounded-lg border-2 ${getServiceColor(bookingIndex)} ${
                            isCurrent ? 'ring-2 ring-green-500 animate-pulse' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-3 w-3" />
                            <span className="font-semibold text-sm">
                              {booking.booking_time.substring(0, 5)}
                            </span>
                            {isCurrent && (
                              <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                                NOW
                              </span>
                            )}
                          </div>
                          <div className="text-sm font-medium">{booking.service?.name}</div>
                          <div className="text-xs opacity-75 mt-1">{booking.customer_name}</div>
                          <div className="text-xs opacity-60">{booking.service?.duration}min</div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Daily Summary */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Week Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-slate-600 text-sm">Total Appointments</div>
              <div className="text-2xl font-bold text-slate-900">{bookings.length}</div>
            </div>
            <div>
              <div className="text-slate-600 text-sm">Today's Appointments</div>
              <div className="text-2xl font-bold text-slate-900">
                {getBookingsForDay(new Date()).length}
              </div>
            </div>
            <div>
              <div className="text-slate-600 text-sm">Busiest Day</div>
              <div className="text-lg font-bold text-slate-900">
                {(() => {
                  let maxDay = daysInWeek[0]
                  let maxCount = 0
                  daysInWeek.forEach(day => {
                    const count = getBookingsForDay(day).length
                    if (count > maxCount) {
                      maxCount = count
                      maxDay = day
                    }
                  })
                  return maxDay.toLocaleDateString('en-US', { weekday: 'short' })
                })()}
              </div>
            </div>
            <div>
              <div className="text-slate-600 text-sm">Average/Day</div>
              <div className="text-2xl font-bold text-slate-900">
                {(bookings.length / 7).toFixed(1)}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-500">
          <p>This schedule updates automatically every 5 minutes</p>
          <p className="mt-1">Bookmark this page for easy access</p>
        </div>
      </div>
    </div>
  )
}

export default StaffSchedule