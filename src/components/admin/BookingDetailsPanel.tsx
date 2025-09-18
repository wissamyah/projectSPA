import { Eye, Package, Clock, User, Mail, Phone } from 'lucide-react'

interface BookingDetailsPanelProps {
  selectedBooking: any
  getStatusColor: (status: string) => string
  getStatusIcon: (status: string) => React.ReactNode
  getServiceInfo: (serviceId: string | null) => any
  updateBookingStatus: (bookingId: string, status: string) => void
  setSelectedBooking: (booking: any) => void
  setRescheduleDate: (date: string) => void
  setShowRescheduleModal: (show: boolean) => void
}

export const BookingDetailsPanel = ({
  selectedBooking,
  getStatusColor,
  getStatusIcon,
  getServiceInfo,
  updateBookingStatus,
  setSelectedBooking,
  setRescheduleDate,
  setShowRescheduleModal,
}: BookingDetailsPanelProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
        <Eye className="h-5 w-5 mr-2 text-slate-600" />
        Booking Details
      </h3>

      {selectedBooking ? (
        <div className="space-y-4">
          {/* Status Card */}
          <div className={`p-4 rounded-xl border-2 ${getStatusColor(selectedBooking.status)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getStatusIcon(selectedBooking.status)}
                <span className="font-semibold capitalize text-lg">{selectedBooking.status}</span>
              </div>
              <span className="text-xs opacity-75">ID: {selectedBooking.id.slice(0,8)}</span>
            </div>
          </div>

          {/* Service Info */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-4">
            <div className="flex items-start justify-between mb-2">
              <Package className="h-5 w-5 text-slate-600 mt-0.5" />
              <span className="text-xs text-slate-500">
                {selectedBooking.service?.duration ||
                 getServiceInfo(selectedBooking.service_uuid || selectedBooking.service_id)?.duration} min
              </span>
            </div>
            <p className="font-semibold text-slate-900">
              {selectedBooking.service?.name ||
               getServiceInfo(selectedBooking.service_uuid || selectedBooking.service_id)?.name}
            </p>
            {selectedBooking.staff && (
              <div className="flex items-center mt-2 text-sm text-slate-600">
                <User className="h-3 w-3 mr-1" />
                {selectedBooking.staff.name}
              </div>
            )}
          </div>

          {/* Time Slot */}
          <div className="flex items-center space-x-3 bg-blue-50 rounded-xl p-4">
            <Clock className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm text-blue-600 font-medium">Appointment Time</p>
              <p className="text-lg font-bold text-blue-900">{selectedBooking.booking_time.substring(0, 5)}</p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="border border-slate-200 rounded-xl p-4">
            <div className="flex items-center mb-3">
              <User className="h-5 w-5 text-slate-600 mr-2" />
              <p className="font-semibold text-slate-900">{selectedBooking.customer_name}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-slate-600">
                <Mail className="h-3 w-3 mr-2 text-slate-400" />
                <a href={`mailto:${selectedBooking.customer_email}`} className="hover:text-blue-600">
                  {selectedBooking.customer_email}
                </a>
              </div>
              {selectedBooking.customer_phone && (
                <div className="flex items-center text-sm text-slate-600">
                  <Phone className="h-3 w-3 mr-2 text-slate-400" />
                  <a href={`tel:${selectedBooking.customer_phone}`} className="hover:text-blue-600">
                    {selectedBooking.customer_phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {selectedBooking.notes && (
            <div>
              <p className="text-sm text-slate-600">Notes</p>
              <p className="mt-1 p-3 bg-slate-50 rounded-lg text-sm text-slate-700">
                {selectedBooking.notes}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-4 border-t border-slate-200">
            {selectedBooking.status === 'pending' && (
              <>
                <button
                  onClick={() => updateBookingStatus(selectedBooking.id, 'confirmed')}
                  className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors font-medium"
                >
                  Confirm Booking
                </button>
                <button
                  onClick={() => updateBookingStatus(selectedBooking.id, 'cancelled')}
                  className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors font-medium"
                >
                  Cancel Booking
                </button>
              </>
            )}
            {selectedBooking.status === 'confirmed' && (
              <>
                <button
                  onClick={() => updateBookingStatus(selectedBooking.id, 'completed')}
                  className="w-full bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 transition-colors font-medium"
                >
                  Mark as Completed
                </button>
                <button
                  onClick={() => {
                    setSelectedBooking(selectedBooking)
                    setRescheduleDate(selectedBooking.booking_date)
                    setShowRescheduleModal(true)
                  }}
                  className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  Reschedule
                </button>
                <button
                  onClick={() => updateBookingStatus(selectedBooking.id, 'cancelled')}
                  className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors font-medium"
                >
                  Cancel Booking
                </button>
              </>
            )}
            {selectedBooking.status === 'cancelled' && (
              <button
                onClick={() => updateBookingStatus(selectedBooking.id, 'confirmed')}
                className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors font-medium"
              >
                Reconfirm Booking
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-slate-50 rounded-full">
              <Calendar className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-slate-500">Select a booking to view details</p>
            <p className="text-xs text-slate-400">Click on any time slot with a booking</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Missing import fix
import { Calendar } from 'lucide-react'