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

export const sendBookingConfirmation = async (data: EmailData) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e293b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; padding: 10px 0; border-bottom: 1px solid #eee; }
        .detail-label { font-weight: bold; width: 120px; }
        .button { display: inline-block; padding: 12px 30px; background: #1e293b; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Booking Confirmation</h1>
        </div>
        <div class="content">
          <p>Dear ${data.customerName},</p>
          <p>Your appointment has been successfully booked! We look forward to seeing you.</p>
          
          <div class="booking-details">
            <h3>Appointment Details:</h3>
            <div class="detail-row">
              <span class="detail-label">Service:</span>
              <span>${data.serviceName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date:</span>
              <span>${new Date(data.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Time:</span>
              <span>${data.time}</span>
            </div>
            ${data.staffName ? `
            <div class="detail-row">
              <span class="detail-label">Staff:</span>
              <span>${data.staffName}</span>
            </div>
            ` : ''}
            ${data.notes ? `
            <div class="detail-row">
              <span class="detail-label">Notes:</span>
              <span>${data.notes}</span>
            </div>
            ` : ''}
          </div>
          
          <p><strong>Cancellation Policy:</strong> Please note that cancellations must be made at least 2 hours before your appointment time.</p>
          
          <div class="footer">
            <p>If you need to reschedule or cancel, please log into your account or contact us.</p>
            <p>Thank you for choosing our spa!</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    const { data: result, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: data.to,
        subject: `Booking Confirmation - ${data.serviceName}`,
        html
      }
    })

    if (error) throw error
    return result
  } catch (error) {
    console.error('Error sending confirmation email:', error)
    throw error
  }
}

export const sendBookingReminder = async (data: EmailData) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; padding: 10px 0; border-bottom: 1px solid #eee; }
        .detail-label { font-weight: bold; width: 120px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Appointment Reminder</h1>
        </div>
        <div class="content">
          <p>Dear ${data.customerName},</p>
          <p>This is a friendly reminder about your upcoming appointment tomorrow.</p>
          
          <div class="booking-details">
            <h3>Appointment Details:</h3>
            <div class="detail-row">
              <span class="detail-label">Service:</span>
              <span>${data.serviceName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date:</span>
              <span>${new Date(data.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Time:</span>
              <span>${data.time}</span>
            </div>
            ${data.staffName ? `
            <div class="detail-row">
              <span class="detail-label">Staff:</span>
              <span>${data.staffName}</span>
            </div>
            ` : ''}
          </div>
          
          <p>Please arrive 10 minutes early to check in. If you need to reschedule or cancel, please do so at least 2 hours before your appointment time.</p>
          
          <div class="footer">
            <p>We look forward to seeing you!</p>
            <p>Thank you for choosing our spa!</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    const { data: result, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: data.to,
        subject: `Appointment Reminder - Tomorrow at ${data.time}`,
        html
      }
    })

    if (error) throw error
    return result
  } catch (error) {
    console.error('Error sending reminder email:', error)
    throw error
  }
}

export const sendRescheduleNotification = async (data: EmailData & { originalDate: string, originalTime: string, newDate: string, newTime: string, reason?: string }) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; padding: 10px 0; border-bottom: 1px solid #eee; }
        .detail-label { font-weight: bold; width: 120px; }
        .highlight { background: #fef3c7; padding: 15px; border-radius: 8px; border: 1px solid #fbbf24; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Appointment Rescheduled</h1>
        </div>
        <div class="content">
          <p>Dear ${data.customerName},</p>
          <p>Your appointment has been rescheduled. Please note the new date and time below.</p>
          
          <div class="highlight">
            <h3 style="margin-top: 0;">New Appointment Details:</h3>
            <div class="detail-row">
              <span class="detail-label">Service:</span>
              <span>${data.serviceName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">New Date:</span>
              <span><strong>${new Date(data.newDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong></span>
            </div>
            <div class="detail-row">
              <span class="detail-label">New Time:</span>
              <span><strong>${data.newTime}</strong></span>
            </div>
            ${data.staffName ? `
            <div class="detail-row">
              <span class="detail-label">Staff:</span>
              <span>${data.staffName}</span>
            </div>
            ` : ''}
          </div>
          
          <div class="booking-details">
            <h4>Previous Appointment:</h4>
            <p style="text-decoration: line-through; color: #666;">
              ${new Date(data.originalDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${data.originalTime}
            </p>
            ${data.reason ? `
            <p style="margin-top: 10px;"><strong>Reason:</strong> ${data.reason}</p>
            ` : ''}
          </div>
          
          <p>If this new time doesn't work for you, please contact us immediately to find an alternative.</p>
          
          <div class="footer">
            <p>We apologize for any inconvenience and look forward to seeing you at the new time.</p>
            <p>Thank you for your understanding!</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    const { data: result, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: data.to,
        subject: `Appointment Rescheduled - ${data.serviceName}`,
        html
      }
    })

    if (error) throw error
    return result
  } catch (error) {
    console.error('Error sending reschedule notification:', error)
    throw error
  }
}

export const sendCancellationNotification = async (data: EmailData & { reason?: string }) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; padding: 10px 0; border-bottom: 1px solid #eee; }
        .detail-label { font-weight: bold; width: 120px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Appointment Cancelled</h1>
        </div>
        <div class="content">
          <p>Dear ${data.customerName},</p>
          <p>Your appointment has been cancelled as requested.</p>
          
          <div class="booking-details">
            <h3>Cancelled Appointment:</h3>
            <div class="detail-row">
              <span class="detail-label">Service:</span>
              <span>${data.serviceName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date:</span>
              <span>${new Date(data.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Time:</span>
              <span>${data.time}</span>
            </div>
          </div>
          
          <p>We're sorry to see you go! If you'd like to book another appointment, please visit our booking page.</p>
          
          <div class="footer">
            <p>Thank you for letting us know.</p>
            <p>We hope to see you again soon!</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    const { data: result, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: data.to,
        subject: `Appointment Cancelled - ${data.serviceName}`,
        html
      }
    })

    if (error) throw error
    return result
  } catch (error) {
    console.error('Error sending cancellation email:', error)
    throw error
  }
}