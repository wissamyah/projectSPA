import { useState, useEffect } from 'react'
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Edit2, X, RefreshCw, Sparkles, Heart, Flower2, User, BookOpen, ChevronRight, Star } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { sendCancellationNotification } from '../services/emailService'
import { useModal } from '../contexts/ModalContext'
import { useAuth } from '../contexts/AuthContext'
import Tooltip from '../components/Tooltip'

interface Service {
  id: string
  name: string
}

interface Booking {
  id: string
  booking_date: string
  booking_time: string
  status: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  notes?: string
  service_id?: string
  service_uuid?: string
  service?: Service
  staff?: { id: string; name: string }
}

const Dashboard = () => {
  const [bookings, setBookings] = useState<Booking[]>([])
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [services, setServices] = useState<{ [key: string]: string }>({}) // For fallback
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [cancellationReason, setCancellationReason] = useState('')
  const navigate = useNavigate()
  const { showAlert } = useModal()

  useEffect(() => {
    if (user) {
      fetchUserAndBookings()
      fetchServices()
    } else {
      setLoading(false)
    }
  }, [user])

  const fetchUserAndBookings = async () => {
    try {
      if (user) {
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            service:service_uuid(id, name),
            staff:staff_id(id, name)
          `)
          .eq('user_id', user.id)
          .order('booking_date', { ascending: false })

        if (error) throw error
        setBookings(data || [])
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, name')

      if (error) throw error
      
      // Create a map for quick lookup
      const serviceMap: { [key: string]: string } = {}
      data?.forEach(service => {
        serviceMap[service.id] = service.name
      })
      setServices(serviceMap)
    } catch (error) {
      console.error('Error fetching services:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-sage-600" />
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-rose-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gold-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-sage-100 text-sage-700 border border-sage-200'
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border border-rose-200'
      default:
        return 'bg-gold-50 text-gold-700 border border-gold-200'
    }
  }

  const getServiceName = (booking: Booking) => {
    // Try to get from joined service first
    if (booking.service?.name) return booking.service.name
    
    // Try UUID service lookup
    if (booking.service_uuid && services[booking.service_uuid]) {
      return services[booking.service_uuid]
    }
    
    // Fallback for old numeric service_id
    const fallbackServices: { [key: string]: string } = {
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
    
    if (booking.service_id && fallbackServices[booking.service_id]) {
      return fallbackServices[booking.service_id]
    }
    
    return 'Service'
  }

  const canCancelBooking = (booking: Booking) => {
    // Can only cancel confirmed or pending bookings
    if (booking.status === 'cancelled') return false
    
    // Check if booking is in the future (allow cancellation up to 2 hours before)
    const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`)
    const now = new Date()
    const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)
    
    return hoursUntilBooking > 2 // Must cancel at least 2 hours in advance
  }

  const handleCancelBooking = async () => {
    if (!selectedBooking) return
    
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          notes: cancellationReason ? `Cancelled: ${cancellationReason}` : 'Cancelled by customer'
        })
        .eq('id', selectedBooking.id)
      
      if (error) throw error
      
      // Send cancellation email
      try {
        await sendCancellationNotification({
          to: selectedBooking.customer_email || user?.email,
          customerName: selectedBooking.customer_name || user?.user_metadata?.full_name || 'Customer',
          serviceName: getServiceName(selectedBooking),
          date: selectedBooking.booking_date,
          time: selectedBooking.booking_time.substring(0, 5),
          reason: cancellationReason
        })
      } catch (emailError) {
        console.error('Failed to send cancellation email:', emailError)
        // Don't block the cancellation if email fails
      }
      
      // Refresh bookings
      await fetchUserAndBookings()
      setShowCancelModal(false)
      setSelectedBooking(null)
      setCancellationReason('')
    } catch (error) {
      console.error('Error cancelling booking:', error)
      await showAlert('Failed to cancel booking. Please try again.', 'error')
    }
  }

  const handleReschedule = (booking: Booking) => {
    // Store the booking to reschedule in sessionStorage
    sessionStorage.setItem('rescheduleBooking', JSON.stringify({
      id: booking.id,
      service_uuid: booking.service_uuid,
      staff_id: booking.staff?.id,
      original_date: booking.booking_date,
      original_time: booking.booking_time
    }))
    
    // Navigate to booking page
    navigate('/book')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-sage-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center space-x-2">
            <div className="w-2 h-2 bg-sage-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-sage-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-sage-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <p className="text-stone-600 mt-4">Loading your wellness journey...</p>
        </div>
      </div>
    )
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
            <Sparkles className="h-4 w-4 text-gold-500 mr-2" />
            <span className="text-sm font-medium text-stone-700">Your Wellness Dashboard</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-light text-stone-800 mb-6">
            Welcome Back
            <span className="block text-3xl md:text-4xl font-normal text-transparent bg-clip-text bg-gradient-to-r from-sage-600 to-spa-600 mt-2">
              {user?.user_metadata?.full_name || 'Beautiful Soul'}
            </span>
          </h1>

          <p className="text-xl text-stone-600 max-w-3xl mx-auto leading-relaxed">
            Track your appointments, explore new treatments, and continue your journey to complete relaxation
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 -mt-16 relative z-10">
          <div className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-sage-100 to-spa-100 rounded-xl group-hover:scale-110 transition-transform">
                <BookOpen className="h-6 w-6 text-sage-600" />
              </div>
              <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sage-600 to-sage-700">
                {bookings.length}
              </span>
            </div>
            <h3 className="text-sm font-medium text-stone-600">Total Bookings</h3>
          </div>

          <div className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-spa-100 to-rose-100 rounded-xl group-hover:scale-110 transition-transform">
                <Calendar className="h-6 w-6 text-spa-600" />
              </div>
              <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-spa-600 to-spa-700">
                {bookings.filter(b => b.status === 'confirmed' && new Date(b.booking_date) >= new Date()).length}
              </span>
            </div>
            <h3 className="text-sm font-medium text-stone-600">Upcoming Sessions</h3>
          </div>

          <div className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-gold-100 to-amber-100 rounded-xl group-hover:scale-110 transition-transform">
                <Clock className="h-6 w-6 text-gold-600" />
              </div>
              <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold-500 to-amber-600">
                {bookings.filter(b => b.status === 'pending').length}
              </span>
            </div>
            <h3 className="text-sm font-medium text-stone-600">Awaiting Confirmation</h3>
          </div>
        </div>

        {/* Bookings List */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50">
          <div className="p-8 border-b border-sage-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-light text-stone-800 flex items-center">
                  <Flower2 className="h-6 w-6 mr-3 text-gold-500" />
                  Your Wellness Journey
                </h2>
                <p className="text-sm text-stone-600 mt-1">View and manage your spa appointments</p>
              </div>
              <button
                onClick={() => navigate('/book')}
                className="group bg-gradient-to-r from-sage-600 to-sage-700 text-white px-6 py-2.5 rounded-full hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center space-x-2"
              >
                <span className="font-light">Book New</span>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        
          {bookings.length === 0 ? (
            <div className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-sage-100 to-spa-100 rounded-full mb-6">
                <Heart className="h-10 w-10 text-sage-600" />
              </div>
              <p className="text-lg text-stone-600 mb-4">Begin your wellness journey today</p>
              <button
                onClick={() => navigate('/book')}
                className="bg-gradient-to-r from-sage-600 to-sage-700 text-white px-8 py-3 rounded-full hover:shadow-lg hover:scale-105 transition-all duration-300"
              >
                Book Your First Treatment
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-b-3xl">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-sage-50 to-spa-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-stone-700 uppercase tracking-wider">
                      Treatment
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-stone-700 uppercase tracking-wider">
                      Schedule
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-stone-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-stone-700 uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-stone-700 uppercase tracking-wider">
                      Manage
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sage-100">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-sage-50/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-stone-800">
                          {getServiceName(booking)}
                        </div>
                        {booking.staff && (
                          <div className="text-xs text-stone-500 flex items-center mt-1">
                            <User className="h-3 w-3 mr-1" />
                            {booking.staff.name}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-stone-600">
                          <Calendar className="h-4 w-4 mr-2 text-sage-600" />
                          {new Date(booking.booking_date).toLocaleDateString()}
                          <Clock className="h-4 w-4 mx-2 text-spa-600" />
                          {typeof booking.booking_time === 'string' ? booking.booking_time.substring(0, 5) : booking.booking_time}
                        </div>
                      </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        <span className="ml-1">{booking.status}</span>
                      </span>
                    </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-stone-600 max-w-xs truncate">
                          {booking.notes || '-'}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {booking.status !== 'cancelled' && (
                          <div className="flex space-x-2">
                            {canCancelBooking(booking) && (
                              <>
                                <Tooltip content="Reschedule" position="top">
                                  <button
                                    onClick={() => handleReschedule(booking)}
                                    className="p-2 bg-spa-50 text-spa-700 rounded-lg hover:bg-spa-100 transition-colors"
                                  >
                                    <RefreshCw className="h-4 w-4" />
                                  </button>
                                </Tooltip>
                                <Tooltip content="Cancel" position="top">
                                  <button
                                    onClick={() => {
                                      setSelectedBooking(booking)
                                      setShowCancelModal(true)
                                    }}
                                    className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </Tooltip>
                              </>
                            )}
                            {!canCancelBooking(booking) && booking.status === 'confirmed' && (
                              <span className="text-xs text-stone-500 italic">
                                Final (within 2 hours)
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Cancellation Modal */}
        {showCancelModal && selectedBooking && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 max-w-md w-full border border-white/50">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-rose-100 rounded-xl mr-4">
                  <AlertCircle className="h-6 w-6 text-rose-600" />
                </div>
                <h3 className="text-xl font-light text-stone-800">
                  Cancel Appointment
                </h3>
              </div>
            
              <div className="mb-6">
                <p className="text-sm text-stone-600 mb-3">
                  Are you sure you want to cancel your appointment?
                </p>
                <div className="bg-gradient-to-r from-sage-50 to-spa-50 p-4 rounded-2xl border border-sage-200">
                  <p className="font-medium text-stone-800 flex items-center">
                    <Sparkles className="h-4 w-4 mr-2 text-gold-500" />
                    {getServiceName(selectedBooking)}
                  </p>
                  <p className="text-sm text-stone-600 mt-2 flex items-center">
                    <Calendar className="h-3 w-3 mr-2" />
                    {new Date(selectedBooking.booking_date).toLocaleDateString()} at {selectedBooking.booking_time.substring(0, 5)}
                  </p>
                </div>
              </div>
            
              <div className="mb-6">
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Reason for cancellation (optional)
                </label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-sage-200 rounded-xl focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all duration-200"
                  rows={3}
                  placeholder="Let us know why you're cancelling..."
                />
              </div>
            
              <div className="bg-gradient-to-r from-gold-50 to-amber-50 border border-gold-200 rounded-xl p-4 mb-6">
                <p className="text-xs text-stone-700">
                  <strong className="text-gold-700">Cancellation Policy:</strong> Bookings must be cancelled at least 2 hours in advance.
                  Late cancellations may be subject to fees.
                </p>
              </div>
            
              <div className="flex space-x-3">
                <button
                  onClick={handleCancelBooking}
                  className="flex-1 bg-gradient-to-r from-rose-500 to-rose-600 text-white py-3 rounded-full hover:shadow-lg hover:scale-105 transition-all duration-300 font-light"
                >
                  Confirm Cancellation
                </button>
                <button
                  onClick={() => {
                    setShowCancelModal(false)
                    setSelectedBooking(null)
                    setCancellationReason('')
                  }}
                  className="flex-1 border-2 border-sage-300 text-sage-700 py-3 rounded-full hover:bg-sage-50 transition-all duration-300 font-light"
                >
                  Keep Appointment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard