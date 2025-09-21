import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Calendar, Clock, User, ChevronLeft, ChevronRight, RefreshCw, CheckCircle, AlertCircle, Flower2 } from 'lucide-react'

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-sage-50 border-sage-300 text-sage-900'
      case 'pending':
        return 'bg-gold-50 border-gold-300 text-gold-900'
      case 'completed':
        return 'bg-spa-50 border-spa-300 text-spa-900'
      default:
        return 'bg-cream-100 border-stone-300 text-stone-900'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-3 w-3 text-sage-600" />
      case 'pending':
        return <AlertCircle className="h-3 w-3 text-gold-600" />
      default:
        return null
    }
  }

  const daysInWeek = getDaysInWeek()

  if (loading && !staff) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-sage-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center space-x-2">
            <div className="w-2 h-2 bg-sage-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-sage-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-sage-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <p className="mt-4 text-stone-600">Loading schedule...</p>
        </div>
      </div>
    )
  }

  if (!staff) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-sage-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone-600">Staff member not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-sage-50">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-r from-sage-50 via-spa-50 to-rose-50 shadow-sm border-b border-sage-200 sticky top-0 z-10">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-10 w-32 h-32 bg-sage-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
          <div className="absolute bottom-0 right-10 w-32 h-32 bg-rose-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        </div>
        <div className="relative container mx-auto px-4 py-4 md:py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="p-2.5 md:p-3 bg-white/80 backdrop-blur-sm rounded-xl flex-shrink-0">
                <Flower2 className="h-5 w-5 md:h-6 md:w-6 text-sage-600" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-light text-stone-800">
                  <span className="font-normal">{staff.name}</span>
                  <span className="hidden sm:inline">'s Schedule</span>
                </h1>
                <p className="text-xs md:text-sm text-stone-600">Weekly Appointment View</p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={fetchData}
                className="p-2 md:p-2.5 bg-white/80 hover:bg-white rounded-xl transition-all shadow-sm"
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4 md:h-5 md:w-5 text-sage-600" />
              </button>
              <label className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-stone-600 bg-white/80 backdrop-blur-sm px-3 md:px-4 py-1.5 md:py-2 rounded-xl">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="h-3 w-3 md:h-4 md:w-4 rounded text-sage-600 focus:ring-sage-500"
                />
                <span className="hidden sm:inline">Auto-refresh</span>
                <span className="sm:hidden">Auto</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-sage-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2.5 hover:bg-sage-50 rounded-xl transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-stone-600" />
            </button>
            <div className="text-center">
              <div className="text-lg font-medium text-stone-800">
                {getWeekStart(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} -
                {' '}{getWeekEnd(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2.5 hover:bg-sage-50 rounded-xl transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-stone-600" />
            </button>
          </div>
          <div className="flex justify-center mt-3">
            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-4 py-2 bg-gradient-to-r from-sage-100 to-spa-100 text-stone-700 rounded-xl hover:from-sage-200 hover:to-spa-200 transition-all text-sm font-medium"
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
                className={`bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow ${isCurrentDay ? 'ring-2 ring-sage-400' : ''}`}
              >
                <div className={`p-3 border-b ${isCurrentDay ? 'bg-gradient-to-r from-sage-50 to-spa-50' : 'bg-gradient-to-r from-cream-50 to-white'} rounded-t-2xl`}>
                  <div className="font-semibold text-stone-800">
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="text-sm text-stone-600">
                    {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  {isCurrentDay && (
                    <div className="text-xs text-sage-600 font-semibold mt-1">TODAY</div>
                  )}
                </div>

                <div className="p-3 space-y-2 min-h-[200px]">
                  {dayBookings.length === 0 ? (
                    <div className="text-center text-stone-400 py-8">
                      <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No appointments</p>
                    </div>
                  ) : (
                    dayBookings.map((booking, bookingIndex) => {
                      const isCurrent = isCurrentDay && isCurrentTime(booking.booking_time)

                      return (
                        <div
                          key={booking.id}
                          className={`p-3 rounded-xl border-2 ${getStatusColor(booking.status)} ${
                            isCurrent ? 'ring-2 ring-spa-500 shadow-lg scale-105' : ''
                          } transition-all`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(booking.status)}
                              <Clock className="h-3 w-3" />
                              <span className="font-semibold text-sm">
                                {booking.booking_time.substring(0, 5)}
                              </span>
                            </div>
                            {isCurrent && (
                              <span className="text-xs bg-spa-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                                NOW
                              </span>
                            )}
                          </div>
                          <div className="text-sm font-medium">{booking.service?.name}</div>
                          <div className="text-xs opacity-75 mt-1">{booking.customer_name}</div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs opacity-60">{booking.service?.duration}min</span>
                            <span className="text-xs px-2 py-0.5 bg-white/60 rounded-full capitalize">
                              {booking.status}
                            </span>
                          </div>
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
        <div className="mt-8 bg-white rounded-2xl shadow-sm p-6 border border-sage-100">
          <h2 className="text-lg font-medium text-stone-800 mb-6 flex items-center">
            <div className="p-2 bg-gradient-to-r from-sage-100 to-spa-100 rounded-xl mr-3">
              <Calendar className="h-5 w-5 text-sage-600" />
            </div>
            Week Summary
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-sage-50 to-sage-100 rounded-xl p-4">
              <div className="text-stone-600 text-sm">Total Appointments</div>
              <div className="text-2xl font-bold text-sage-700">{bookings.length}</div>
            </div>
            <div className="bg-gradient-to-br from-spa-50 to-spa-100 rounded-xl p-4">
              <div className="text-stone-600 text-sm">Today's Appointments</div>
              <div className="text-2xl font-bold text-spa-700">
                {getBookingsForDay(new Date()).length}
              </div>
            </div>
            <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl p-4">
              <div className="text-stone-600 text-sm">Busiest Day</div>
              <div className="text-lg font-bold text-rose-700">
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
            <div className="bg-gradient-to-br from-gold-50 to-gold-100 rounded-xl p-4">
              <div className="text-stone-600 text-sm">Average/Day</div>
              <div className="text-2xl font-bold text-gold-700">
                {(bookings.length / 7).toFixed(1)}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-stone-500 pb-8">
          <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-sage-200">
            <Flower2 className="h-4 w-4 text-sage-600 mr-2" />
            <span>This schedule updates automatically every 5 minutes</span>
          </div>
          <p className="mt-2">Bookmark this page for easy access</p>
        </div>
      </div>
    </div>
  )
}

export default StaffSchedule