import { Booking, Staff } from '../../../types/schedule'
import { formatLocalDate, getServiceColor, getDaysInView } from '../../../utils/scheduleHelpers'

interface WeeklyScheduleGridProps {
  bookings: Booking[]
  staffToShow: Staff[]
  selectedDate: Date
  loading: boolean
}

const WeeklyScheduleGrid = ({ bookings, staffToShow, selectedDate, loading }: WeeklyScheduleGridProps) => {
  const daysInView = getDaysInView(selectedDate, 'weekly')

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sage-600"></div>
        <p className="mt-4 text-stone-600">Loading schedule...</p>
      </div>
    )
  }

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-stone-50 border-b">
              <th className="text-left p-4 font-light text-stone-700 sticky left-0 bg-stone-50">
                Staff
              </th>
              {daysInView.map(day => {
                const isToday = formatLocalDate(day) === formatLocalDate(new Date())
                return (
                  <th
                    key={formatLocalDate(day)}
                    className={`text-center p-4 font-light text-stone-700 min-w-[150px] ${
                      isToday ? 'bg-spa-50' : ''
                    }`}
                  >
                    <div className={isToday ? 'text-spa-700 font-normal' : ''}>
                      {day.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className={`text-sm ${isToday ? 'text-spa-600' : ''}`}>
                      {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {isToday && <span className="ml-1 text-xs">(Today)</span>}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {staffToShow.map(staff => (
              <tr key={staff.id} className="border-b hover:bg-stone-50 transition-colors">
                <td className="p-4 font-light text-stone-700 sticky left-0 bg-white">
                  {staff.name}
                </td>
                {daysInView.map(day => {
                  const dayBookings = bookings.filter(b => {
                    const matchesStaff = b.staff?.id === staff.id || b.staff_id === staff.id
                    return matchesStaff && b.booking_date === formatLocalDate(day)
                  })
                  return (
                    <td key={formatLocalDate(day)} className="p-2 align-top">
                      <div className="space-y-2">
                        {dayBookings.map(booking => (
                          <div
                            key={booking.id}
                            className={`p-2 rounded-lg border text-xs ${getServiceColor(
                              booking.service?.name || ''
                            )}`}
                          >
                            <div className="font-semibold">
                              {booking.booking_time.substring(0, 5)}
                            </div>
                            <div>{booking.service?.name}</div>
                            <div className="truncate">{booking.customer_name}</div>
                          </div>
                        ))}
                        {dayBookings.length === 0 && (
                          <div className="text-center text-stone-400 py-4">-</div>
                        )}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default WeeklyScheduleGrid