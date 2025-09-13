import { useState, useEffect } from 'react'
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Edit2, X, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { sendCancellationNotification } from '../services/emailService'

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
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [services, setServices] = useState<{ [key: string]: string }>({}) // For fallback
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [cancellationReason, setCancellationReason] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchUserAndBookings()
    fetchServices()
  }, [])

  const fetchUserAndBookings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        setUser(session.user)
        
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            service:service_uuid(id, name),
            staff:staff_id(id, name)
          `)
          .eq('user_id', session.user.id)
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
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
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
      alert('Failed to cancel booking. Please try again.')
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-slate-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">My Dashboard</h1>
        <p className="text-slate-600 mt-2">Welcome back, {user?.user_metadata?.full_name || user?.email}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Total Bookings</h3>
          <p className="text-3xl font-bold text-slate-700">{bookings.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Upcoming</h3>
          <p className="text-3xl font-bold text-slate-700">
            {bookings.filter(b => b.status === 'confirmed' && new Date(b.booking_date) >= new Date()).length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Pending</h3>
          <p className="text-3xl font-bold text-slate-700">
            {bookings.filter(b => b.status === 'pending').length}
          </p>
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-slate-800">My Bookings</h2>
        </div>
        
        {bookings.length === 0 ? (
          <div className="p-6 text-center text-slate-600">
            <p>No bookings yet. Book your first appointment!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">
                        {getServiceName(booking)}
                      </div>
                      {booking.staff && (
                        <div className="text-xs text-slate-500">
                          with {booking.staff.name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-slate-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        {new Date(booking.booking_date).toLocaleDateString()}
                        <Clock className="h-4 w-4 mx-2" />
                        {typeof booking.booking_time === 'string' ? booking.booking_time.substring(0, 5) : booking.booking_time}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        <span className="ml-1">{booking.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {booking.notes || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {booking.status !== 'cancelled' && (
                        <div className="flex space-x-2">
                          {canCancelBooking(booking) && (
                            <>
                              <button
                                onClick={() => handleReschedule(booking)}
                                className="text-blue-600 hover:text-blue-800 flex items-center"
                                title="Reschedule"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedBooking(booking)
                                  setShowCancelModal(true)
                                }}
                                className="text-red-600 hover:text-red-800 flex items-center"
                                title="Cancel"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {!canCancelBooking(booking) && booking.status === 'confirmed' && (
                            <span className="text-xs text-slate-500">
                              Cannot modify (less than 2 hours)
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Cancel Booking
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-slate-600 mb-2">
                Are you sure you want to cancel this booking?
              </p>
              <div className="bg-slate-50 p-3 rounded">
                <p className="text-sm font-medium text-slate-700">
                  {getServiceName(selectedBooking)}
                </p>
                <p className="text-xs text-slate-600">
                  {new Date(selectedBooking.booking_date).toLocaleDateString()} at {selectedBooking.booking_time.substring(0, 5)}
                </p>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Reason for cancellation (optional)
              </label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                rows={3}
                placeholder="Let us know why you're cancelling..."
              />
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-yellow-800">
                <strong>Cancellation Policy:</strong> Bookings must be cancelled at least 2 hours in advance. 
                Late cancellations may be subject to fees.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleCancelBooking}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
              >
                Confirm Cancellation
              </button>
              <button
                onClick={() => {
                  setShowCancelModal(false)
                  setSelectedBooking(null)
                  setCancellationReason('')
                }}
                className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-lg hover:bg-slate-50"
              >
                Keep Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard