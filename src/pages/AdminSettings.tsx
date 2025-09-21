import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Save, RotateCcw, AlertTriangle, Mail, Send, Sparkles, Settings, Calendar, ChevronRight, Shield, Bell, CheckCircle, ArrowLeft } from 'lucide-react'
import {
  getBusinessHours,
  saveBusinessHours,
  DEFAULT_BUSINESS_HOURS,
  BusinessHours
} from '../utils/businessHours'
import { supabase } from '../lib/supabase'

const AdminSettings = () => {
  const [businessHours, setBusinessHours] = useState<BusinessHours>(getBusinessHours())
  const [saved, setSaved] = useState(false)
  const [affectedBookings, setAffectedBookings] = useState<any[]>([])
  const [showWarning, setShowWarning] = useState(false)
  const [activeTab, setActiveTab] = useState<'hours' | 'notifications'>('hours')

  const handleChange = (field: keyof BusinessHours, value: string | number) => {
    setBusinessHours({
      ...businessHours,
      [field]: value
    })
    setSaved(false)
  }

  const checkAffectedBookings = async (newHours: BusinessHours) => {
    // Get today's date
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Fetch future bookings
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, date, time, service_id, user_id')
      .gte('date', today.toISOString().split('T')[0])
      .order('date')
      .order('time')

    if (error) {
      console.error('Error fetching bookings:', error)
      return []
    }

    // Parse new business hours
    const [openHour, openMin] = newHours.openTime.split(':').map(Number)
    const [closeHour, closeMin] = newHours.closeTime.split(':').map(Number)
    const openMinutes = openHour * 60 + openMin
    const closeMinutes = closeHour * 60 + closeMin

    // Check which bookings fall outside new hours
    const affected = bookings?.filter(booking => {
      const [bookHour, bookMin] = booking.time.split(':').map(Number)
      const bookMinutes = bookHour * 60 + bookMin
      return bookMinutes < openMinutes || bookMinutes >= closeMinutes
    }) || []

    return affected
  }

  const handleSave = async () => {
    // Check for affected bookings
    const affected = await checkAffectedBookings(businessHours)

    if (affected.length > 0) {
      setAffectedBookings(affected)
      setShowWarning(true)
      return
    }

    // No affected bookings, save immediately
    saveBusinessHours(businessHours)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const confirmSave = () => {
    saveBusinessHours(businessHours)
    setShowWarning(false)
    setAffectedBookings([])
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const cancelSave = () => {
    setShowWarning(false)
    setAffectedBookings([])
  }

  const [sendingReminders, setSendingReminders] = useState(false)
  const [reminderResult, setReminderResult] = useState<string>('')

  const sendReminders = async () => {
    setSendingReminders(true)
    setReminderResult('')

    try {
      // Get tomorrow's date
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = tomorrow.toISOString().split('T')[0]

      // Fetch tomorrow's confirmed bookings
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          *,
          service:service_uuid(name),
          staff:staff_id(name)
        `)
        .eq('booking_date', tomorrowStr)
        .eq('status', 'confirmed')

      if (error) throw error

      if (!bookings || bookings.length === 0) {
        setReminderResult('✓ No bookings for tomorrow')
        setTimeout(() => setReminderResult(''), 5000)
        return
      }

      // Send reminders using EmailJS
      const { sendBookingReminder } = await import('../services/emailService')
      let sentCount = 0
      let failedCount = 0

      for (const booking of bookings) {
        try {
          await sendBookingReminder({
            to: booking.customer_email,
            customerName: booking.customer_name,
            serviceName: booking.service?.name || 'Service',
            date: booking.booking_date,
            time: booking.booking_time.substring(0, 5),
            staffName: booking.staff?.name
          })
          sentCount++
        } catch (err) {
          console.error(`Failed to send reminder to ${booking.customer_email}:`, err)
          failedCount++
        }
      }

      setReminderResult(`✓ Sent ${sentCount} reminder${sentCount !== 1 ? 's' : ''}${failedCount > 0 ? `, ${failedCount} failed` : ''}`)
      setTimeout(() => setReminderResult(''), 5000)
    } catch (error: any) {
      setReminderResult(`✗ Error: ${error.message}`)
      setTimeout(() => setReminderResult(''), 5000)
    } finally {
      setSendingReminders(false)
    }
  }

  const handleReset = () => {
    setBusinessHours(DEFAULT_BUSINESS_HOURS)
    saveBusinessHours(DEFAULT_BUSINESS_HOURS)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  // Generate time options for dropdowns
  const generateTimeOptions = () => {
    const options = []
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        options.push(time)
      }
    }
    return options
  }

  const timeOptions = generateTimeOptions()

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-sage-50">
      {/* Hero Section */}
      <section className="relative pt-40 pb-20 bg-gradient-to-r from-sage-50 via-spa-50 to-rose-50">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-64 h-64 bg-sage-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-rose-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-spa-100 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
        </div>

        <div className="relative container mx-auto px-4 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-gold-300 mb-6">
            <Settings className="h-4 w-4 text-gold-500 mr-2" />
            <span className="text-sm font-medium text-stone-700">Configuration Center</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-light text-stone-800 mb-6">
            Admin
            <span className="block text-4xl md:text-5xl font-normal text-transparent bg-clip-text bg-gradient-to-r from-sage-600 to-spa-600 mt-2">
              Settings
            </span>
          </h1>

          <p className="text-xl text-stone-600 max-w-3xl mx-auto leading-relaxed">
            Manage your spa business configurations and operational preferences
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Navigation */}
          <div className="mb-6">
            <Link to="/admin" className="inline-flex items-center text-stone-600 hover:text-sage-700 transition-colors">
              <ArrowLeft className="h-6 w-6 mr-2" />
              <span className="font-light">Back to Dashboard</span>
            </Link>
          </div>

          {/* Tab Navigation - Desktop */}
          <div className="hidden lg:flex gap-2 mb-8">
            <button
              onClick={() => setActiveTab('hours')}
              className={`px-6 py-3 rounded-xl transition-all duration-300 ${
                activeTab === 'hours'
                  ? 'bg-gradient-to-r from-sage-600 to-sage-700 text-white shadow-lg'
                  : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span className="font-light">Business Hours</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-6 py-3 rounded-xl transition-all duration-300 ${
                activeTab === 'notifications'
                  ? 'bg-gradient-to-r from-sage-600 to-sage-700 text-white shadow-lg'
                  : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span className="font-light">Notifications</span>
              </div>
            </button>
          </div>

          {/* Tab Navigation - Mobile */}
          <div className="lg:hidden grid grid-cols-2 gap-2 mb-8">
            <button
              onClick={() => setActiveTab('hours')}
              className={`px-4 py-3 rounded-xl transition-all duration-300 ${
                activeTab === 'hours'
                  ? 'bg-gradient-to-r from-sage-600 to-sage-700 text-white shadow-lg'
                  : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Clock className="h-5 w-5" />
                <span className="font-medium text-sm">Business Hours</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-4 py-3 rounded-xl transition-all duration-300 ${
                activeTab === 'notifications'
                  ? 'bg-gradient-to-r from-sage-600 to-sage-700 text-white shadow-lg'
                  : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Bell className="h-5 w-5" />
                <span className="font-medium text-sm">Notifications</span>
              </div>
            </button>
          </div>
          {activeTab === 'hours' ? (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden animate-fadeIn">
              <div className="p-8">
                <div className="flex items-center mb-6">
                  <div className="p-2 bg-gradient-to-br from-sage-100 to-spa-100 rounded-xl mr-3">
                    <Clock className="h-6 w-6 text-sage-700" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-light text-stone-800">Business Hours</h2>
                    <p className="text-stone-500 text-sm mt-1">Configure your spa's operating schedule</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="group">
                      <label className="block text-sm font-medium text-stone-600 mb-3 group-hover:text-sage-600 transition-colors">
                        Opening Time
                      </label>
                      <div className="relative">
                        <select
                          value={businessHours.openTime}
                          onChange={(e) => handleChange('openTime', e.target.value)}
                          className="w-full px-4 py-3 bg-gradient-to-br from-white to-sage-50/30 border border-sage-200 rounded-xl focus:ring-2 focus:ring-sage-400 focus:border-transparent transition-all duration-300 hover:shadow-md appearance-none cursor-pointer"
                        >
                          {timeOptions.map(time => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                        <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-sage-400 pointer-events-none" />
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-medium text-stone-600 mb-3 group-hover:text-sage-600 transition-colors">
                        Closing Time
                      </label>
                      <div className="relative">
                        <select
                          value={businessHours.closeTime}
                          onChange={(e) => handleChange('closeTime', e.target.value)}
                          className="w-full px-4 py-3 bg-gradient-to-br from-white to-spa-50/30 border border-spa-200 rounded-xl focus:ring-2 focus:ring-spa-400 focus:border-transparent transition-all duration-300 hover:shadow-md appearance-none cursor-pointer"
                        >
                          {timeOptions.map(time => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                        <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-spa-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-sm font-medium text-stone-600 mb-3 group-hover:text-sage-600 transition-colors">
                      Slot Duration
                    </label>
                    <div className="relative">
                      <select
                        value={businessHours.slotDuration}
                        onChange={(e) => handleChange('slotDuration', Number(e.target.value))}
                        className="w-full px-4 py-3 bg-gradient-to-br from-white to-cream-50 border border-gold-200 rounded-xl focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all duration-300 hover:shadow-md appearance-none cursor-pointer"
                      >
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={45}>45 minutes</option>
                        <option value={60}>60 minutes</option>
                      </select>
                      <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gold-500 pointer-events-none" />
                    </div>
                  </div>

                  {/* Enhanced Preview Card */}
                  <div className="relative overflow-hidden rounded-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-sage-100 via-spa-100 to-cream-100 opacity-50"></div>
                    <div className="relative p-6">
                      <div className="flex items-center mb-4">
                        <Shield className="h-5 w-5 text-sage-600 mr-2" />
                        <span className="text-sm font-semibold text-stone-700">Preview</span>
                      </div>
                      <div className="space-y-3">
                        <p className="text-stone-600">
                          Your spa will operate from{' '}
                          <span className="font-semibold text-sage-700 text-lg">{businessHours.openTime}</span> to{' '}
                          <span className="font-semibold text-spa-700 text-lg">{businessHours.closeTime}</span>
                        </p>
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-sage-500 rounded-full mr-2"></div>
                            <span className="text-stone-600">
                              <span className="font-semibold text-stone-800">{businessHours.slotDuration}</span>-minute slots
                            </span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-gold-500 rounded-full mr-2"></div>
                            <span className="text-stone-600">
                              ~<span className="font-semibold text-stone-800">
                                {Math.floor(
                                  ((parseInt(businessHours.closeTime.split(':')[0]) * 60 +
                                    parseInt(businessHours.closeTime.split(':')[1])) -
                                   (parseInt(businessHours.openTime.split(':')[0]) * 60 +
                                    parseInt(businessHours.openTime.split(':')[1]))) /
                                  businessHours.slotDuration
                                )}
                              </span> daily slots
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Success Message */}
                  {saved && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 animate-slideDown">
                      <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg mr-3">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <p className="text-green-700 font-medium">Settings saved successfully!</p>
                      </div>
                    </div>
                  )}

                  {/* Warning Modal */}
                  {showWarning && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
                      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 animate-scaleIn">
                        <div className="p-6">
                          <div className="flex items-start mb-4">
                            <div className="p-2 bg-orange-100 rounded-xl mr-3">
                              <AlertTriangle className="h-6 w-6 text-orange-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-stone-800">Schedule Conflict Detected</h3>
                              <p className="text-stone-600 mt-1">
                                {affectedBookings.length} booking{affectedBookings.length !== 1 ? 's' : ''} will fall outside the new hours.
                              </p>
                            </div>
                          </div>

                          <div className="bg-orange-50 rounded-xl p-4 mb-6 max-h-40 overflow-y-auto">
                            {affectedBookings.slice(0, 5).map((booking, idx) => (
                              <div key={booking.id} className="flex items-center py-2 text-sm text-orange-700">
                                <ChevronRight className="h-3 w-3 mr-2 text-orange-400" />
                                {booking.date} at {booking.time}
                              </div>
                            ))}
                            {affectedBookings.length > 5 && (
                              <p className="text-xs text-orange-500 italic pt-2 border-t border-orange-200 mt-2">
                                ... and {affectedBookings.length - 5} more bookings
                              </p>
                            )}
                          </div>

                          <div className="flex space-x-3">
                            <button
                              onClick={confirmSave}
                              className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
                            >
                              Continue Anyway
                            </button>
                            <button
                              onClick={cancelSave}
                              className="flex-1 bg-stone-100 text-stone-700 py-3 rounded-xl hover:bg-stone-200 transition-all duration-300 font-medium"
                            >
                              Cancel Changes
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-4 pt-6">
                    <button
                      onClick={handleSave}
                      className="flex-1 group bg-gradient-to-r from-sage-600 to-sage-700 text-white py-4 rounded-xl hover:from-sage-700 hover:to-sage-800 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <Save className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
                      <span className="font-medium">Save Settings</span>
                    </button>
                    <button
                      onClick={handleReset}
                      className="flex-1 group bg-white border-2 border-stone-200 text-stone-700 py-4 rounded-xl hover:bg-stone-50 hover:border-stone-300 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl"
                    >
                      <RotateCcw className="h-5 w-5 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                      <span className="font-medium">Reset to Default</span>
                    </button>
                  </div>
                </div>

                {/* Important Notes */}
                <div className="mt-10 pt-10 border-t border-stone-100">
                  <h3 className="text-lg font-light text-stone-800 mb-6 flex items-center">
                    <div className="p-2 bg-gradient-to-br from-sage-100 to-spa-100 rounded-lg mr-3">
                      <Sparkles className="h-5 w-5 text-sage-600" />
                    </div>
                    Important Notes
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      'Changes apply immediately to the booking page',
                      'Existing bookings are preserved automatically',
                      'Services exceeding hours show as "After Hours"',
                      'Settings are stored locally in your browser'
                    ].map((note, idx) => (
                      <div key={idx} className="flex items-start group">
                        <div className="w-1.5 h-1.5 bg-sage-400 rounded-full mt-2 mr-3 group-hover:scale-150 transition-transform"></div>
                        <span className="text-sm text-stone-600 group-hover:text-stone-800 transition-colors">{note}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden animate-fadeIn">
              <div className="p-8">
                <div className="flex items-center mb-6">
                  <div className="p-2 bg-gradient-to-br from-blue-100 to-spa-100 rounded-xl mr-3">
                    <Mail className="h-6 w-6 text-blue-700" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-light text-stone-800">Email Notifications</h2>
                    <p className="text-stone-500 text-sm mt-1">Manage customer communication preferences</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Send Reminders Card */}
                  <div className="bg-gradient-to-br from-blue-50 to-spa-50 rounded-2xl p-6 border border-blue-100">
                    <div className="flex items-center mb-4">
                      <Bell className="h-5 w-5 text-blue-600 mr-2" />
                      <h3 className="text-lg font-medium text-stone-800">Tomorrow's Reminders</h3>
                    </div>
                    <p className="text-stone-600 mb-6">
                      Send reminder emails to all customers with confirmed bookings for tomorrow.
                    </p>

                    <button
                      onClick={sendReminders}
                      disabled={sendingReminders}
                      className="group bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <Send className={`h-5 w-5 mr-2 ${sendingReminders ? 'animate-pulse' : 'group-hover:translate-x-1'} transition-transform`} />
                      {sendingReminders ? 'Sending...' : 'Send Tomorrow\'s Reminders'}
                    </button>

                    {reminderResult && (
                      <div className={`mt-4 p-3 rounded-xl animate-slideDown ${
                        reminderResult.startsWith('✓')
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-red-100 text-red-700 border border-red-200'
                      }`}>
                        {reminderResult}
                      </div>
                    )}
                  </div>

                  {/* Automatic Emails Info */}
                  <div className="bg-gradient-to-br from-stone-50 to-sage-50 rounded-2xl p-6 border border-stone-200">
                    <div className="flex items-center mb-4">
                      <Sparkles className="h-5 w-5 text-sage-600 mr-2" />
                      <h3 className="text-lg font-medium text-stone-800">Automated Notifications</h3>
                    </div>
                    <div className="space-y-3">
                      {[
                        { icon: '✓', color: 'text-green-500', text: 'Booking confirmations sent immediately' },
                        { icon: '✓', color: 'text-green-500', text: 'Cancellation notices sent automatically' },
                        { icon: '⏰', color: 'text-blue-500', text: 'Daily reminders via scheduled tasks' }
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center group">
                          <span className={`${item.color} mr-3 text-lg group-hover:scale-110 transition-transform`}>
                            {item.icon}
                          </span>
                          <span className="text-stone-600 group-hover:text-stone-800 transition-colors">
                            {item.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminSettings