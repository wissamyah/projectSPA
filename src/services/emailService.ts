import { supabase } from '../lib/supabase'

interface EmailData {
  to: string
  customerName: string
  serviceName: string
  date: string
  time: string
  staffName?: string
  notes?: string
}

const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    // Use Supabase Edge Function for production
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: { to, subject, html }
    })

    if (error) throw error

    // Also log to console in development
    if (import.meta.env.DEV) {
      console.log('📧 Email sent:', { to, subject })

      // Store in localStorage for testing viewer
      const emails = JSON.parse(localStorage.getItem('test_emails') || '[]')
      emails.push({
        to,
        subject,
        timestamp: new Date().toISOString(),
        html
      })
      localStorage.setItem('test_emails', JSON.stringify(emails))
    }

    return data
  } catch (error) {
    console.error('Error sending email:', error)

    // Fallback to localStorage in development if Edge Function fails
    if (import.meta.env.DEV) {
      console.log('📧 Fallback: Email logged locally')
      const emails = JSON.parse(localStorage.getItem('test_emails') || '[]')
      emails.push({
        to,
        subject,
        timestamp: new Date().toISOString(),
        html
      })
      localStorage.setItem('test_emails', JSON.stringify(emails))
      return { success: true, message: 'Email logged locally (Edge Function not available)' }
    }

    throw error
  }
}

