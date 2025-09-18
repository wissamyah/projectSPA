import { Calendar, Clock } from 'lucide-react'

interface ListViewProps {
  bookings: any[]
  getServiceInfo: (serviceId: string | null) => any
  getStatusColor: (status: string) => string
  getStatusIcon: (status: string) => React.ReactNode
  updateBookingStatus: (bookingId: string, status: string) => void
  setSelectedBooking: (booking: any) => void
  setRescheduleDate: (date: string) => void
  setShowRescheduleModal: (show: boolean) => void
}

export const ListView = ({
  bookings,
  getServiceInfo,
  getStatusColor,
  getStatusIcon,
  updateBookingStatus,
  setSelectedBooking,
  setRescheduleDate,
  setShowRescheduleModal,
}: ListViewProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {bookings.length === 0 ? (
        <div className="p-16 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-slate-50 rounded-full">
              <Calendar className="h-8 w-8 text-slate-400" />
            </div>
            <div>
              <p className="text-slate-600 font-medium">No bookings for this date</p>
              <p className="text-sm text-slate-400 mt-1">Bookings will appear here when scheduled</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {bookings.map((booking, idx) => (
                <tr key={booking.id} className={`hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm font-medium text-slate-900">
                      <Clock className="h-4 w-4 mr-2" />
                      {booking.booking_time.substring(0, 5)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-900">
                      {booking.service?.name ||
                       getServiceInfo(booking.service_uuid || booking.service_id)?.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {booking.service?.duration ||
                       getServiceInfo(booking.service_uuid || booking.service_id)?.duration} minutes
                    </div>
                    {booking.staff && (
                      <div className="text-xs text-slate-500">
                        with {booking.staff.name}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-900">{booking.customer_name}</div>
                    {booking.notes && (
                      <div className="text-xs text-slate-500 truncate max-w-xs">
                        {booking.notes}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm space-y-1">
                      <a href={`mailto:${booking.customer_email}`} className="text-blue-600 hover:text-blue-900 block">
                        {booking.customer_email}
                      </a>
                      {booking.customer_phone && (
                        <a href={`tel:${booking.customer_phone}`} className="text-slate-600 hover:text-slate-900 block">
                          {booking.customer_phone}
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        <span className="ml-1.5">{booking.status}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {booking.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                            className="px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full hover:bg-green-600 transition-colors shadow-sm hover:shadow-md"
                          >
                            ✓ Confirm
                          </button>
                          <button
                            onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                            className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-full hover:bg-red-600 transition-colors shadow-sm hover:shadow-md"
                          >
                            ✗ Cancel
                          </button>
                        </>
                      )}
                      {booking.status === 'confirmed' && (
                        <>
                          <button
                            onClick={() => updateBookingStatus(booking.id, 'completed')}
                            className="px-3 py-1 bg-purple-500 text-white text-xs font-medium rounded-full hover:bg-purple-600 transition-colors shadow-sm hover:shadow-md"
                          >
                            ✓ Complete
                          </button>
                          <button
                            onClick={() => {
                              setSelectedBooking(booking)
                              setRescheduleDate(booking.booking_date)
                              setShowRescheduleModal(true)
                            }}
                            className="px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-full hover:bg-blue-600 transition-colors shadow-sm hover:shadow-md"
                          >
                            ↻ Reschedule
                          </button>
                          <button
                            onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                            className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-full hover:bg-red-600 transition-colors shadow-sm hover:shadow-md"
                          >
                            ✗ Cancel
                          </button>
                        </>
                      )}
                      {booking.status === 'cancelled' && (
                        <button
                          onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                          className="px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full hover:bg-green-600 transition-colors shadow-sm hover:shadow-md"
                        >
                          ↺ Reconfirm
                        </button>
                      )}
                      {booking.status === 'completed' && (
                        <span className="px-3 py-1 bg-gray-200 text-gray-600 text-xs font-medium rounded-full">
                          ✓ Completed
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}