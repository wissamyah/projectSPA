import { XCircle } from 'lucide-react'

interface RescheduleModalProps {
  showRescheduleModal: boolean
  selectedBooking: any
  rescheduleDate: string
  setRescheduleDate: (date: string) => void
  rescheduleTime: string
  setRescheduleTime: (time: string) => void
  availableSlots: string[]
  checkingAvailability: boolean
  rescheduleReason: string
  setRescheduleReason: (reason: string) => void
  setShowRescheduleModal: (show: boolean) => void
  handleReschedule: () => void
  formatDate: (date: string) => string
  getServiceInfo: (serviceId: string | null) => any
}

export const RescheduleModal = ({
  showRescheduleModal,
  selectedBooking,
  rescheduleDate,
  setRescheduleDate,
  rescheduleTime,
  setRescheduleTime,
  availableSlots,
  checkingAvailability,
  rescheduleReason,
  setRescheduleReason,
  setShowRescheduleModal,
  handleReschedule,
  formatDate,
  getServiceInfo
}: RescheduleModalProps) => {
  if (!showRescheduleModal || !selectedBooking) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Reschedule Appointment
          </h3>
          <button
            onClick={() => {
              setShowRescheduleModal(false)
              setRescheduleDate('')
              setRescheduleTime('')
              setRescheduleReason('')
            }}
            className="text-slate-500 hover:text-slate-700"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        {/* Current Booking Info */}
        <div className="bg-slate-50 p-4 rounded-lg mb-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-2">Current Booking</h4>
          <div className="space-y-1 text-sm">
            <p><strong>Customer:</strong> {selectedBooking.customer_name}</p>
            <p><strong>Service:</strong> {selectedBooking.service?.name || getServiceInfo(selectedBooking.service_uuid || selectedBooking.service_id)?.name}</p>
            <p><strong>Date:</strong> {formatDate(selectedBooking.booking_date)}</p>
            <p><strong>Time:</strong> {selectedBooking.booking_time.substring(0, 5)}</p>
            {selectedBooking.staff && (
              <p><strong>Staff:</strong> {selectedBooking.staff.name}</p>
            )}
          </div>
        </div>

        {/* New Date Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            New Date
          </label>
          <input
            type="date"
            value={rescheduleDate}
            onChange={(e) => {
              setRescheduleDate(e.target.value)
              setRescheduleTime('') // Reset time when date changes
            }}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
          />
        </div>

        {/* Available Time Slots */}
        {rescheduleDate && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Available Time Slots
              {checkingAvailability && (
                <span className="text-slate-500 ml-2">(Checking availability...)</span>
              )}
            </label>

            {!checkingAvailability && availableSlots.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  No available time slots for this date. Please select another date.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                {availableSlots.map(time => (
                  <button
                    key={time}
                    onClick={() => setRescheduleTime(time)}
                    className={`
                      px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${rescheduleTime === time
                        ? 'bg-slate-700 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    {time}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reason for Rescheduling */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Reason for Rescheduling (Optional)
          </label>
          <textarea
            value={rescheduleReason}
            onChange={(e) => setRescheduleReason(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
            rows={3}
            placeholder="E.g., Staff unavailable, Schedule conflict, Customer request..."
          />
        </div>

        {/* Customer Notification */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-xs text-blue-800">
            <strong>Note:</strong> The customer will receive an email notification about this change at {selectedBooking.customer_email}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleReschedule}
            disabled={!rescheduleDate || !rescheduleTime || checkingAvailability}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm Reschedule
          </button>
          <button
            onClick={() => {
              setShowRescheduleModal(false)
              setRescheduleDate('')
              setRescheduleTime('')
              setRescheduleReason('')
            }}
            className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}