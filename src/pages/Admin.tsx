import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Clock, User, Mail, Phone, CheckCircle, XCircle, AlertCircle, ChevronLeft, ChevronRight, Users, Eye, Settings, UserPlus, Package, CalendarDays, Tag, RefreshCw, DollarSign, Grid3X3, List, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getBusinessHours, generateTimeSlots } from '../utils/businessHours'
import { sendRescheduleNotification } from '../services/emailService'

interface Service {
  id: string
  name: string
  duration: number
  price: number
}

const Admin = () => {
  const [bookings, setBookings] = useState<any[]>([])
  const [services, setServices] = useState<Service[]>([])
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

  // Get dynamic time slots based on business hours
  const businessHours = getBusinessHours()
  const standardTimeSlots = generateTimeSlots(businessHours)

  useEffect(() => {
    fetchServices()
  }, [])

  useEffect(() => {
    if (services.length > 0) {
      fetchBookings()
    }
  }, [selectedDate, services])

  useEffect(() => {
    // Combine standard time slots with any booking times that fall outside business hours
    const bookingTimes = bookings
      .map(b => b.booking_time?.substring(0, 5))
      .filter(Boolean)
    
    // Create a set to avoid duplicates, then sort
    const allSlots = [...new Set([...standardTimeSlots, ...bookingTimes])].sort()
    setDisplayTimeSlots(allSlots)
  }, [bookings, standardTimeSlots.join(',')]) // Join to make it comparable

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

  const getServiceInfo = (serviceId: string | null) => {
    if (!serviceId) return null
    const service = services.find(s => s.id === serviceId)
    if (!service) {
      // Fallback for old service_id field (numeric strings)
      const fallbackNames: { [key: string]: string } = {
        '1': 'Swedish Massage',
        '2': 'Deep Tissue Massage',
        '3': 'Hot Stone Therapy',
        '4': 'Aromatherapy Massage',
        '5': 'Classic Facial',
        '6': 'Anti-Aging Facial',
        '7': 'Acne Treatment',
        '8': 'Body Scrub',
        '9': 'Body Wrap',
        '10': 'Mud Bath'
      }
      return {
        name: fallbackNames[serviceId] || 'Unknown Service',
        duration: 60
      }
    }
    return service
  }

  const getServiceColor = (index: number) => {
    const colors = [
      'bg-blue-100 border-blue-300 text-blue-900',
      'bg-purple-100 border-purple-300 text-purple-900',
      'bg-red-100 border-red-300 text-red-900',
      'bg-pink-100 border-pink-300 text-pink-900',
      'bg-green-100 border-green-300 text-green-900',
      'bg-yellow-100 border-yellow-300 text-yellow-900',
      'bg-orange-100 border-orange-300 text-orange-900',
      'bg-teal-100 border-teal-300 text-teal-900',
      'bg-indigo-100 border-indigo-300 text-indigo-900',
      'bg-gray-100 border-gray-300 text-gray-900'
    ]
    return colors[index % colors.length]
  }

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          service:service_uuid(id, name, duration),
          staff:staff_id(id, name)
        `)
        .eq('booking_date', selectedDate)
        .order('booking_time', { ascending: true })
      
      if (error) throw error
      setBookings(data || [])
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId)
      
      if (error) throw error
      
      setBookings(bookings.map(booking => 
        booking.id === bookingId ? { ...booking, status: newStatus } : booking
      ))
      
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking({ ...selectedBooking, status: newStatus })
      }
    } catch (error) {
      console.error('Error updating booking:', error)
      alert('Failed to update booking status')
    }
  }
  
  const checkRescheduleAvailability = async () => {
    if (!rescheduleDate || !selectedBooking) return
    
    setCheckingAvailability(true)
    try {
      // Get all bookings for the selected date
      const { data: dayBookings, error } = await supabase
        .from('bookings')
        .select(`
          *,
          service:service_uuid(duration),
          staff:staff_id(id)
        `)
        .eq('booking_date', rescheduleDate)
        .neq('status', 'cancelled')
        .neq('id', selectedBooking.id) // Exclude current booking
      
      if (error) throw error
      
      // Get service duration
      const serviceInfo = getServiceInfo(selectedBooking.service_uuid || selectedBooking.service_id)
      const serviceDuration = selectedBooking.service?.duration || serviceInfo?.duration || 60
      const slotsNeeded = Math.ceil(serviceDuration / businessHours.slotDuration)
      
      // Filter bookings for the same staff (if applicable)
      const staffBookings = selectedBooking.staff_id 
        ? dayBookings?.filter(b => b.staff_id === selectedBooking.staff_id) || []
        : dayBookings || []
      
      // Check each time slot
      const available: string[] = []
      standardTimeSlots.forEach((slot, index) => {
        // Check if enough consecutive slots are available
        if (index + slotsNeeded > standardTimeSlots.length) return
        
        let isAvailable = true
        
        // Check for conflicts
        for (let i = 0; i < slotsNeeded; i++) {
          const checkSlot = standardTimeSlots[index + i]
          
          // Check if any booking conflicts with this slot
          const hasConflict = staffBookings.some(booking => {
            const bookingTime = booking.booking_time.substring(0, 5)
            const bookingDuration = booking.service?.duration || 60
            const bookingSlotsNeeded = Math.ceil(bookingDuration / businessHours.slotDuration)
            const bookingStartIndex = standardTimeSlots.indexOf(bookingTime)
            
            if (bookingStartIndex === -1) return false
            
            const checkIndex = standardTimeSlots.indexOf(checkSlot)
            return checkIndex >= bookingStartIndex && checkIndex < bookingStartIndex + bookingSlotsNeeded
          })
          
          if (hasConflict) {
            isAvailable = false
            break
          }
        }
        
        if (isAvailable) {
          available.push(slot)
        }
      })
      
      setAvailableSlots(available)
    } catch (error) {
      console.error('Error checking availability:', error)
    } finally {
      setCheckingAvailability(false)
    }
  }
  
  const handleReschedule = async () => {
    if (!selectedBooking || !rescheduleDate || !rescheduleTime) return
    
    try {
      const originalDate = selectedBooking.booking_date
      const originalTime = selectedBooking.booking_time
      
      // Update the booking
      const { error } = await supabase
        .from('bookings')
        .update({
          booking_date: rescheduleDate,
          booking_time: rescheduleTime,
          notes: rescheduleReason 
            ? `Admin rescheduled: ${rescheduleReason}. Originally ${originalDate} at ${originalTime.substring(0, 5)}`
            : `Admin rescheduled from ${originalDate} at ${originalTime.substring(0, 5)}`
        })
        .eq('id', selectedBooking.id)
      
      if (error) throw error
      
      // Send notification email
      try {
        await sendRescheduleNotification({
          to: selectedBooking.customer_email,
          customerName: selectedBooking.customer_name,
          serviceName: selectedBooking.service?.name || getServiceInfo(selectedBooking.service_uuid || selectedBooking.service_id)?.name || 'Service',
          originalDate,
          originalTime: originalTime.substring(0, 5),
          newDate: rescheduleDate,
          newTime: rescheduleTime,
          reason: rescheduleReason || 'Schedule adjustment',
          staffName: selectedBooking.staff?.name
        })
      } catch (emailError) {
        console.error('Failed to send reschedule notification:', emailError)
      }
      
      // Refresh bookings
      await fetchBookings()
      
      // Close modal and reset
      setShowRescheduleModal(false)
      setRescheduleDate('')
      setRescheduleTime('')
      setRescheduleReason('')
      setSelectedBooking(null)
      
      alert('Booking rescheduled successfully!')
    } catch (error) {
      console.error('Error rescheduling booking:', error)
      alert('Failed to reschedule booking')
    }
  }
  
  useEffect(() => {
    if (rescheduleDate && showRescheduleModal) {
      checkRescheduleAvailability()
    }
  }, [rescheduleDate, showRescheduleModal])

  const changeDate = (days: number) => {
    const currentDate = new Date(selectedDate)
    currentDate.setDate(currentDate.getDate() + days)
    setSelectedDate(currentDate.toISOString().split('T')[0])
  }

  const goToToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0])
  }

  const getBookingsForSlot = (time: string) => {
    return bookings.filter(booking => {
      // Handle both "HH:MM" and "HH:MM:SS" formats
      const bookingTime = booking.booking_time.substring(0, 5)
      return bookingTime === time && booking.status !== 'cancelled'
    })
  }

  const isOutsideBusinessHours = (time: string) => {
    return !standardTimeSlots.includes(time)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length
  }
  
  // Calculate revenue for today
  const todayRevenue = bookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, booking) => {
      const service = services.find(s => s.id === booking.service_uuid)
      return sum + (service?.price || 0)
    }, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-slate-600 mt-2 text-lg">Welcome back! Here's your spa at a glance</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => fetchBookings()}
                className="bg-white text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-50 flex items-center space-x-2 shadow-sm border border-slate-200 transition-all"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
              <Link
                to="/admin/settings"
                className="bg-gradient-to-r from-slate-700 to-slate-800 text-white px-5 py-2 rounded-xl hover:from-slate-800 hover:to-slate-900 flex items-center space-x-2 shadow-lg transition-all"
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </Link>
            </div>
          </div>

          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-lg transition-all cursor-pointer group">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-3xl font-bold text-slate-800">{stats.total}</span>
              </div>
              <p className="text-sm text-slate-600 font-medium">Total Bookings</p>
              <div className="mt-2 h-1 bg-blue-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{width: '100%'}}></div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-5 shadow-sm border border-yellow-200 hover:shadow-lg transition-all cursor-pointer group">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition-colors">
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                </div>
                <span className="text-3xl font-bold text-yellow-900">{stats.pending}</span>
              </div>
              <p className="text-sm text-yellow-800 font-medium">Pending</p>
              <div className="mt-2 h-1 bg-yellow-200 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-500 rounded-full" style={{width: stats.total > 0 ? `${(stats.pending/stats.total)*100}%` : '0%'}}></div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 shadow-sm border border-green-200 hover:shadow-lg transition-all cursor-pointer group">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <span className="text-3xl font-bold text-green-900">{stats.confirmed}</span>
              </div>
              <p className="text-sm text-green-800 font-medium">Confirmed</p>
              <div className="mt-2 h-1 bg-green-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{width: stats.total > 0 ? `${(stats.confirmed/stats.total)*100}%` : '0%'}}></div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-5 shadow-sm border border-red-200 hover:shadow-lg transition-all cursor-pointer group">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <span className="text-3xl font-bold text-red-900">{stats.cancelled}</span>
              </div>
              <p className="text-sm text-red-800 font-medium">Cancelled</p>
              <div className="mt-2 h-1 bg-red-200 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{width: stats.total > 0 ? `${(stats.cancelled/stats.total)*100}%` : '0%'}}></div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 shadow-sm border border-purple-200 hover:shadow-lg transition-all cursor-pointer group">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <span className="text-3xl font-bold text-purple-900">${todayRevenue}</span>
              </div>
              <p className="text-sm text-purple-800 font-medium">Today's Revenue</p>
              <div className="mt-2 h-1 bg-purple-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full" style={{width: '100%'}}></div>
              </div>
            </div>
          </div>

          {/* Quick Access Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Link
              to="/admin/staff"
              className="bg-white p-4 rounded-xl shadow-sm hover:shadow-lg transition-all group border border-slate-100"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg group-hover:from-blue-100 group-hover:to-blue-200 transition-all">
                  <UserPlus className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">Staff</h3>
                  <p className="text-xs text-slate-600">Manage team</p>
                </div>
              </div>
            </Link>

            <Link
              to="/admin/categories"
              className="bg-white p-4 rounded-xl shadow-sm hover:shadow-lg transition-all group border border-slate-100"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-green-50 to-green-100 rounded-lg group-hover:from-green-100 group-hover:to-green-200 transition-all">
                  <Tag className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">Categories</h3>
                  <p className="text-xs text-slate-600">Service types</p>
                </div>
              </div>
            </Link>

            <Link
              to="/admin/services"
              className="bg-white p-4 rounded-xl shadow-sm hover:shadow-lg transition-all group border border-slate-100"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg group-hover:from-purple-100 group-hover:to-purple-200 transition-all">
                  <Package className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">Services</h3>
                  <p className="text-xs text-slate-600">Pricing</p>
                </div>
              </div>
            </Link>

            <Link
              to="/admin/staff-schedule"
              className="bg-white p-4 rounded-xl shadow-sm hover:shadow-lg transition-all group border border-slate-100"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg group-hover:from-orange-100 group-hover:to-orange-200 transition-all">
                  <CalendarDays className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">Schedule</h3>
                  <p className="text-xs text-slate-600">Staff hours</p>
                </div>
              </div>
            </Link>

            <Link
              to="/admin/settings"
              className="bg-white p-4 rounded-xl shadow-sm hover:shadow-lg transition-all group border border-slate-100"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg group-hover:from-slate-200 group-hover:to-slate-300 transition-all">
                  <Settings className="h-6 w-6 text-slate-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">Settings</h3>
                  <p className="text-xs text-slate-600">Business</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex justify-end items-center gap-4">
            {/* Business Hours Display */}
            <div className="flex items-center text-sm text-slate-600 bg-slate-50 px-4 py-2.5 rounded-xl">
              <Clock className="h-4 w-4 mr-2 text-slate-500" />
              <span className="font-medium">Hours: {businessHours.openTime} - {businessHours.closeTime}</span>
              <span className="ml-2 text-xs text-slate-500">({businessHours.slotDuration}min slots)</span>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  viewMode === 'calendar' 
                    ? 'bg-white text-slate-700 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
                <span className="hidden sm:inline">Calendar</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  viewMode === 'list' 
                    ? 'bg-white text-slate-700 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 text-slate-600 animate-spin" />
              <p className="text-slate-600">Loading bookings...</p>
            </div>
          </div>
        ) : viewMode === 'calendar' ? (
          /* Enhanced Calendar View */
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Time Slots Grid with Date Navigation */}
            <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              {/* Date Navigation Header */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
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
              {displayTimeSlots.map((time, idx) => {
                const slotBookings = getBookingsForSlot(time)
                const isOutOfHours = isOutsideBusinessHours(time)
                const hasBookings = slotBookings.length > 0
                
                return (
                  <div
                    key={time}
                    onClick={() => hasBookings && slotBookings[0] && setSelectedBooking(slotBookings[0])}
                    className={`
                      p-2 rounded-lg border-2 text-sm font-medium transition-all relative min-h-[80px]
                      ${hasBookings 
                        ? `${isOutOfHours ? 'bg-orange-100 border-orange-300' : 'bg-white border-slate-300'} cursor-pointer hover:shadow-md` 
                        : isOutOfHours 
                          ? 'bg-gray-100 border-gray-300 text-gray-500'
                          : 'bg-gray-50 border-gray-200 text-gray-600'
                      }
                    `}
                  >
                    <div className="font-bold text-xs text-center mb-1">{time}</div>
                    {hasBookings ? (
                      <div className="space-y-1">
                        {slotBookings.map((booking, bookingIdx) => {
                          const serviceInfo = booking.service || getServiceInfo(booking.service_uuid || booking.service_id)
                          return (
                            <div
                              key={booking.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedBooking(booking)
                              }}
                              className="flex items-center justify-between gap-1 px-1 py-0.5 rounded hover:bg-gray-100 cursor-pointer"
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

            {/* Enhanced Booking Details Panel */}
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
                    <p className="text-sm">{selectedBooking.notes}</p>
                  </div>
                )}

                <div className="pt-4 border-t space-y-2">
                  {selectedBooking.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateBookingStatus(selectedBooking.id, 'confirmed')}
                        className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                      >
                        Confirm Booking
                      </button>
                      <button
                        onClick={() => {
                          setRescheduleDate(selectedBooking.booking_date)
                          setShowRescheduleModal(true)
                        }}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reschedule Booking
                      </button>
                      <button
                        onClick={() => updateBookingStatus(selectedBooking.id, 'cancelled')}
                        className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
                      >
                        Cancel Booking
                      </button>
                    </>
                  )}
                  {selectedBooking.status === 'confirmed' && (
                    <>
                      <button
                        onClick={() => {
                          setRescheduleDate(selectedBooking.booking_date)
                          setShowRescheduleModal(true)
                        }}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reschedule Booking
                      </button>
                      <button
                        onClick={() => updateBookingStatus(selectedBooking.id, 'cancelled')}
                        className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
                      >
                        Cancel Booking
                      </button>
                    </>
                  )}
                  {selectedBooking.status === 'cancelled' && (
                    <button
                      onClick={() => updateBookingStatus(selectedBooking.id, 'confirmed')}
                      className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                    >
                      Reconfirm Booking
                    </button>
                  )}
                </div>
              </div>
              ) : (
                <div className="text-center py-12">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="p-4 bg-slate-50 rounded-full">
                      <Calendar className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500">Select a booking to view details</p>
                    <p className="text-xs text-slate-400">Click on any time slot with a booking</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Enhanced List View */
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
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-slate-400" />
                          <div className="text-sm font-medium text-slate-900">
                            {booking.customer_name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600">
                          <div className="flex items-center">
                            <Mail className="h-3 w-3 mr-2" />
                            {booking.customer_email}
                          </div>
                          {booking.customer_phone && (
                            <div className="flex items-center mt-1">
                              <Phone className="h-3 w-3 mr-2" />
                              {booking.customer_phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {getStatusIcon(booking.status)}
                          <span className="ml-1">{booking.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          {booking.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                                className="text-green-600 hover:text-green-900 text-sm font-medium"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                                className="text-red-600 hover:text-red-900 text-sm font-medium"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {booking.status === 'confirmed' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedBooking(booking)
                                  setRescheduleDate(booking.booking_date)
                                  setShowRescheduleModal(true)
                                }}
                                className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                              >
                                Reschedule
                              </button>
                              <button
                                onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                                className="text-red-600 hover:text-red-900 text-sm font-medium"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {booking.status === 'cancelled' && (
                            <button
                              onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                              className="text-green-600 hover:text-green-900 text-sm font-medium"
                            >
                              Reconfirm
                            </button>
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
      )}
      
      {/* Reschedule Modal */}
      {showRescheduleModal && selectedBooking && (
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
        )}
      </div>
    </div>
  )
}

export default Admin