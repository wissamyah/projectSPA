import { Clock, ChevronLeft, ChevronRight } from 'lucide-react'

interface TimeSlotGridProps {
  selectedDate: string
  setSelectedDate: (date: string) => void
  displayTimeSlots: string[]
  bookings: any[]
  getBookingsForSlot: (time: string) => any[]
  isOutsideBusinessHours: (time: string) => boolean
  getStatusIcon: (status: string) => React.ReactNode
  getServiceInfo: (serviceId: string | null) => any
  setSelectedBooking: (booking: any) => void
  changeDate: (direction: number) => void
  goToToday: () => void
}

export const TimeSlotGrid = ({
  selectedDate,
  setSelectedDate,
  displayTimeSlots,
  bookings,
  getBookingsForSlot,
  isOutsideBusinessHours,
  getStatusIcon,
  getServiceInfo,
  setSelectedBooking,
  changeDate,
  goToToday
}: TimeSlotGridProps) => {
  return (
    <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-4 lg:p-6">
      {/* Date Navigation Header - Desktop */}
      <div className="hidden lg:flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => changeDate(-1)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Previous day"
          >
            <ChevronLeft className="h-5 w-5 text-slate-600" />
          </button>

          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-800">
              {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' })}
            </h2>
            <p className="text-sm text-slate-600">
              {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <button
            onClick={() => changeDate(1)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Next day"
          >
            <ChevronRight className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
          >
            Today
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Date Navigation Header - Mobile */}
      <div className="lg:hidden space-y-3 mb-4 pb-4 border-b border-slate-200">
        {/* Current Date Display */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => changeDate(-1)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Previous day"
          >
            <ChevronLeft className="h-5 w-5 text-slate-600" />
          </button>

          <div className="text-center flex-1">
            <h2 className="text-lg font-bold text-slate-800">
              {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short' })}, {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </h2>
            <p className="text-xs text-slate-600">
              {new Date(selectedDate).getFullYear()}
            </p>
          </div>

          <button
            onClick={() => changeDate(1)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Next day"
          >
            <ChevronRight className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        {/* Today Button and Date Picker */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Today
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Time Slots Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center">
          <Clock className="h-5 w-5 mr-2 text-slate-600" />
          Time Slots
        </h3>
        <div className="text-sm text-slate-500">
          {bookings.length} bookings
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {displayTimeSlots.map((time) => {
          const slotBookings = getBookingsForSlot(time)
          const isOutOfHours = isOutsideBusinessHours(time)
          const hasBookings = slotBookings.length > 0
          const hasPendingBooking = slotBookings.some(b => b.status === 'pending')

          return (
            <div
              key={time}
              onClick={() => hasBookings && slotBookings[0] && setSelectedBooking(slotBookings[0])}
              className={`
                p-2 rounded-lg border-2 text-sm font-medium transition-all relative min-h-[80px]
                ${hasBookings
                  ? hasPendingBooking
                    ? 'pulse-pending-border cursor-pointer hover:shadow-md'
                    : `${isOutOfHours ? 'bg-orange-100 border-orange-300' : 'bg-white border-slate-300'} cursor-pointer hover:shadow-md`
                  : isOutOfHours
                    ? 'bg-gray-100 border-gray-300 text-gray-500'
                    : 'bg-gray-50 border-gray-200 text-gray-600'
                }
              `}
            >
              <div className="font-bold text-xs text-center mb-1">{time}</div>
              {hasBookings ? (
                <div className="space-y-1">
                  {slotBookings.map((booking) => {
                    const serviceInfo = booking.service || getServiceInfo(booking.service_uuid || booking.service_id)
                    return (
                      <div
                        key={booking.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedBooking(booking)
                        }}
                        className={`flex items-center justify-between gap-1 px-1 py-0.5 rounded hover:bg-gray-100 cursor-pointer ${
                          booking.status === 'pending' ? 'flash-pending-subtle' : ''
                        }`}
                      >
                        <span className="text-xs truncate flex-1 text-left">
                          {serviceInfo?.name}
                        </span>
                        <span className="flex-shrink-0">
                          {getStatusIcon(booking.status)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-xs text-center text-gray-400">
                  {isOutOfHours ? 'Closed' : 'Available'}
                </div>
              )}
              {isOutOfHours && hasBookings && (
                <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center" title="Outside business hours">
                  !
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-2">
        <div className="text-xs text-slate-600">
          <span className="inline-block w-3 h-3 bg-gray-50 border border-gray-200 rounded mr-1"></span>
          Available
        </div>
        <div className="text-xs text-slate-600">
          <span className="inline-block w-3 h-3 bg-yellow-100 border border-yellow-300 rounded mr-1"></span>
          Pending
        </div>
        <div className="text-xs text-slate-600">
          <span className="inline-block w-3 h-3 bg-green-100 border border-green-300 rounded mr-1"></span>
          Confirmed
        </div>
        <div className="text-xs text-slate-600">
          <span className="inline-block w-3 h-3 bg-red-100 border border-red-300 rounded mr-1"></span>
          Cancelled
        </div>
      </div>
    </div>
  )
}