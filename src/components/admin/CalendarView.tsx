import { TimeSlotGrid } from './TimeSlotGrid'
import { BookingDetailsPanel } from './BookingDetailsPanel'

interface CalendarViewProps {
  selectedDate: string
  setSelectedDate: (date: string) => void
  displayTimeSlots: string[]
  bookings: any[]
  getBookingsForSlot: (time: string) => any[]
  isOutsideBusinessHours: (time: string) => boolean
  getStatusIcon: (status: string) => React.ReactNode
  getServiceInfo: (serviceId: string | null) => any
  selectedBooking: any
  setSelectedBooking: (booking: any) => void
  changeDate: (direction: number) => void
  goToToday: () => void
  getStatusColor: (status: string) => string
  updateBookingStatus: (bookingId: string, status: string) => void
  setRescheduleDate: (date: string) => void
  setShowRescheduleModal: (show: boolean) => void
}

export const CalendarView = (props: CalendarViewProps) => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <TimeSlotGrid
        selectedDate={props.selectedDate}
        setSelectedDate={props.setSelectedDate}
        displayTimeSlots={props.displayTimeSlots}
        bookings={props.bookings}
        getBookingsForSlot={props.getBookingsForSlot}
        isOutsideBusinessHours={props.isOutsideBusinessHours}
        getStatusIcon={props.getStatusIcon}
        getServiceInfo={props.getServiceInfo}
        setSelectedBooking={props.setSelectedBooking}
        changeDate={props.changeDate}
        goToToday={props.goToToday}
      />
      <BookingDetailsPanel
        selectedBooking={props.selectedBooking}
        getStatusColor={props.getStatusColor}
        getStatusIcon={props.getStatusIcon}
        getServiceInfo={props.getServiceInfo}
        updateBookingStatus={props.updateBookingStatus}
        setSelectedBooking={props.setSelectedBooking}
        setRescheduleDate={props.setRescheduleDate}
        setShowRescheduleModal={props.setShowRescheduleModal}
      />
    </div>
  )
}