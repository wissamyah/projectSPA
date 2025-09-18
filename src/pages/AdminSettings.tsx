import { useState, useEffect } from 'react'
import { Clock, Save, RotateCcw, AlertTriangle, Mail, Send } from 'lucide-react'
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
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Admin Settings</h1>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-6">
          <Clock className="h-6 w-6 text-slate-700 mr-2" />
          <h2 className="text-xl font-semibold text-slate-800">Business Hours</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Opening Time
            </label>
            <select
              value={businessHours.openTime}
              onChange={(e) => handleChange('openTime', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
            >
              {timeOptions.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Closing Time
            </label>
            <select
              value={businessHours.closeTime}
              onChange={(e) => handleChange('closeTime', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
            >
              {timeOptions.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Slot Duration (minutes)
            </label>
            <select
              value={businessHours.slotDuration}
              onChange={(e) => handleChange('slotDuration', Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
          </div>

          {/* Preview */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-slate-700 mb-2">Preview</p>
            <p className="text-sm text-slate-600">
              The spa will be open from <span className="font-semibold">{businessHours.openTime}</span> to{' '}
              <span className="font-semibold">{businessHours.closeTime}</span> with{' '}
              <span className="font-semibold">{businessHours.slotDuration}-minute</span> booking slots.
            </p>
            <p className="text-sm text-slate-500 mt-2">
              This will generate approximately{' '}
              <span className="font-semibold">
                {Math.floor(
                  ((parseInt(businessHours.closeTime.split(':')[0]) * 60 + 
                    parseInt(businessHours.closeTime.split(':')[1])) -
                   (parseInt(businessHours.openTime.split(':')[0]) * 60 + 
                    parseInt(businessHours.openTime.split(':')[1]))) / 
                  businessHours.slotDuration
                )}
              </span>{' '}
              time slots per day.
            </p>
          </div>

          {saved && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-700">Settings saved successfully!</p>
            </div>
          )}
          
          {showWarning && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-orange-600 mr-2 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-orange-800 mb-2">
                    Warning: Existing Bookings Outside New Hours
                  </p>
                  <p className="text-sm text-orange-700 mb-3">
                    {affectedBookings.length} booking{affectedBookings.length !== 1 ? 's' : ''} will fall outside the new business hours.
                    These bookings will be preserved and marked as "Out of Hours" but customers won't be able to book new appointments during these times.
                  </p>
                  <div className="max-h-32 overflow-y-auto mb-3 bg-white rounded p-2 border border-orange-200">
                    {affectedBookings.slice(0, 5).map((booking, idx) => (
                      <div key={booking.id} className="text-xs text-orange-600 py-1">
                        {booking.date} at {booking.time}
                      </div>
                    ))}
                    {affectedBookings.length > 5 && (
                      <p className="text-xs text-orange-500 italic pt-1">
                        ... and {affectedBookings.length - 5} more
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={confirmSave}
                      className="px-4 py-2 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
                    >
                      Continue and Save
                    </button>
                    <button
                      onClick={cancelSave}
                      className="px-4 py-2 border border-orange-300 text-orange-700 text-sm rounded hover:bg-orange-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex space-x-4">
            <button
              onClick={handleSave}
              className="flex-1 bg-slate-700 text-white py-2 rounded-lg hover:bg-slate-800 flex items-center justify-center"
            >
              <Save className="h-5 w-5 mr-2" />
              Save Settings
            </button>
            <button
              onClick={handleReset}
              className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-center"
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Reset to Default
            </button>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Important Notes</h3>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start">
              <span className="text-slate-400 mr-2">•</span>
              Changes will apply immediately to the booking page
            </li>
            <li className="flex items-start">
              <span className="text-slate-400 mr-2">•</span>
              Existing bookings outside new hours will be preserved but marked as "Out of Hours"
            </li>
            <li className="flex items-start">
              <span className="text-slate-400 mr-2">•</span>
              Services that exceed the closing time will show as "After Hours"
            </li>
            <li className="flex items-start">
              <span className="text-slate-400 mr-2">•</span>
              Settings are stored locally in the browser
            </li>
          </ul>
        </div>
      </div>
      
      {/* Email Notifications Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <div className="flex items-center mb-6">
          <Mail className="h-6 w-6 text-slate-700 mr-2" />
          <h2 className="text-xl font-semibold text-slate-800">Email Notifications</h2>
        </div>
        
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Send Reminder Emails</h3>
            <p className="text-sm text-slate-600 mb-4">
              Send reminder emails to all customers with confirmed bookings for tomorrow.
            </p>
            
            <button
              onClick={sendReminders}
              disabled={sendingReminders}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Send className="h-4 w-4 mr-2" />
              {sendingReminders ? 'Sending...' : 'Send Tomorrow\'s Reminders'}
            </button>
            
            {reminderResult && (
              <p className={`text-sm mt-3 ${reminderResult.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>
                {reminderResult}
              </p>
            )}
          </div>
          
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Automatic Emails</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Booking confirmations are sent immediately after booking</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Cancellation notifications are sent when appointments are cancelled</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">⏰</span>
                <span>Reminder emails should be scheduled as a daily cron job</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              <strong>Note:</strong> Email functionality requires configuring RESEND_API_KEY in your Supabase Edge Function environment variables.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminSettings