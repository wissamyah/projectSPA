import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Calendar, Clock, User, Mail, Phone, FileText, AlertCircle, CheckCircle, Ban, Moon, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { 
  getBusinessHours, 
  generateTimeSlots, 
  getSlotUnavailableReason,
  SlotUnavailableReason 
} from '../utils/businessHours'
import { sendBookingConfirmation } from '../services/emailService'

interface Service {
  id: string
  name: string
  description: string | null
  duration: number
  price: number
  category_id: string | null
  is_active: boolean
}

interface Staff {
  id: string
  name: string
  email: string | null
  is_active: boolean
}

const Book = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const serviceId = searchParams.get('service')
  
  // Check if this is a reschedule
  const [rescheduleBooking, setRescheduleBooking] = useState<any>(null)
  const [isRescheduling, setIsRescheduling] = useState(false)
  
  const [formData, setFormData] = useState({
    service_id: serviceId || '',
    booking_date: '',
    booking_time: '',
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    notes: ''
  })
  
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [bookedSlots, setBookedSlots] = useState<string[]>([])
  const [allStaffForService, setAllStaffForService] = useState<Staff[]>([]) // All staff who can perform the service
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [availableStaff, setAvailableStaff] = useState<Staff[]>([])
  const [selectedStaffId, setSelectedStaffId] = useState<string>('')
  const [loadingServices, setLoadingServices] = useState(true)

  // Get dynamic time slots based on business hours
  const businessHours = getBusinessHours()
  const timeSlots = generateTimeSlots(businessHours)

  useEffect(() => {
    checkUser()
    fetchAvailableServices()
    
    // Check for reschedule data
    const rescheduleData = sessionStorage.getItem('rescheduleBooking')
    if (rescheduleData) {
      const data = JSON.parse(rescheduleData)
      setRescheduleBooking(data)
      setIsRescheduling(true)
      setFormData(prev => ({
        ...prev,
        service_id: data.service_uuid || ''
      }))
      if (data.staff_id) {
        setSelectedStaffId(data.staff_id)
      }
      // Clear the session storage
      sessionStorage.removeItem('rescheduleBooking')
    }
  }, [])

  useEffect(() => {
    if (formData.booking_date && formData.service_id) {
      checkAvailability()
    }
  }, [formData.booking_date, formData.service_id])

  useEffect(() => {
    if (formData.booking_date && formData.service_id && formData.booking_time) {
      fetchAvailableStaff()
    }
  }, [formData.booking_date, formData.service_id, formData.booking_time])

  const fetchAvailableServices = async () => {
    setLoadingServices(true)
    try {
      // First get all active services that have staff assigned
      const { data: servicesWithStaff, error } = await supabase
        .from('services')
        .select(`
          id,
          name,
          description,
          duration,
          price,
          category_id,
          is_active,
          staff_services!inner(
            staff_id,
            staff:staff!inner(
              id,
              name,
              is_active
            )
          )
        `)
        .eq('is_active', true)
        .order('name')

      if (error) throw error

      // Filter to only show services with at least one active staff member
      const availableServices = servicesWithStaff?.filter(service => 
        service.staff_services?.some((ss: any) => ss.staff?.is_active)
      ) || []

      // Map to simpler service structure
      const mappedServices = availableServices.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        duration: s.duration,
        price: Number(s.price),
        category_id: s.category_id,
        is_active: s.is_active
      }))

      setServices(mappedServices)
      
      // If service was pre-selected from URL, validate it exists
      if (serviceId && !mappedServices.find(s => s.id === serviceId)) {
        setFormData(prev => ({ ...prev, service_id: '' }))
      }
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoadingServices(false)
    }
  }

  const fetchAvailableStaff = async () => {
    if (!formData.service_id || !formData.booking_date || !formData.booking_time) return
    
    try {
      // Get the duration of the selected service
      const selectedService = services.find(s => s.id === formData.service_id)
      const serviceDuration = selectedService?.duration || 60
      const slotIndex = timeSlots.indexOf(formData.booking_time)
      const slotsNeeded = Math.ceil(serviceDuration / businessHours.slotDuration)

      // Get all staff who can perform this service
      const { data: staffForService, error: staffError } = await supabase
        .from('staff_services')
        .select('staff:staff_id(*)')
        .eq('service_id', formData.service_id)

      if (staffError) throw staffError

      const qualifiedStaff = staffForService
        ?.map((ss: any) => ss.staff)
        .filter((s: any) => s?.is_active) || []

      // Get all bookings for this date
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('booking_time, service_uuid, staff_id, status')
        .eq('booking_date', formData.booking_date)
        .in('status', ['confirmed', 'pending'])

      if (bookingsError) throw bookingsError

      // Get service durations
      const serviceIds = [...new Set(bookings?.map(b => b.service_uuid).filter(Boolean) || [])]
      let bookedServices: any[] = []
      if (serviceIds.length > 0) {
        const { data } = await supabase
          .from('services')
          .select('id, duration')
          .in('id', serviceIds)
        bookedServices = data || []
      }

      // Filter to only staff who are available at this specific time
      const availableStaffList = qualifiedStaff.filter((staff: Staff) => {
        // Check if this staff has any conflicting bookings
        const staffBookings = bookings?.filter(b => b.staff_id === staff.id) || []
        
        for (const booking of staffBookings) {
          const bookingService = bookedServices.find(s => s.id === booking.service_uuid)
          const bookingDuration = bookingService?.duration || 60
          const bookingStartTime = booking.booking_time.substring(0, 5)
          const bookingStartIndex = timeSlots.indexOf(bookingStartTime)
          
          if (bookingStartIndex !== -1) {
            const bookingSlotsNeeded = Math.ceil(bookingDuration / businessHours.slotDuration)
            
            // Check if the selected time slot conflicts with this booking
            for (let i = 0; i < slotsNeeded; i++) {
              const checkIndex = slotIndex + i
              if (checkIndex >= bookingStartIndex && checkIndex < bookingStartIndex + bookingSlotsNeeded) {
                return false // Staff is not available
              }
            }
            
            // Also check if this booking would conflict with our desired slot
            for (let i = 0; i < bookingSlotsNeeded; i++) {
              const checkIndex = bookingStartIndex + i
              if (checkIndex >= slotIndex && checkIndex < slotIndex + slotsNeeded) {
                return false // Staff is not available
              }
            }
          }
        }
        
        return true // Staff is available
      })

      setAvailableStaff(availableStaffList)
    } catch (error) {
      console.error('Error fetching available staff:', error)
      // Fallback to showing all staff for the service
      if (allStaffForService.length > 0) {
        setAvailableStaff(allStaffForService)
      }
    }
  }

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      setUser(session.user)
      setFormData(prev => ({
        ...prev,
        customer_name: session.user.user_metadata?.full_name || '',
        customer_email: session.user.email || ''
      }))
    }
  }

  const checkAvailability = async () => {
    setCheckingAvailability(true)
    try {
      // First, get all staff who can perform this service
      const { data: staffForService, error: staffError } = await supabase
        .from('staff_services')
        .select('staff:staff_id(*)')
        .eq('service_id', formData.service_id)

      if (staffError) throw staffError

      const qualifiedStaff = staffForService
        ?.map((ss: any) => ss.staff)
        .filter((s: any) => s?.is_active) || []
      
      setAllStaffForService(qualifiedStaff)

      // If no staff can perform this service, block all slots
      if (qualifiedStaff.length === 0) {
        setBookedSlots(timeSlots) // Block all slots
        return
      }

      // Get the duration of the selected service
      const selectedService = services.find(s => s.id === formData.service_id)
      const serviceDuration = selectedService?.duration || 60

      // Fetch ALL bookings for the selected date (for all staff)
      const { data: allBookings, error } = await supabase
        .from('bookings')
        .select('booking_time, service_uuid, staff_id, status')
        .eq('booking_date', formData.booking_date)
        .in('status', ['confirmed', 'pending'])

      if (error) throw error

      // For each time slot, check if ANY qualified staff is available
      const blockedSlots: string[] = []
      
      // Get service durations for all booked services
      const serviceIds = [...new Set(allBookings?.map(b => b.service_uuid).filter(Boolean) || [])]
      let bookedServices: any[] = []
      if (serviceIds.length > 0) {
        const { data } = await supabase
          .from('services')
          .select('id, duration')
          .in('id', serviceIds)
        bookedServices = data || []
      }

      // Check each time slot
      timeSlots.forEach(timeSlot => {
        const slotIndex = timeSlots.indexOf(timeSlot)
        
        // Count how many staff are available for this time slot
        let availableStaffCount = 0
        
        qualifiedStaff.forEach((staff: Staff) => {
          let isStaffAvailable = true
          
          // Check if this staff member has any bookings that conflict with this slot
          allBookings?.forEach(booking => {
            if (booking.staff_id === staff.id) {
              const bookingService = bookedServices.find(s => s.id === booking.service_uuid)
              const bookingDuration = bookingService?.duration || 60
              const bookingStartTime = booking.booking_time.substring(0, 5)
              const bookingStartIndex = timeSlots.indexOf(bookingStartTime)
              
              if (bookingStartIndex !== -1) {
                const bookingSlotsNeeded = Math.ceil(bookingDuration / businessHours.slotDuration)
                
                // Check if current slot conflicts with this booking
                if (slotIndex >= bookingStartIndex && slotIndex < bookingStartIndex + bookingSlotsNeeded) {
                  isStaffAvailable = false
                }
                
                // Also check if booking this slot would conflict with existing booking
                const currentServiceSlotsNeeded = Math.ceil(serviceDuration / businessHours.slotDuration)
                if (bookingStartIndex >= slotIndex && bookingStartIndex < slotIndex + currentServiceSlotsNeeded) {
                  isStaffAvailable = false
                }
              }
            }
          })
          
          if (isStaffAvailable) {
            availableStaffCount++
          }
        })
        
        // If NO staff are available for this slot, mark it as blocked
        if (availableStaffCount === 0) {
          blockedSlots.push(timeSlot)
        }
      })
      
      setBookedSlots(blockedSlots)
    } catch (error) {
      console.error('Error checking availability:', error)
    } finally {
      setCheckingAvailability(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const getSlotStatus = (time: string): SlotUnavailableReason => {
    const selectedService = services.find(s => s.id === formData.service_id)
    if (!selectedService) return null
    
    return getSlotUnavailableReason(
      time,
      selectedService.duration,
      bookedSlots,
      businessHours
    )
  }

  const isTimeSlotAvailable = (time: string) => {
    return getSlotStatus(time) === null
  }

  const getSlotClassName = (time: string, status: SlotUnavailableReason) => {
    const isSelected = formData.booking_time === time
    
    if (isSelected) {
      return 'bg-slate-700 text-white'
    }
    
    switch (status) {
      case 'booked':
        return 'bg-red-100 text-red-600 cursor-not-allowed border-red-200'
      case 'after-hours':
        return 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200'
      case 'insufficient-time':
        return 'bg-orange-100 text-orange-600 cursor-not-allowed border-orange-200'
      default:
        return 'bg-white border border-gray-300 hover:bg-slate-50 text-slate-700'
    }
  }

  const getSlotLabel = (status: SlotUnavailableReason) => {
    switch (status) {
      case 'booked':
        return 'Booked'
      case 'after-hours':
        return 'Closed'
      case 'insufficient-time':
        return 'Too Late'
      default:
        return null
    }
  }

  const getSlotIcon = (status: SlotUnavailableReason) => {
    switch (status) {
      case 'booked':
        return <Ban className="h-3 w-3" />
      case 'after-hours':
        return <Moon className="h-3 w-3" />
      case 'insufficient-time':
        return <Clock className="h-3 w-3" />
      default:
        return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Double-check availability before submitting
    if (!isTimeSlotAvailable(formData.booking_time)) {
      alert('This time slot is no longer available. Please select another time.')
      return
    }

    // Check if staff is selected when available
    if (availableStaff.length > 0 && !selectedStaffId) {
      alert('Please select a staff member for your appointment.')
      return
    }
    
    setLoading(true)

    try {
      if (isRescheduling && rescheduleBooking) {
        // Update existing booking
        const { error } = await supabase
          .from('bookings')
          .update({
            booking_date: formData.booking_date,
            booking_time: formData.booking_time,
            staff_id: selectedStaffId || null,
            notes: formData.notes ? `Rescheduled: ${formData.notes}` : 'Rescheduled from ' + rescheduleBooking.original_date + ' ' + rescheduleBooking.original_time,
            status: 'confirmed' // Keep as confirmed since it's a reschedule
          })
          .eq('id', rescheduleBooking.id)

        if (error) throw error

        alert('Your appointment has been successfully rescheduled!')
        navigate('/dashboard')
      } else {
        // Create new booking
        const bookingData = {
          ...formData,
          service_uuid: formData.service_id, // Use service_uuid column
          service_id: formData.service_id, // Keep for backward compatibility
          staff_id: selectedStaffId || null,
          user_id: user?.id || null,
          status: 'pending'
        }

        const { error } = await supabase
          .from('bookings')
          .insert([bookingData])

        if (error) throw error

        // Send confirmation email
        try {
          await sendBookingConfirmation({
            to: formData.customer_email,
            customerName: formData.customer_name,
            serviceName: selectedService?.name || 'Service',
            date: formData.booking_date,
            time: formData.booking_time,
            staffName: availableStaff.find(s => s.id === selectedStaffId)?.name,
            notes: formData.notes
          })
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError)
          // Don't block the booking if email fails
        }

        alert('Booking submitted successfully! You will receive a confirmation email shortly.')
        navigate('/dashboard')
      }
    } catch (error: any) {
      alert('Error ' + (isRescheduling ? 'rescheduling' : 'creating') + ' booking: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const selectedService = services.find(s => s.id === formData.service_id)

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">
        {isRescheduling ? 'Reschedule Your Appointment' : 'Book Your Appointment'}
      </h1>
      
      {isRescheduling && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Rescheduling from:</strong> {rescheduleBooking?.original_date} at {rescheduleBooking?.original_time}
          </p>
        </div>
      )}
      
      {/* Business Hours Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <Clock className="h-5 w-5 text-blue-600 mr-2" />
          <p className="text-sm text-blue-800">
            Business Hours: {businessHours.openTime} - {businessHours.closeTime}
          </p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Service Selection */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Select Service</h2>
          <div className="space-y-4">
            {loadingServices ? (
              <div className="text-center py-4">
                <p className="text-slate-600">Loading available services...</p>
              </div>
            ) : services.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                  <p className="text-sm text-yellow-800">
                    No services are currently available. Please check back later.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <select
                  name="service_id"
                  value={formData.service_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                >
                  <option value="">Choose a service...</option>
                  {services.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.name} - {service.duration}min - ${service.price}
                    </option>
                  ))}
                </select>
                
                {selectedService && (
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="font-semibold">{selectedService.name}</p>
                    {selectedService.description && (
                      <p className="text-sm text-slate-600 mb-2">{selectedService.description}</p>
                    )}
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {selectedService.duration} minutes
                      </span>
                      <span className="flex items-center">
                        <Sparkles className="h-4 w-4 mr-1" />
                        ${selectedService.price}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Date & Time Selection */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Select Date & Time</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Date
              </label>
              <input
                type="date"
                name="booking_date"
                value={formData.booking_date}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Clock className="inline h-4 w-4 mr-1" />
                Time
                {checkingAvailability && (
                  <span className="ml-2 text-sm text-slate-500">(Checking availability...)</span>
                )}
              </label>
              
              {formData.booking_date && formData.service_id ? (
                <>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {timeSlots.map(time => {
                      const status = getSlotStatus(time)
                      const isAvailable = status === null
                      
                      return (
                        <button
                          key={time}
                          type="button"
                          onClick={() => {
                            if (isAvailable) {
                              setFormData({ ...formData, booking_time: time })
                            }
                          }}
                          disabled={!isAvailable || checkingAvailability}
                          className={`
                            px-3 py-2 rounded-lg text-sm font-medium transition-colors border
                            ${getSlotClassName(time, status)}
                          `}
                        >
                          <div>{time}</div>
                          {status && (
                            <div className="flex items-center justify-center mt-1 text-xs">
                              {getSlotIcon(status)}
                              <span className="ml-1">{getSlotLabel(status)}</span>
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  
                  {/* Legend */}
                  <div className="mt-4 flex flex-wrap gap-4 text-xs">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-white border border-gray-300 rounded mr-2"></div>
                      <span>Available</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-red-100 border border-red-200 rounded mr-2"></div>
                      <span>Booked</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded mr-2"></div>
                      <span>After Hours</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-orange-100 border border-orange-200 rounded mr-2"></div>
                      <span>Insufficient Time</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-sm text-slate-500 bg-slate-50 p-4 rounded-lg">
                  <AlertCircle className="inline h-4 w-4 mr-1" />
                  Please select a service and date first to see available time slots
                </div>
              )}
              
              {formData.booking_time && isTimeSlotAvailable(formData.booking_time) && (
                <div className="mt-3 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                  <CheckCircle className="inline h-4 w-4 mr-1" />
                  Selected time: {formData.booking_time} - Available!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Staff Selection */}
        {formData.booking_date && formData.booking_time && formData.service_id && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Select Staff Member</h2>
            <div className="space-y-4">
              {availableStaff.length === 0 ? (
                <div className="text-sm text-slate-500 bg-slate-50 p-4 rounded-lg">
                  <AlertCircle className="inline h-4 w-4 mr-1" />
                  No staff available for this time slot. Please select a different time.
                </div>
              ) : (
                <>
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  >
                    <option value="">Choose a staff member...</option>
                    {availableStaff.map(staff => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name}
                      </option>
                    ))}
                  </select>
                  
                  {selectedStaffId && (
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <p className="text-sm text-slate-600">
                        Your appointment will be with {availableStaff.find(s => s.id === selectedStaffId)?.name}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Contact Information */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Contact Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <User className="inline h-4 w-4 mr-1" />
                Full Name
              </label>
              <input
                type="text"
                name="customer_name"
                value={formData.customer_name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Mail className="inline h-4 w-4 mr-1" />
                Email
              </label>
              <input
                type="email"
                name="customer_email"
                value={formData.customer_email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Phone className="inline h-4 w-4 mr-1" />
                Phone Number
              </label>
              <input
                type="tel"
                name="customer_phone"
                value={formData.customer_phone}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <FileText className="inline h-4 w-4 mr-1" />
                Special Requests (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !formData.booking_time || !isTimeSlotAvailable(formData.booking_time)}
          className="w-full bg-slate-700 text-white py-3 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting...' : (isRescheduling ? 'Confirm Reschedule' : 'Book Appointment')}
        </button>
      </form>
    </div>
  )
}

export default Book