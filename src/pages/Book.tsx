import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Calendar, Clock, User, Mail, Phone, FileText, AlertCircle, CheckCircle, Ban, Moon, Sparkles, ChevronRight, Flower2, Heart, Check, ArrowLeft, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import {
  getBusinessHours,
  generateTimeSlots,
  getSlotUnavailableReason,
  SlotUnavailableReason
} from '../utils/businessHours'
import { useModal } from '../contexts/ModalContext'

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
  const { showAlert } = useModal()

  // Check if this is a reschedule
  const [rescheduleBooking, setRescheduleBooking] = useState<any>(null)
  const [isRescheduling, setIsRescheduling] = useState(false)

  // Step management
  const [currentStep, setCurrentStep] = useState(1)

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
  const [allStaffForService, setAllStaffForService] = useState<Staff[]>([])
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [availableStaff, setAvailableStaff] = useState<Staff[]>([])
  const [selectedStaffId, setSelectedStaffId] = useState<string>('')
  const [loadingServices, setLoadingServices] = useState(true)

  // Get dynamic time slots based on business hours
  const businessHours = getBusinessHours()
  const timeSlots = generateTimeSlots(businessHours)

  const steps = [
    { number: 1, title: 'Service', icon: <Sparkles className="h-5 w-5" /> },
    { number: 2, title: 'Date & Time', icon: <Calendar className="h-5 w-5" /> },
    { number: 3, title: 'Therapist', icon: <Heart className="h-5 w-5" /> },
    { number: 4, title: 'Details', icon: <User className="h-5 w-5" /> }
  ]

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

      const availableServices = servicesWithStaff?.filter(service =>
        service.staff_services?.some((ss: any) => ss.staff?.is_active)
      ) || []

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
      const selectedService = services.find(s => s.id === formData.service_id)
      const serviceDuration = selectedService?.duration || 60
      const slotIndex = timeSlots.indexOf(formData.booking_time)
      const slotsNeeded = Math.ceil(serviceDuration / businessHours.slotDuration)

      const { data: staffForService, error: staffError } = await supabase
        .from('staff_services')
        .select('staff:staff_id(*)')
        .eq('service_id', formData.service_id)

      if (staffError) throw staffError

      const qualifiedStaff = staffForService
        ?.map((ss: any) => ss.staff)
        .filter((s: any) => s?.is_active) || []

      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('booking_time, service_uuid, staff_id, status')
        .eq('booking_date', formData.booking_date)
        .in('status', ['confirmed', 'pending'])

      if (bookingsError) throw bookingsError

      const serviceIds = [...new Set(bookings?.map(b => b.service_uuid).filter(Boolean) || [])]
      let bookedServices: any[] = []
      if (serviceIds.length > 0) {
        const { data } = await supabase
          .from('services')
          .select('id, duration')
          .in('id', serviceIds)
        bookedServices = data || []
      }

      const availableStaffList = qualifiedStaff.filter((staff: Staff) => {
        const staffBookings = bookings?.filter(b => b.staff_id === staff.id) || []

        for (const booking of staffBookings) {
          const bookingService = bookedServices.find(s => s.id === booking.service_uuid)
          const bookingDuration = bookingService?.duration || 60
          const bookingStartTime = booking.booking_time.substring(0, 5)
          const bookingStartIndex = timeSlots.indexOf(bookingStartTime)

          if (bookingStartIndex !== -1) {
            const bookingSlotsNeeded = Math.ceil(bookingDuration / businessHours.slotDuration)

            for (let i = 0; i < slotsNeeded; i++) {
              const checkIndex = slotIndex + i
              if (checkIndex >= bookingStartIndex && checkIndex < bookingStartIndex + bookingSlotsNeeded) {
                return false
              }
            }

            for (let i = 0; i < bookingSlotsNeeded; i++) {
              const checkIndex = bookingStartIndex + i
              if (checkIndex >= slotIndex && checkIndex < slotIndex + slotsNeeded) {
                return false
              }
            }
          }
        }

        return true
      })

      setAvailableStaff(availableStaffList)
    } catch (error) {
      console.error('Error fetching available staff:', error)
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
      const { data: staffForService, error: staffError } = await supabase
        .from('staff_services')
        .select('staff:staff_id(*)')
        .eq('service_id', formData.service_id)

      if (staffError) throw staffError

      const qualifiedStaff = staffForService
        ?.map((ss: any) => ss.staff)
        .filter((s: any) => s?.is_active) || []

      setAllStaffForService(qualifiedStaff)

      if (qualifiedStaff.length === 0) {
        setBookedSlots(timeSlots)
        return
      }

      const selectedService = services.find(s => s.id === formData.service_id)
      const serviceDuration = selectedService?.duration || 60

      const { data: allBookings, error } = await supabase
        .from('bookings')
        .select('booking_time, service_uuid, staff_id, status')
        .eq('booking_date', formData.booking_date)
        .in('status', ['confirmed', 'pending'])

      if (error) throw error

      const blockedSlots: string[] = []

      const serviceIds = [...new Set(allBookings?.map(b => b.service_uuid).filter(Boolean) || [])]
      let bookedServices: any[] = []
      if (serviceIds.length > 0) {
        const { data } = await supabase
          .from('services')
          .select('id, duration')
          .in('id', serviceIds)
        bookedServices = data || []
      }

      timeSlots.forEach(timeSlot => {
        const slotIndex = timeSlots.indexOf(timeSlot)
        let availableStaffCount = 0

        qualifiedStaff.forEach((staff: Staff) => {
          let isStaffAvailable = true

          allBookings?.forEach(booking => {
            if (booking.staff_id === staff.id) {
              const bookingService = bookedServices.find(s => s.id === booking.service_uuid)
              const bookingDuration = bookingService?.duration || 60
              const bookingStartTime = booking.booking_time.substring(0, 5)
              const bookingStartIndex = timeSlots.indexOf(bookingStartTime)

              if (bookingStartIndex !== -1) {
                const bookingSlotsNeeded = Math.ceil(bookingDuration / businessHours.slotDuration)

                if (slotIndex >= bookingStartIndex && slotIndex < bookingStartIndex + bookingSlotsNeeded) {
                  isStaffAvailable = false
                }

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
      return 'bg-gradient-to-r from-sage-600 to-sage-700 text-white shadow-lg scale-105'
    }

    switch (status) {
      case 'booked':
        return 'bg-rose-50 text-rose-400 cursor-not-allowed border-rose-200'
      case 'after-hours':
        return 'bg-stone-100 text-stone-400 cursor-not-allowed border-stone-200'
      case 'insufficient-time':
        return 'bg-amber-50 text-amber-400 cursor-not-allowed border-amber-200'
      default:
        return 'bg-white border-2 border-sage-200 hover:border-sage-400 hover:bg-sage-50 text-stone-700'
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

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return formData.service_id !== ''
      case 2:
        return formData.booking_date !== '' && formData.booking_time !== ''
      case 3:
        return availableStaff.length === 0 || selectedStaffId !== ''
      case 4:
        return formData.customer_name !== '' && formData.customer_email !== ''
      default:
        return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isTimeSlotAvailable(formData.booking_time)) {
      await showAlert('This time slot is no longer available. Please select another time.', 'warning')
      return
    }

    if (availableStaff.length > 0 && !selectedStaffId) {
      await showAlert('Please select a therapist for your appointment.', 'warning')
      return
    }

    setLoading(true)

    try {
      if (isRescheduling && rescheduleBooking) {
        const { error } = await supabase
          .from('bookings')
          .update({
            booking_date: formData.booking_date,
            booking_time: formData.booking_time,
            staff_id: selectedStaffId || null,
            notes: formData.notes ? `Rescheduled: ${formData.notes}` : 'Rescheduled from ' + rescheduleBooking.original_date + ' ' + rescheduleBooking.original_time,
            status: 'confirmed'
          })
          .eq('id', rescheduleBooking.id)

        if (error) throw error

        await showAlert('Your appointment has been successfully rescheduled!', 'success')
        navigate('/dashboard')
      } else {
        const bookingData = {
          ...formData,
          service_uuid: formData.service_id,
          service_id: formData.service_id,
          staff_id: selectedStaffId || null,
          user_id: user?.id || null,
          status: 'pending'
        }

        const { error } = await supabase
          .from('bookings')
          .insert([bookingData])

        if (error) throw error

        try {
          const { sendBookingReceived } = await import('../services/emailService')
          const selectedService = services.find(s => s.id === formData.service_id)
          await sendBookingReceived({
            to: formData.customer_email,
            customerName: formData.customer_name,
            serviceName: selectedService?.name || 'Service',
            date: formData.booking_date,
            time: formData.booking_time,
            staffName: availableStaff.find(s => s.id === selectedStaffId)?.name,
            notes: formData.notes
          })
        } catch (emailError) {
          console.error('Failed to send booking received email:', emailError)
        }

        await showAlert('Booking submitted successfully! You will receive an email confirmation once our staff reviews your request.', 'success')
        navigate('/dashboard')
      }
    } catch (error: any) {
      await showAlert('Error ' + (isRescheduling ? 'rescheduling' : 'creating') + ' booking: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const selectedService = services.find(s => s.id === formData.service_id)

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
            <Flower2 className="h-4 w-4 text-gold-500 mr-2" />
            <span className="text-sm font-medium text-stone-700">
              {isRescheduling ? 'Reschedule Appointment' : 'Reserve Your Experience'}
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-light text-stone-800 mb-6">
            Book Your
            <span className="block text-4xl md:text-5xl font-normal text-transparent bg-clip-text bg-gradient-to-r from-sage-600 to-spa-600 mt-2">
              Wellness Journey
            </span>
          </h1>

          <p className="text-xl text-stone-600 max-w-3xl mx-auto leading-relaxed">
            Select your preferred treatment and time to begin your personalized spa experience
          </p>
        </div>
      </section>

      {/* Step Indicator Section */}
      <section className="bg-white/50 backdrop-blur-sm py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-2 md:space-x-4">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div
                    className={`flex items-center px-4 py-2 rounded-full transition-all duration-300 ${
                      currentStep === step.number
                        ? 'bg-gradient-to-r from-sage-600 to-sage-700 text-white shadow-lg'
                        : currentStep > step.number
                        ? 'bg-sage-100 text-sage-700'
                        : 'bg-white border-2 border-sage-200 text-stone-400'
                    }`}
                  >
                    <div className="mr-2">
                      {currentStep > step.number ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        step.icon
                      )}
                    </div>
                    <span className="hidden md:inline font-medium">{step.title}</span>
                    <span className="md:hidden font-medium">{step.number}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <ChevronRight className={`mx-2 h-4 w-4 ${
                      currentStep > step.number ? 'text-sage-600' : 'text-stone-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Reschedule Notice */}
      {isRescheduling && rescheduleBooking && (
        <section className="py-4">
          <div className="container mx-auto px-4">
            <div className="bg-spa-50 border border-spa-200 rounded-2xl p-4 max-w-4xl mx-auto">
              <p className="text-sm text-spa-800 flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                <strong>Rescheduling from:</strong>
                <span className="ml-2">{rescheduleBooking.original_date} at {rescheduleBooking.original_time}</span>
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Main Content Section */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit}>
          {/* Step 1: Service Selection */}
          {currentStep === 1 && (
            <div className="bg-white rounded-3xl shadow-xl p-8 animate-slide-up">
              <h2 className="text-2xl font-light text-stone-800 mb-6 flex items-center">
                <Sparkles className="h-6 w-6 mr-3 text-gold-500" />
                Select Your Treatment
              </h2>

              {loadingServices ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center space-x-2">
                    <div className="w-2 h-2 bg-sage-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-sage-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-sage-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <p className="text-stone-600 mt-4">Loading available treatments...</p>
                </div>
              ) : services.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-amber-600 mr-3" />
                    <p className="text-amber-800">
                      No services are currently available. Please check back later.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4">
                    {services.map((service) => (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, service_id: service.id })}
                        className={`text-left p-6 rounded-2xl border-2 transition-all duration-300 ${
                          formData.service_id === service.id
                            ? 'border-sage-500 bg-gradient-to-r from-sage-50 to-spa-50 shadow-lg'
                            : 'border-sage-200 hover:border-sage-400 hover:shadow-md bg-white'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-stone-800 mb-2">{service.name}</h3>
                            {service.description && (
                              <p className="text-sm text-stone-600 mb-3">{service.description}</p>
                            )}
                            <div className="flex items-center space-x-4 text-sm">
                              <span className="flex items-center text-spa-700">
                                <Clock className="h-4 w-4 mr-1" />
                                {service.duration} min
                              </span>
                              <span className="text-2xl font-light text-sage-700">
                                ${service.price}
                              </span>
                            </div>
                          </div>
                          {formData.service_id === service.id && (
                            <div className="ml-4">
                              <div className="w-8 h-8 bg-gradient-to-r from-sage-600 to-sage-700 rounded-full flex items-center justify-center">
                                <Check className="h-5 w-5 text-white" />
                              </div>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceedToNextStep()}
                  className="group bg-gradient-to-r from-sage-600 to-sage-700 text-white px-8 py-3 rounded-full hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center space-x-2"
                >
                  <span>Continue</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Date & Time Selection */}
          {currentStep === 2 && (
            <div className="bg-white rounded-3xl shadow-xl p-8 animate-slide-up">
              <h2 className="text-2xl font-light text-stone-800 mb-6 flex items-center">
                <Calendar className="h-6 w-6 mr-3 text-gold-500" />
                Choose Your Date & Time
              </h2>

              {/* Business Hours Notice */}
              <div className="bg-gradient-to-r from-spa-50 to-sage-50 rounded-2xl p-4 mb-6">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-sage-600 mr-2" />
                  <p className="text-sm text-stone-700">
                    <span className="font-medium">Spa Hours:</span> {businessHours.openTime} - {businessHours.closeTime}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-3">
                    Select Date
                  </label>
                  <input
                    type="date"
                    name="booking_date"
                    value={formData.booking_date}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full px-5 py-3 border-2 border-sage-200 rounded-xl focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                {formData.booking_date && (
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-3">
                      Select Time
                      {checkingAvailability && (
                        <span className="ml-2 text-sage-600 text-sm">(Checking availability...)</span>
                      )}
                    </label>

                    {formData.service_id ? (
                      <>
                        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                          {timeSlots.map((time) => {
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
                                  px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 border-2
                                  ${getSlotClassName(time, status)}
                                `}
                              >
                                <div>{time}</div>
                                {status && (
                                  <div className="flex items-center justify-center mt-1">
                                    {getSlotIcon(status)}
                                  </div>
                                )}
                              </button>
                            )
                          })}
                        </div>

                        {/* Legend */}
                        <div className="mt-6 flex flex-wrap gap-4 text-xs">
                          <div className="flex items-center">
                            <div className="w-4 h-4 bg-white border-2 border-sage-200 rounded mr-2"></div>
                            <span className="text-stone-600">Available</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-4 h-4 bg-rose-50 border-2 border-rose-200 rounded mr-2"></div>
                            <span className="text-stone-600">Booked</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-4 h-4 bg-stone-100 border-2 border-stone-200 rounded mr-2"></div>
                            <span className="text-stone-600">After Hours</span>
                          </div>
                        </div>

                        {formData.booking_time && isTimeSlotAvailable(formData.booking_time) && (
                          <div className="mt-4 bg-sage-50 border border-sage-200 rounded-xl p-4">
                            <p className="text-sage-700 flex items-center">
                              <CheckCircle className="h-5 w-5 mr-2" />
                              Selected: {formData.booking_date} at {formData.booking_time}
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <p className="text-amber-800 flex items-center">
                          <AlertCircle className="h-5 w-5 mr-2" />
                          Please select a service first
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="group border-2 border-sage-300 text-sage-700 px-8 py-3 rounded-full hover:bg-sage-50 transition-all duration-300 flex items-center space-x-2"
                >
                  <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceedToNextStep()}
                  className="group bg-gradient-to-r from-sage-600 to-sage-700 text-white px-8 py-3 rounded-full hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center space-x-2"
                >
                  <span>Continue</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Therapist Selection */}
          {currentStep === 3 && (
            <div className="bg-white rounded-3xl shadow-xl p-8 animate-slide-up">
              <h2 className="text-2xl font-light text-stone-800 mb-6 flex items-center">
                <Heart className="h-6 w-6 mr-3 text-gold-500" />
                Select Your Therapist
              </h2>

              {availableStaff.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-amber-600 mr-3" />
                    <p className="text-amber-800">
                      No therapists available for this time. Please select a different time.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-stone-600 mb-4">
                    Choose your preferred therapist for this treatment
                  </p>
                  <div className="grid gap-4">
                    {availableStaff.map((staff) => (
                      <button
                        key={staff.id}
                        type="button"
                        onClick={() => setSelectedStaffId(staff.id)}
                        className={`text-left p-6 rounded-2xl border-2 transition-all duration-300 ${
                          selectedStaffId === staff.id
                            ? 'border-sage-500 bg-gradient-to-r from-sage-50 to-spa-50 shadow-lg'
                            : 'border-sage-200 hover:border-sage-400 hover:shadow-md bg-white'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-rose-100 to-sage-100 rounded-full flex items-center justify-center">
                              <User className="h-6 w-6 text-sage-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-medium text-stone-800">{staff.name}</h3>
                              <p className="text-sm text-stone-600">Expert Therapist</p>
                            </div>
                          </div>
                          {selectedStaffId === staff.id && (
                            <div className="w-8 h-8 bg-gradient-to-r from-sage-600 to-sage-700 rounded-full flex items-center justify-center">
                              <Check className="h-5 w-5 text-white" />
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="group border-2 border-sage-300 text-sage-700 px-8 py-3 rounded-full hover:bg-sage-50 transition-all duration-300 flex items-center space-x-2"
                >
                  <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceedToNextStep()}
                  className="group bg-gradient-to-r from-sage-600 to-sage-700 text-white px-8 py-3 rounded-full hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center space-x-2"
                >
                  <span>Continue</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Contact Information */}
          {currentStep === 4 && (
            <div className="bg-white rounded-3xl shadow-xl p-8 animate-slide-up">
              <h2 className="text-2xl font-light text-stone-800 mb-6 flex items-center">
                <User className="h-6 w-6 mr-3 text-gold-500" />
                Your Information
              </h2>

              {/* Booking Summary */}
              <div className="bg-gradient-to-r from-sage-50 to-spa-50 rounded-2xl p-6 mb-6">
                <h3 className="text-lg font-medium text-stone-800 mb-4">Booking Summary</h3>
                <div className="space-y-2 text-sm text-stone-700">
                  {selectedService && (
                    <div className="flex justify-between">
                      <span>Treatment:</span>
                      <span className="font-medium">{selectedService.name}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span className="font-medium">{formData.booking_date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time:</span>
                    <span className="font-medium">{formData.booking_time}</span>
                  </div>
                  {selectedStaffId && (
                    <div className="flex justify-between">
                      <span>Therapist:</span>
                      <span className="font-medium">
                        {availableStaff.find(s => s.id === selectedStaffId)?.name}
                      </span>
                    </div>
                  )}
                  {selectedService && (
                    <div className="flex justify-between pt-2 border-t border-sage-200">
                      <span>Total:</span>
                      <span className="text-lg font-medium text-sage-700">${selectedService.price}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-5 py-3 border-2 border-sage-200 rounded-xl focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="customer_email"
                    value={formData.customer_email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-5 py-3 border-2 border-sage-200 rounded-xl focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all duration-200"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="customer_phone"
                    value={formData.customer_phone}
                    onChange={handleInputChange}
                    className="w-full px-5 py-3 border-2 border-sage-200 rounded-xl focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all duration-200"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Special Requests (Optional)
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-5 py-3 border-2 border-sage-200 rounded-xl focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all duration-200"
                    placeholder="Any special requests or notes for your appointment..."
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="group border-2 border-sage-300 text-sage-700 px-8 py-3 rounded-full hover:bg-sage-50 transition-all duration-300 flex items-center space-x-2"
                >
                  <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={loading || !canProceedToNextStep()}
                  className="group bg-gradient-to-r from-gold-400 to-gold-500 text-stone-900 px-10 py-3 rounded-full hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center space-x-2 font-medium"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-stone-900/30 border-t-stone-900 rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>{isRescheduling ? 'Confirm Reschedule' : 'Complete Booking'}</span>
                      <CheckCircle className="h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Book