import { Calendar, Clock, Mail, Phone, User, MapPin } from 'lucide-react'

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
    <div>
      {bookings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
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
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="block md:hidden space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-2xl shadow-sm border border-sage-100 overflow-hidden hover:shadow-md transition-shadow">
                {/* Card Header with Time and Status */}
                <div className="bg-gradient-to-r from-sage-50 to-spa-50 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-sage-600" />
                    <span className="font-semibold text-stone-800">{booking.booking_time.substring(0, 5)}</span>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                    {getStatusIcon(booking.status)}
                    <span className="ml-1">{booking.status}</span>
                  </span>
                </div>

                {/* Card Body */}
                <div className="px-4 py-4 space-y-3">
                  {/* Service Info */}
                  <div>
                    <p className="font-medium text-stone-800 text-sm">
                      {booking.service?.name || getServiceInfo(booking.service_uuid || booking.service_id)?.name}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-stone-500">
                        {booking.service?.duration || getServiceInfo(booking.service_uuid || booking.service_id)?.duration} min
                      </span>
                      {booking.staff && (
                        <span className="text-xs text-stone-500">• {booking.staff.name}</span>
                      )}
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3 text-stone-400" />
                      <span className="text-sm text-stone-700">{booking.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3 text-stone-400" />
                      <a href={`mailto:${booking.customer_email}`} className="text-xs text-spa-600 hover:text-spa-700">
                        {booking.customer_email}
                      </a>
                    </div>
                    {booking.customer_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-stone-400" />
                        <a href={`tel:${booking.customer_phone}`} className="text-xs text-stone-600">
                          {booking.customer_phone}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {booking.notes && (
                    <p className="text-xs text-stone-500 italic bg-cream-50 px-2 py-1 rounded-lg">
                      {booking.notes}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {booking.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                          className="flex-1 px-3 py-2 bg-sage-500 text-white text-xs font-medium rounded-xl hover:bg-sage-600 transition-colors"
                        >
                          ✓ Confirm
                        </button>
                        <button
                          onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                          className="flex-1 px-3 py-2 bg-rose-500 text-white text-xs font-medium rounded-xl hover:bg-rose-600 transition-colors"
                        >
                          ✗ Cancel
                        </button>
                      </>
                    )}
                    {booking.status === 'confirmed' && (
                      <>
                        <button
                          onClick={() => updateBookingStatus(booking.id, 'completed')}
                          className="flex-1 px-3 py-2 bg-spa-500 text-white text-xs font-medium rounded-xl hover:bg-spa-600 transition-colors"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => {
                            setSelectedBooking(booking)
                            setRescheduleDate(booking.booking_date)
                            setShowRescheduleModal(true)
                          }}
                          className="px-3 py-2 bg-gold-500 text-white text-xs font-medium rounded-xl hover:bg-gold-600 transition-colors"
                        >
                          ↻
                        </button>
                        <button
                          onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                          className="px-3 py-2 bg-rose-500 text-white text-xs font-medium rounded-xl hover:bg-rose-600 transition-colors"
                        >
                          ✗
                        </button>
                      </>
                    )}
                    {booking.status === 'cancelled' && (
                      <button
                        onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                        className="flex-1 px-3 py-2 bg-sage-500 text-white text-xs font-medium rounded-xl hover:bg-sage-600 transition-colors"
                      >
                        ↺ Reconfirm
                      </button>
                    )}
                    {booking.status === 'completed' && (
                      <span className="flex-1 text-center px-3 py-2 bg-stone-100 text-stone-600 text-xs font-medium rounded-xl">
                        ✓ Completed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
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
          </div>
        </>
      )}
    </div>
  )
}