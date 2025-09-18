import { Staff, Booking } from '../../../types/schedule'
import { getPrintDateRange, getBookingsByStaff } from '../../../utils/scheduleHelpers'

interface PrintScheduleProps {
  selectedDate: Date
  viewMode: 'daily' | 'weekly'
  selectedStaff: string
  staffMembers: Staff[]
  staffToShow: Staff[]
  bookings: Booking[]
}

const PrintSchedule = ({
  selectedDate,
  viewMode,
  selectedStaff,
  staffMembers,
  staffToShow,
  bookings
}: PrintScheduleProps) => {
  const bookingsByStaff = getBookingsByStaff(bookings, staffToShow)

  return (
    <>
      {/* Print Header - Only visible when printing */}
      <div className="hidden print:block mb-6">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold">Staff Schedule Report</h1>
          <p className="text-sm text-gray-600 mt-1">
            {getPrintDateRange(selectedDate, viewMode)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Generated on{' '}
            {new Date().toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
        {selectedStaff !== 'all' && (
          <div className="text-center mb-2">
            <p className="text-sm font-semibold">
              Staff: {staffMembers.find(s => s.id === selectedStaff)?.name}
            </p>
          </div>
        )}
        <div className="border-t pt-4"></div>
      </div>

      {/* Print-specific Schedule Layout */}
      <div className="hidden print:block mt-4">
        {staffToShow.map((staff, staffIndex) => (
          <div key={staff.id} className={`${staffIndex > 0 ? 'mt-6' : ''}`}>
            <div className="border-b-2 border-gray-800 pb-1 mb-3">
              <h2 className="text-lg font-bold">{staff.name}</h2>
              <p className="text-sm text-gray-600">{staff.email}</p>
            </div>

            {bookingsByStaff[staff.id] && bookingsByStaff[staff.id].length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-2 pr-4 text-sm font-semibold w-24">Date</th>
                    <th className="text-left pb-2 pr-4 text-sm font-semibold w-20">Time</th>
                    <th className="text-left pb-2 pr-4 text-sm font-semibold">Service</th>
                    <th className="text-left pb-2 pr-4 text-sm font-semibold">Customer</th>
                    <th className="text-left pb-2 pr-4 text-sm font-semibold w-24">Phone</th>
                    <th className="text-left pb-2 text-sm font-semibold w-20">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookingsByStaff[staff.id].map((booking, index) => (
                    <tr key={booking.id} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="py-1.5 pr-4 text-sm">
                        {new Date(booking.booking_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          weekday: 'short'
                        })}
                      </td>
                      <td className="py-1.5 pr-4 text-sm font-medium">
                        {booking.booking_time.substring(0, 5)}
                      </td>
                      <td className="py-1.5 pr-4 text-sm">
                        {booking.service?.name || 'Unknown Service'}
                        {booking.service?.duration && ` (${booking.service.duration}min)`}
                      </td>
                      <td className="py-1.5 pr-4 text-sm font-medium">{booking.customer_name}</td>
                      <td className="py-1.5 pr-4 text-sm">{booking.customer_phone || '-'}</td>
                      <td className="py-1.5 text-sm">
                        <span
                          className={`
                            ${booking.status === 'confirmed' ? 'text-green-700 font-semibold' : ''}
                            ${booking.status === 'pending' ? 'text-yellow-700 font-semibold' : ''}
                            ${booking.status === 'cancelled' ? 'text-red-700 line-through' : ''}
                          `}
                        >
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-4 text-center text-gray-500 italic">No appointments scheduled</div>
            )}

            <div className="mt-2 text-xs text-gray-600 border-t pt-2">
              Total appointments: {bookingsByStaff[staff.id]?.length || 0}
            </div>
          </div>
        ))}

        {/* Print Footer Summary */}
        <div className="mt-8 pt-4 border-t-2 border-gray-800">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-semibold">Total Appointments:</span> {bookings.length}
            </div>
            <div>
              <span className="font-semibold">Total Staff:</span> {staffToShow.length}
            </div>
            <div>
              <span className="font-semibold">Average per Staff:</span>{' '}
              {staffToShow.length > 0 ? (bookings.length / staffToShow.length).toFixed(1) : 0}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default PrintSchedule