export const sendBookingReceived = async (data: EmailData) => {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Booking Request Received 📋</h1>
      </div>

      <div style="background: #f7f7f7; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Dear ${data.customerName},</p>

        <p style="font-size: 16px; color: #333; margin-bottom: 25px;">
          Thank you for your booking request! We've received your appointment details and our team will confirm your booking shortly.
        </p>

        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>⏳ Status:</strong> Pending Confirmation
          </p>
          <p style="margin: 10px 0 0 0; color: #92400e; font-size: 14px;">
            You'll receive a confirmation email once our staff verifies availability.
          </p>
        </div>

        <div style="background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #f59e0b; font-size: 18px; margin-top: 0; border-bottom: 2px solid #f59e0b; padding-bottom: 10px;">
            Requested Appointment
          </h2>

          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; color: #666; font-weight: bold; width: 120px;">Service:</td>
              <td style="padding: 10px 0; color: #333; font-size: 16px;">${data.serviceName}</td>
            </tr>
            <tr style="background: #f9f9f9;">
              <td style="padding: 10px 0; color: #666; font-weight: bold;">Date:</td>
              <td style="padding: 10px 0; color: #333; font-size: 16px;">${new Date(data.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #666; font-weight: bold;">Time:</td>
              <td style="padding: 10px 0; color: #333; font-size: 16px;">${data.time}</td>
            </tr>
            ${data.staffName ? `<tr style="background: #f9f9f9;">
              <td style="padding: 10px 0; color: #666; font-weight: bold;">Preferred Therapist:</td>
              <td style="padding: 10px 0; color: #333; font-size: 16px;">${data.staffName}</td>
            </tr>` : ''}
          </table>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 14px; margin: 5px 0;">We'll get back to you soon!</p>
          <p style="color: #999; font-size: 12px; margin: 5px 0;">Usually within 1-2 hours during business hours</p>
        </div>
      </div>
    </div>
  `

  return sendEmail(data.to, `Booking Request Received - ${data.serviceName}`, html)
}

export const sendBookingConfirmation = async (data: EmailData) => {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Booking Confirmed! ✨</h1>
      </div>

      <div style="background: #f7f7f7; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Dear ${data.customerName},</p>

        <p style="font-size: 16px; color: #333; margin-bottom: 25px;">
          Great news! Your spa appointment has been confirmed. We're looking forward to seeing you!
        </p>

        <div style="background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #667eea; font-size: 18px; margin-top: 0; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
            Appointment Details
          </h2>

          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; color: #666; font-weight: bold; width: 120px;">Service:</td>
              <td style="padding: 10px 0; color: #333; font-size: 16px;">${data.serviceName}</td>
            </tr>
            <tr style="background: #f9f9f9;">
              <td style="padding: 10px 0; color: #666; font-weight: bold;">Date:</td>
              <td style="padding: 10px 0; color: #333; font-size: 16px;">${new Date(data.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #666; font-weight: bold;">Time:</td>
              <td style="padding: 10px 0; color: #333; font-size: 16px;">${data.time}</td>
            </tr>
            ${data.staffName ? `<tr style="background: #f9f9f9;">
              <td style="padding: 10px 0; color: #666; font-weight: bold;">Therapist:</td>
              <td style="padding: 10px 0; color: #333; font-size: 16px;">${data.staffName}</td>
            </tr>` : ''}
          </table>
        </div>

        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-top: 20px; border-radius: 4px;">
          <p style="margin: 0; color: #856404; font-size: 14px;">
            <strong>Cancellation Policy:</strong> Please arrive 10 minutes early. Cancellations must be made at least 2 hours in advance.
          </p>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 14px; margin: 5px 0;">Thank you for choosing our spa!</p>
        </div>
      </div>
    </div>
  `

  return sendEmail(data.to, `Booking Confirmation - ${data.serviceName}`, html)
}

export const sendBookingReminder = async (data: EmailData) => {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Appointment Reminder 📅</h1>
      </div>

      <div style="background: #f7f7f7; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Dear ${data.customerName},</p>

        <p style="font-size: 16px; color: #333; margin-bottom: 25px;">
          This is a friendly reminder about your appointment tomorrow.
        </p>

        <div style="background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #3b82f6; font-size: 18px; margin-top: 0;">Tomorrow's Appointment</h2>
          <p style="font-size: 16px; margin: 10px 0;"><strong>Service:</strong> ${data.serviceName}</p>
          <p style="font-size: 16px; margin: 10px 0;"><strong>Time:</strong> ${data.time}</p>
          ${data.staffName ? `<p style="font-size: 16px; margin: 10px 0;"><strong>Therapist:</strong> ${data.staffName}</p>` : ''}
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #666; font-size: 14px;">Please arrive 10 minutes early. We look forward to seeing you!</p>
        </div>
      </div>
    </div>
  `

  return sendEmail(data.to, `Appointment Reminder - Tomorrow at ${data.time}`, html)
}

export const sendRescheduleNotification = async (data: EmailData & {
  originalDate: string,
  originalTime: string,
  newDate: string,
  newTime: string,
  reason?: string
}) => {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Appointment Rescheduled 📅</h1>
      </div>

      <div style="background: #f7f7f7; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Dear ${data.customerName},</p>

        <p style="font-size: 16px; color: #333; margin-bottom: 25px;">
          Your appointment has been successfully rescheduled.
        </p>

        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
          <h3 style="margin: 0 0 10px 0; color: #92400e; font-size: 16px;">⚠️ NEW DATE AND TIME</h3>
          <p style="margin: 0; color: #92400e; font-size: 18px; font-weight: bold;">
            ${new Date(data.newDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${data.newTime}
          </p>
        </div>

        <div style="background: white; border-radius: 8px; padding: 20px;">
          <p style="color: #999; font-size: 14px; margin-bottom: 10px;">
            <strong>Previous:</strong> <span style="text-decoration: line-through;">${new Date(data.originalDate).toLocaleDateString()} at ${data.originalTime}</span>
          </p>
          <p style="font-size: 16px; margin: 10px 0;"><strong>Service:</strong> ${data.serviceName}</p>
          ${data.staffName ? `<p style="font-size: 16px; margin: 10px 0;"><strong>Therapist:</strong> ${data.staffName}</p>` : ''}
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #666; font-size: 14px;">Please update your calendar. We look forward to seeing you!</p>
        </div>
      </div>
    </div>
  `

  return sendEmail(data.to, `Appointment Rescheduled - ${data.serviceName}`, html)
}

export const sendCancellationNotification = async (data: EmailData & { reason?: string }) => {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #f93b3b 0%, #ff6b6b 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Appointment Cancelled</h1>
      </div>

      <div style="background: #f7f7f7; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Dear ${data.customerName},</p>

        <p style="font-size: 16px; color: #333; margin-bottom: 25px;">
          Your appointment has been cancelled as requested.
        </p>

        <div style="background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #f93b3b; font-size: 18px; margin-top: 0;">Cancelled Appointment</h2>
          <p style="font-size: 16px; margin: 10px 0;"><strong>Service:</strong> ${data.serviceName}</p>
          <p style="font-size: 16px; margin: 10px 0;"><strong>Date:</strong> ${new Date(data.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p style="font-size: 16px; margin: 10px 0;"><strong>Time:</strong> ${data.time}</p>
          ${data.reason ? `<p style="font-size: 16px; margin: 10px 0;"><strong>Reason:</strong> ${data.reason}</p>` : ''}
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #666; font-size: 14px;">We hope to see you again soon! Feel free to book a new appointment anytime.</p>
        </div>
      </div>
    </div>
  `

  return sendEmail(data.to, `Appointment Cancelled - ${data.serviceName}`, html)
}

// Helper function to view test emails (development only)
export const getTestEmails = () => {
  return JSON.parse(localStorage.getItem('test_emails') || '[]')
}

export const clearTestEmails = () => {
  localStorage.removeItem('test_emails')
}