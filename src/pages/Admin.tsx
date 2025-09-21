import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, Crown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { executeQuery } from '../utils/supabaseQuery'
import { getBusinessHours, generateTimeSlots } from '../utils/businessHours'
import { sendRescheduleNotification, sendBookingConfirmation, sendCancellationNotification } from '../services/emailService'
import { markPastBookingsCompleted, archiveOldBookings } from '../utils/bookingArchive'
import { useModal } from '../contexts/ModalContext'

// Import components
import { AdminHeader } from '../components/admin/AdminHeader'
import { CalendarView } from '../components/admin/CalendarView'
import { ListView } from '../components/admin/ListView'
import { RescheduleModal } from '../components/admin/RescheduleModal'

interface Service {
  id: string
  name: string
  duration: number
  price: number
}

const Admin = () => {
  const { showAlert, showConfirm } = useModal()
  const [bookings, setBookings] = useState<any[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [staffMembers, setStaffMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [selectedBooking, setSelectedBooking] = useState<any>(null)
  const [displayTimeSlots, setDisplayTimeSlots] = useState<string[]>([])

  // Reschedule modal state
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('')
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [rescheduleReason, setRescheduleReason] = useState('')

  // Real-time pending bookings state
  const [totalPendingCount, setTotalPendingCount] = useState(0)
  const [hasNewPending, setHasNewPending] = useState(false)


  // Get dynamic time slots based on business hours
  const businessHours = getBusinessHours()
  const standardTimeSlots = generateTimeSlots(businessHours)

  useEffect(() => {
    fetchServices()
    fetchStaffMembers()
    fetchTotalPendingCount()

    // Set up real-time subscription for new bookings
    const channel = supabase
      .channel('bookings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        async (payload) => {
          console.log('Booking change detected:', payload)

          // Fetch updated bookings for current date
          if (payload.new?.booking_date === selectedDate ||
              payload.old?.booking_date === selectedDate) {
            fetchBookings()
          }

          // Update total pending count
          fetchTotalPendingCount()

          // Flash animation for new pending bookings
          if (payload.eventType === 'INSERT' && payload.new?.status === 'pending') {
            setHasNewPending(true)
            setTimeout(() => setHasNewPending(false), 3000)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    fetchBookings()
  }, [selectedDate])

  useEffect(() => {
    // Combine standard time slots with any booking times that fall outside business hours
    const bookingTimes = bookings
      .map(b => b.booking_time?.substring(0, 5))
      .filter(Boolean)

    const allSlots = [...new Set([...standardTimeSlots, ...bookingTimes])].sort()
    setDisplayTimeSlots(allSlots)
  }, [bookings, standardTimeSlots.join(',')])

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, name, duration, price')
        .eq('is_active', true)

      if (error) throw error
      setServices(data || [])
    } catch (error) {
      console.error('Error fetching services:', error)
    }
  }

  const fetchStaffMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('id, name, email')
        .eq('is_active', true)

      if (error) throw error
      setStaffMembers(data || [])
    } catch (error) {
      console.error('Error fetching staff members:', error)
    }
  }

  const fetchTotalPendingCount = async () => {
    try {
      const { count, error } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      if (error) throw error
      setTotalPendingCount(count || 0)
    } catch (error) {
      console.error('Error fetching total pending count:', error)
    }
  }

  const handlePendingButtonClick = async () => {
    // Fetch the earliest pending booking date
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('booking_date')
        .eq('status', 'pending')
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true })
        .limit(1)
        .single()

      if (!error && data) {
        // Set the date to the earliest pending booking
        setSelectedDate(data.booking_date)
        // Switch to list view to show all pending bookings
        setViewMode('list')
      } else {
        // If no pending bookings or error, just switch to list view
        setViewMode('list')
      }
    } catch (error) {
      console.error('Error fetching pending booking date:', error)
      setViewMode('list')
    }
  }

  const getServiceInfo = (serviceId: string | null) => {
    if (!serviceId) return null
    const service = services.find(s => s.id === serviceId)
    if (!service) {
      const oldService = services.find(s => s.id.toString() === serviceId.toString())
      return oldService || null
    }
    return service
  }

  const fetchBookings = async () => {
    setLoading(true)
    try {
      console.log('[Admin] Fetching bookings for date:', selectedDate)

      const result = await executeQuery(() =>
        supabase
          .from('bookings')
          .select(`
            *,
            service:services(name, duration, price),
            staff:staff(name, email)
          `)
          .eq('booking_date', selectedDate)
          .order('booking_time', { ascending: true })
      )

      if (result.data) {
        setBookings(result.data || [])
        console.log('[Admin] Bookings loaded successfully')
      } else if (result.error) {
        console.error('[Admin] Error fetching bookings:', result.error)
        await showAlert('Failed to load bookings. Retrying...', 'error')
        // Retry after a delay
        setTimeout(() => {
          console.log('[Admin] Retrying fetch...')
          fetchBookings()
        }, 3000)
      }
    } catch (error) {
      console.error('[Admin] Unexpected error:', error)
      await showAlert('Failed to load bookings', 'error')
    } finally {
      setLoading(false)
    }
  }

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      // First, get the booking details for sending emails
      const booking = bookings.find(b => b.id === bookingId)
      if (!booking) {
        throw new Error('Booking not found')
      }

      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId)

      if (error) throw error

      setBookings(prev =>
        prev.map(b => b.id === bookingId ? { ...b, status } : b)
      )

      // Refresh total pending count to check if we should hide the button
      await fetchTotalPendingCount()

      // Send confirmation email if status is changed to confirmed
      if (status === 'confirmed') {
        try {
          await sendBookingConfirmation({
            to: booking.customer_email,
            customerName: booking.customer_name,
            serviceName: booking.service?.name || getServiceInfo(booking.service_uuid || booking.service_id)?.name || 'Service',
            date: booking.booking_date,
            time: booking.booking_time.substring(0, 5),
            staffName: booking.staff?.name,
            notes: booking.notes
          })
          await showAlert('Booking confirmed and email sent successfully', 'success')
        } catch (emailError) {
          console.error('Error sending confirmation email:', emailError)
          await showAlert('Booking confirmed but failed to send email', 'warning')
        }
      } else if (status === 'cancelled') {
        // Send cancellation email if status is changed to cancelled
        try {
          await sendCancellationNotification({
            to: booking.customer_email,
            customerName: booking.customer_name,
            serviceName: booking.service?.name || getServiceInfo(booking.service_uuid || booking.service_id)?.name || 'Service',
            date: booking.booking_date,
            time: booking.booking_time.substring(0, 5),
            staffName: booking.staff?.name,
            notes: booking.notes,
            reason: 'Cancelled by administrator'
          })
          await showAlert('Booking cancelled and email sent successfully', 'success')
        } catch (emailError) {
          console.error('Error sending cancellation email:', emailError)
          await showAlert('Booking cancelled but failed to send email', 'warning')
        }
      } else {
        await showAlert(`Booking ${status} successfully`, 'success')
      }

      // After any status update, refresh the bookings to ensure we have the latest data
      await fetchBookings()
    } catch (error) {
      console.error('Error updating booking status:', error)
      await showAlert('Failed to update booking status', 'error')
    }
  }


  const checkAvailability = async (date: string) => {
    setCheckingAvailability(true)
    try {
      const serviceDuration = selectedBooking?.service?.duration ||
                             getServiceInfo(selectedBooking?.service_uuid || selectedBooking?.service_id)?.duration || 60
      const staffId = selectedBooking?.staff?.id || null

      const { data: existingBookings, error } = await supabase
        .from('bookings')
        .select('booking_time, service:services(duration), staff_id')
        .eq('booking_date', date)
        .neq('status', 'cancelled')

      if (error) throw error

      const busySlots = new Set<string>()
      existingBookings?.forEach(booking => {
        const startTime = booking.booking_time.substring(0, 5)
        const duration = booking.service?.duration || 60
        const startMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1])

        for (let i = 0; i < duration; i += 30) {
          const slotMinutes = startMinutes + i
          const hour = Math.floor(slotMinutes / 60)
          const minute = slotMinutes % 60
          const slot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`

          if (!staffId || booking.staff_id === staffId) {
            busySlots.add(slot)
          }
        }
      })

      const available = standardTimeSlots.filter(slot => {
        const slotMinutes = parseInt(slot.split(':')[0]) * 60 + parseInt(slot.split(':')[1])

        for (let i = 0; i < serviceDuration; i += 30) {
          const checkMinutes = slotMinutes + i
          const hour = Math.floor(checkMinutes / 60)
          const minute = checkMinutes % 60
          const checkSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`

          if (busySlots.has(checkSlot)) {
            return false
          }
        }

        return true
      })

      setAvailableSlots(available)
    } catch (error) {
      console.error('Error checking availability:', error)
      await showAlert('Failed to check availability', 'error')
    } finally {
      setCheckingAvailability(false)
    }
  }

  useEffect(() => {
    if (rescheduleDate) {
      checkAvailability(rescheduleDate)
    }
  }, [rescheduleDate])

  const handleReschedule = async () => {
    if (!selectedBooking || !rescheduleDate || !rescheduleTime) return

    const confirmed = await showConfirm(
      'Are you sure you want to reschedule this appointment?',
      'The customer will be notified of the change.'
    )

    if (!confirmed) return

    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          booking_date: rescheduleDate,
          booking_time: rescheduleTime + ':00'
        })
        .eq('id', selectedBooking.id)

      if (error) throw error

      await sendRescheduleNotification(
        selectedBooking.customer_email,
        selectedBooking.customer_name,
        selectedBooking.service?.name || getServiceInfo(selectedBooking.service_uuid || selectedBooking.service_id)?.name,
        selectedBooking.booking_date,
        selectedBooking.booking_time,
        rescheduleDate,
        rescheduleTime,
        rescheduleReason
      )

      await showAlert('Appointment rescheduled successfully', 'success')
      setShowRescheduleModal(false)
      setRescheduleDate('')
      setRescheduleTime('')
      setRescheduleReason('')
      fetchBookings()
    } catch (error) {
      console.error('Error rescheduling appointment:', error)
      await showAlert('Failed to reschedule appointment', 'error')
    }
  }

  const getBookingsForSlot = (time: string) => {
    return bookings.filter(b => b.booking_time && b.booking_time.substring(0, 5) === time)
  }

  const isOutsideBusinessHours = (time: string) => {
    return !standardTimeSlots.includes(time)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-purple-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800'
      case 'confirmed':
        return 'bg-green-100 border-green-300 text-green-800'
      case 'cancelled':
        return 'bg-red-100 border-red-300 text-red-800'
      case 'completed':
        return 'bg-purple-100 border-purple-300 text-purple-800'
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800'
    }
  }

  const formatDate = (date: string) => {
    return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const changeDate = (direction: number) => {
    const currentDate = new Date(selectedDate)
    currentDate.setDate(currentDate.getDate() + direction)
    setSelectedDate(currentDate.toISOString().split('T')[0])
  }

  const goToToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0])
  }

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    completed: bookings.filter(b => b.status === 'completed').length
  }

  const handleArchiveOld = async () => {
    const confirmed = await showConfirm(
      'Archive old bookings?',
      'This will move bookings older than 30 days to the archive.'
    )

    if (!confirmed) return

    const result = await archiveOldBookings(30)
    if (result.success) {
      await showAlert(`Archived ${result.count} old bookings`, 'success')
      fetchBookings()
    }
  }

  const handleMarkCompleted = async () => {
    const result = await markPastBookingsCompleted()
    if (result.success && result.count > 0) {
      await showAlert(`Marked ${result.count} past bookings as completed`, 'success')
      fetchBookings()
    } else {
      await showAlert('No past bookings to mark as completed', 'info')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-sage-50">
      {/* Hero Section */}
      <section className="relative pt-40 pb-20 bg-gradient-to-r from-sage-50 via-spa-50 to-rose-50">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-64 h-64 bg-sage-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-rose-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        </div>

        <div className="relative container mx-auto px-4 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-gold-300 mb-6">
            <Crown className="h-4 w-4 text-gold-500 mr-2" />
            <span className="text-sm font-medium text-stone-700">Admin Control Center</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-light text-stone-800 mb-6">
            Manage Your
            <span className="block text-4xl md:text-5xl font-normal text-transparent bg-clip-text bg-gradient-to-r from-sage-600 to-spa-600 mt-2">
              Spa Operations
            </span>
          </h1>

          <p className="text-xl text-stone-600 max-w-3xl mx-auto leading-relaxed">
            Oversee bookings, manage schedules, and ensure every guest experiences perfect serenity
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <AdminHeader
          stats={stats}
          viewMode={viewMode}
          setViewMode={setViewMode}
          handleArchiveOld={handleArchiveOld}
          handleMarkCompleted={handleMarkCompleted}
          totalPendingCount={totalPendingCount}
          hasNewPending={hasNewPending}
          handlePendingButtonClick={handlePendingButtonClick}
        />

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="inline-flex items-center space-x-2">
                <div className="w-2 h-2 bg-sage-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-sage-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-sage-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <p className="text-stone-600 mt-4">Loading spa bookings...</p>
            </div>
          </div>
        ) : viewMode === 'calendar' ? (
          <CalendarView
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            displayTimeSlots={displayTimeSlots}
            bookings={bookings}
            getBookingsForSlot={getBookingsForSlot}
            isOutsideBusinessHours={isOutsideBusinessHours}
            getStatusIcon={getStatusIcon}
            getServiceInfo={getServiceInfo}
            selectedBooking={selectedBooking}
            setSelectedBooking={setSelectedBooking}
            changeDate={changeDate}
            goToToday={goToToday}
            getStatusColor={getStatusColor}
            updateBookingStatus={updateBookingStatus}
            setRescheduleDate={setRescheduleDate}
            setShowRescheduleModal={setShowRescheduleModal}
          />
        ) : (
          <ListView
            bookings={bookings}
            getServiceInfo={getServiceInfo}
            getStatusColor={getStatusColor}
            getStatusIcon={getStatusIcon}
            updateBookingStatus={updateBookingStatus}
            setSelectedBooking={setSelectedBooking}
            setRescheduleDate={setRescheduleDate}
            setShowRescheduleModal={setShowRescheduleModal}
          />
        )}

        <RescheduleModal
          showRescheduleModal={showRescheduleModal}
          selectedBooking={selectedBooking}
          rescheduleDate={rescheduleDate}
          setRescheduleDate={setRescheduleDate}
          rescheduleTime={rescheduleTime}
          setRescheduleTime={setRescheduleTime}
          availableSlots={availableSlots}
          checkingAvailability={checkingAvailability}
          rescheduleReason={rescheduleReason}
          setRescheduleReason={setRescheduleReason}
          setShowRescheduleModal={setShowRescheduleModal}
          handleReschedule={handleReschedule}
          formatDate={formatDate}
          getServiceInfo={getServiceInfo}
        />
      </div>
    </div>
  )
}

export default Admin