import { Booking, Staff } from '../../../types/schedule'
import { getTimeSlots, getBookingForSlot, formatLocalDate, getServiceColor } from '../../../utils/scheduleHelpers'

interface DailyScheduleGridProps {
  bookings: Booking[]
  staffToShow: Staff[]
  selectedDate: Date
  loading: boolean
}

const DailyScheduleGrid = ({ bookings, staffToShow, selectedDate, loading }: DailyScheduleGridProps) => {
  const timeSlots = getTimeSlots()

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
                Time
              </th>
              {staffToShow.map(staff => (
                <th key={staff.id} className="text-left p-4 font-light text-stone-700 min-w-[200px]">
                  {staff.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map(time => (
              <tr key={time} className="border-b hover:bg-stone-50 transition-colors">
                <td className="p-4 font-light text-stone-600 sticky left-0 bg-white">
                  {time}
                </td>
                {staffToShow.map(staff => {
                  const booking = getBookingForSlot(
                    bookings,
                    staff.id,
                    formatLocalDate(selectedDate),
                    time
                  )
                  return (
                    <td key={staff.id} className="p-2">
                      {booking && (
                        <div className={`p-3 rounded-lg border-2 ${getServiceColor(booking.service?.name || '')}`}>
                          <div className="font-semibold text-sm">{booking.service?.name}</div>
                          <div className="text-xs mt-1">{booking.customer_name}</div>
                          <div className="text-xs opacity-75">{booking.service?.duration}min</div>
                        </div>
                      )}
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

export default DailyScheduleGrid