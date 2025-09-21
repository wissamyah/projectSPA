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
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Georgia', 'Times New Roman', serif; background-color: #faf9f8;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header with elegant gradient -->
        <div style="background: linear-gradient(135deg, #8a9f77 0%, #5c9e9e 50%, #ceaca1 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0 0 10px 0; font-size: 32px; font-weight: 300; letter-spacing: 2px;">Serenity Spa</h1>
          <div style="width: 60px; height: 1px; background-color: #ffffff; margin: 0 auto 15px auto;"></div>
          <p style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 300; letter-spacing: 1px;">Booking Request Received</p>
        </div>

        <!-- Content Section -->
        <div style="padding: 40px 30px; background-color: #ffffff;">
          <p style="font-size: 16px; color: #44403c; margin-bottom: 25px; line-height: 1.6;">
            Dear ${data.customerName},
          </p>

          <p style="font-size: 15px; color: #57534e; margin-bottom: 30px; line-height: 1.8;">
            Thank you for choosing Serenity Spa. We've received your appointment request and our wellness team is reviewing availability. You'll receive a confirmation shortly.
          </p>

          <!-- Status Card -->
          <div style="background: linear-gradient(135deg, #fffef7 0%, #f6f7f5 100%); border-left: 3px solid #dda15e; padding: 20px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
            <p style="margin: 0 0 8px 0; color: #6f452b; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
              Status: Pending Confirmation
            </p>
            <p style="margin: 0; color: #875432; font-size: 14px; line-height: 1.6;">
              Our team will verify availability and send confirmation within 1-2 hours.
            </p>
          </div>

          <!-- Appointment Details Card -->
          <div style="background-color: #faf9f8; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
            <h2 style="color: #708360; font-size: 20px; margin: 0 0 20px 0; font-weight: 400; letter-spacing: 1px;">Appointment Details</h2>

            <div style="border-top: 1px solid #e7e5e4; padding-top: 20px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; vertical-align: top;">
                    <span style="color: #78716c; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Service</span>
                    <p style="color: #292524; font-size: 16px; margin: 5px 0 0 0; font-weight: 500;">${data.serviceName}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; vertical-align: top;">
                    <span style="color: #78716c; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Date</span>
                    <p style="color: #292524; font-size: 16px; margin: 5px 0 0 0;">${new Date(data.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; vertical-align: top;">
                    <span style="color: #78716c; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Time</span>
                    <p style="color: #292524; font-size: 16px; margin: 5px 0 0 0;">${data.time}</p>
                  </td>
                </tr>
                ${data.staffName ? `<tr>
                  <td style="padding: 12px 0; vertical-align: top;">
                    <span style="color: #78716c; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Preferred Therapist</span>
                    <p style="color: #292524; font-size: 16px; margin: 5px 0 0 0;">${data.staffName}</p>
                  </td>
                </tr>` : ''}
              </table>
            </div>
          </div>

          <!-- Divider -->
          <div style="text-align: center; margin: 35px 0;">
            <div style="display: inline-block; width: 40px; height: 1px; background-color: #d6d3d1; margin: 0 10px;"></div>
            <span style="color: #ceaca1; font-size: 20px;">✦</span>
            <div style="display: inline-block; width: 40px; height: 1px; background-color: #d6d3d1; margin: 0 10px;"></div>
          </div>

          <!-- Contact Info -->
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #78716c; font-size: 14px; margin: 0 0 5px 0; line-height: 1.6;">
              Questions? We're here to help
            </p>
            <p style="color: #a8a29e; font-size: 13px; margin: 0; line-height: 1.6;">
              Response time: 1-2 hours during business hours
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: linear-gradient(135deg, #f6f7f5 0%, #faf2f0 100%); padding: 30px; text-align: center; border-top: 1px solid #e7e5e4;">
          <p style="color: #78716c; font-size: 13px; margin: 0 0 10px 0; font-style: italic;">
            "Where tranquility meets transformation"
          </p>
          <p style="color: #a8a29e; font-size: 12px; margin: 0;">
            © 2024 Serenity Spa. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail(data.to, `Booking Request Received - ${data.serviceName}`, html)
}

export const sendBookingConfirmation = async (data: EmailData) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Georgia', 'Times New Roman', serif; background-color: #faf9f8;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header with success gradient -->
        <div style="background: linear-gradient(135deg, #708360 0%, #8a9f77 50%, #dda15e 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0 0 10px 0; font-size: 32px; font-weight: 300; letter-spacing: 2px;">Serenity Spa</h1>
          <div style="width: 60px; height: 1px; background-color: #ffffff; margin: 0 auto 15px auto;"></div>
          <p style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 300; letter-spacing: 1px;">Appointment Confirmed</p>
        </div>

        <!-- Celebration Banner -->
        <div style="background-color: #f6f7f5; padding: 20px; text-align: center; border-bottom: 1px solid #e7e5e4;">
          <p style="color: #708360; font-size: 24px; margin: 0;">✨</p>
          <p style="color: #5a6b4e; font-size: 16px; margin: 10px 0 0 0; font-weight: 500;">Your wellness journey awaits!</p>
        </div>

        <!-- Content Section -->
        <div style="padding: 40px 30px; background-color: #ffffff;">
          <p style="font-size: 16px; color: #44403c; margin-bottom: 25px; line-height: 1.6;">
            Dear ${data.customerName},
          </p>

          <p style="font-size: 15px; color: #57534e; margin-bottom: 30px; line-height: 1.8;">
            We're delighted to confirm your appointment at Serenity Spa. Our expert therapists are preparing a tranquil experience tailored just for you.
          </p>

          <!-- Confirmed Appointment Card -->
          <div style="background: linear-gradient(135deg, #f6f7f5 0%, #eaebe7 100%); border-radius: 12px; padding: 25px; margin-bottom: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            <h2 style="color: #475440; font-size: 20px; margin: 0 0 20px 0; font-weight: 400; letter-spacing: 1px; text-align: center;">Your Appointment</h2>

            <div style="background-color: #ffffff; border-radius: 8px; padding: 20px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; vertical-align: top; border-bottom: 1px solid #f5f5f4;">
                    <span style="color: #78716c; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Service</span>
                    <p style="color: #292524; font-size: 16px; margin: 5px 0 0 0; font-weight: 500;">${data.serviceName}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; vertical-align: top; border-bottom: 1px solid #f5f5f4;">
                    <span style="color: #78716c; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Date</span>
                    <p style="color: #292524; font-size: 16px; margin: 5px 0 0 0;">${new Date(data.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; vertical-align: top; border-bottom: 1px solid #f5f5f4;">
                    <span style="color: #78716c; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Time</span>
                    <p style="color: #292524; font-size: 16px; margin: 5px 0 0 0;">${data.time}</p>
                  </td>
                </tr>
                ${data.staffName ? `<tr>
                  <td style="padding: 12px 0; vertical-align: top;">
                    <span style="color: #78716c; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Your Therapist</span>
                    <p style="color: #292524; font-size: 16px; margin: 5px 0 0 0;">${data.staffName}</p>
                  </td>
                </tr>` : ''}
              </table>
            </div>
          </div>

          <!-- Important Information -->
          <div style="background-color: #fffef7; border-left: 3px solid #dda15e; padding: 20px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
            <p style="color: #6f452b; font-size: 14px; margin: 0 0 10px 0; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
              Please Note
            </p>
            <ul style="margin: 0; padding-left: 20px; color: #875432; font-size: 14px; line-height: 1.8;">
              <li>Arrive 10 minutes early to enjoy our relaxation area</li>
              <li>Cancellations require 2 hours notice</li>
              <li>We'll have everything prepared for your visit</li>
            </ul>
          </div>

          <!-- Preparation Tips -->
          <div style="text-align: center; padding: 25px; background-color: #faf9f8; border-radius: 8px; margin-bottom: 30px;">
            <p style="color: #5c9e9e; font-size: 16px; margin: 0 0 15px 0; font-weight: 500;">Enhance Your Experience</p>
            <p style="color: #78716c; font-size: 14px; margin: 0; line-height: 1.6;">
              Wear comfortable clothing • Stay hydrated • Arrive relaxed
            </p>
          </div>

          <!-- Divider -->
          <div style="text-align: center; margin: 35px 0;">
            <div style="display: inline-block; width: 40px; height: 1px; background-color: #d6d3d1; margin: 0 10px;"></div>
            <span style="color: #ceaca1; font-size: 20px;">✦</span>
            <div style="display: inline-block; width: 40px; height: 1px; background-color: #d6d3d1; margin: 0 10px;"></div>
          </div>

          <!-- Closing -->
          <div style="text-align: center;">
            <p style="color: #57534e; font-size: 15px; margin: 0; line-height: 1.6;">
              We look forward to welcoming you
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: linear-gradient(135deg, #f6f7f5 0%, #faf2f0 100%); padding: 30px; text-align: center; border-top: 1px solid #e7e5e4;">
          <p style="color: #78716c; font-size: 13px; margin: 0 0 10px 0; font-style: italic;">
            "Where tranquility meets transformation"
          </p>
          <p style="color: #a8a29e; font-size: 12px; margin: 0;">
            © 2024 Serenity Spa. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail(data.to, `Booking Confirmation - ${data.serviceName}`, html)
}

export const sendBookingReminder = async (data: EmailData) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Georgia', 'Times New Roman', serif; background-color: #faf9f8;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header with calming gradient -->
        <div style="background: linear-gradient(135deg, #5c9e9e 0%, #7dbaba 50%, #aad4d4 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0 0 10px 0; font-size: 32px; font-weight: 300; letter-spacing: 2px;">Serenity Spa</h1>
          <div style="width: 60px; height: 1px; background-color: #ffffff; margin: 0 auto 15px auto;"></div>
          <p style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 300; letter-spacing: 1px;">Appointment Reminder</p>
        </div>

        <!-- Content Section -->
        <div style="padding: 40px 30px; background-color: #ffffff;">
          <p style="font-size: 16px; color: #44403c; margin-bottom: 25px; line-height: 1.6;">
            Dear ${data.customerName},
          </p>

          <p style="font-size: 15px; color: #57534e; margin-bottom: 30px; line-height: 1.8;">
            Your journey to relaxation is almost here! This is a gentle reminder about your spa appointment tomorrow.
          </p>

          <!-- Tomorrow's Appointment Card -->
          <div style="background: linear-gradient(135deg, #f5fafa 0%, #eaf4f4 100%); border-radius: 12px; padding: 25px; margin-bottom: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            <div style="text-align: center; margin-bottom: 20px;">
              <p style="color: #3f6a6a; font-size: 14px; margin: 0; text-transform: uppercase; letter-spacing: 2px;">Tomorrow</p>
              <p style="color: #4a8383; font-size: 28px; margin: 10px 0; font-weight: 300;">${data.time}</p>
            </div>

            <div style="background-color: #ffffff; border-radius: 8px; padding: 20px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; vertical-align: top;">
                    <span style="color: #78716c; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Service</span>
                    <p style="color: #292524; font-size: 16px; margin: 5px 0 0 0; font-weight: 500;">${data.serviceName}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; vertical-align: top;">
                    <span style="color: #78716c; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Date</span>
                    <p style="color: #292524; font-size: 16px; margin: 5px 0 0 0;">${new Date(data.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                  </td>
                </tr>
                ${data.staffName ? `<tr>
                  <td style="padding: 10px 0; vertical-align: top;">
                    <span style="color: #78716c; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Your Therapist</span>
                    <p style="color: #292524; font-size: 16px; margin: 5px 0 0 0;">${data.staffName}</p>
                  </td>
                </tr>` : ''}
              </table>
            </div>
          </div>

          <!-- Preparation Reminders -->
          <div style="background-color: #f6f7f5; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
            <p style="color: #5a6b4e; font-size: 15px; margin: 0 0 15px 0; font-weight: 500;">To enhance your experience:</p>
            <ul style="margin: 0; padding-left: 20px; color: #78716c; font-size: 14px; line-height: 1.8;">
              <li>Arrive 10 minutes early to unwind in our relaxation area</li>
              <li>Wear comfortable, loose-fitting clothing</li>
              <li>Stay hydrated throughout the day</li>
              <li>Leave your worries at the door</li>
            </ul>
          </div>

          <!-- Divider -->
          <div style="text-align: center; margin: 35px 0;">
            <div style="display: inline-block; width: 40px; height: 1px; background-color: #d6d3d1; margin: 0 10px;"></div>
            <span style="color: #5c9e9e; font-size: 20px;">✦</span>
            <div style="display: inline-block; width: 40px; height: 1px; background-color: #d6d3d1; margin: 0 10px;"></div>
          </div>

          <!-- Closing Message -->
          <div style="text-align: center;">
            <p style="color: #57534e; font-size: 15px; margin: 0 0 10px 0; line-height: 1.6;">
              We're preparing everything for your visit
            </p>
            <p style="color: #78716c; font-size: 14px; margin: 0; font-style: italic;">
              See you tomorrow!
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: linear-gradient(135deg, #f6f7f5 0%, #faf2f0 100%); padding: 30px; text-align: center; border-top: 1px solid #e7e5e4;">
          <p style="color: #78716c; font-size: 13px; margin: 0 0 10px 0; font-style: italic;">
            "Where tranquility meets transformation"
          </p>
          <p style="color: #a8a29e; font-size: 12px; margin: 0;">
            © 2024 Serenity Spa. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
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
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Georgia', 'Times New Roman', serif; background-color: #faf9f8;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header with update gradient -->
        <div style="background: linear-gradient(135deg, #7dbaba 0%, #5c9e9e 50%, #dda15e 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0 0 10px 0; font-size: 32px; font-weight: 300; letter-spacing: 2px;">Serenity Spa</h1>
          <div style="width: 60px; height: 1px; background-color: #ffffff; margin: 0 auto 15px auto;"></div>
          <p style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 300; letter-spacing: 1px;">Appointment Rescheduled</p>
        </div>

        <!-- Content Section -->
        <div style="padding: 40px 30px; background-color: #ffffff;">
          <p style="font-size: 16px; color: #44403c; margin-bottom: 25px; line-height: 1.6;">
            Dear ${data.customerName},
          </p>

          <p style="font-size: 15px; color: #57534e; margin-bottom: 30px; line-height: 1.8;">
            Your appointment has been successfully rescheduled. We've updated our schedule and look forward to seeing you at your new appointment time.
          </p>

          <!-- New Appointment Highlight -->
          <div style="background: linear-gradient(135deg, #fffef7 0%, #fdf2d9 100%); border-radius: 12px; padding: 25px; margin-bottom: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            <div style="text-align: center; margin-bottom: 20px;">
              <p style="color: #dda15e; font-size: 24px; margin: 0;">✨</p>
              <p style="color: #c78443; font-size: 16px; margin: 10px 0 0 0; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">New Appointment</p>
            </div>

            <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; border: 2px solid #f7e4bd;">
              <div style="text-align: center; margin-bottom: 15px;">
                <p style="color: #875432; font-size: 20px; margin: 0; font-weight: 500;">
                  ${new Date(data.newDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
                <p style="color: #a66938; font-size: 24px; margin: 10px 0; font-weight: 300;">
                  ${data.newTime}
                </p>
              </div>
            </div>
          </div>

          <!-- Service Details & Previous Time -->
          <div style="background-color: #faf9f8; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; vertical-align: top; border-bottom: 1px solid #e7e5e4;">
                  <span style="color: #78716c; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Service</span>
                  <p style="color: #292524; font-size: 16px; margin: 5px 0 0 0; font-weight: 500;">${data.serviceName}</p>
                </td>
              </tr>
              ${data.staffName ? `<tr>
                <td style="padding: 10px 0; vertical-align: top; border-bottom: 1px solid #e7e5e4;">
                  <span style="color: #78716c; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Your Therapist</span>
                  <p style="color: #292524; font-size: 16px; margin: 5px 0 0 0;">${data.staffName}</p>
                </td>
              </tr>` : ''}
              <tr>
                <td style="padding: 10px 0; vertical-align: top;">
                  <span style="color: #78716c; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Previous Time</span>
                  <p style="color: #a8a29e; font-size: 14px; margin: 5px 0 0 0; text-decoration: line-through;">
                    ${new Date(data.originalDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at ${data.originalTime}
                  </p>
                </td>
              </tr>
            </table>
          </div>

          <!-- Important Reminder -->
          <div style="background-color: #f6f7f5; border-left: 3px solid #8a9f77; padding: 20px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
            <p style="color: #475440; font-size: 14px; margin: 0 0 10px 0; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
              Please Note
            </p>
            <p style="color: #5a6b4e; font-size: 14px; margin: 0; line-height: 1.6;">
              Please update your calendar with the new date and time. We recommend arriving 10 minutes early to settle in and begin your relaxation journey.
            </p>
          </div>

          <!-- Divider -->
          <div style="text-align: center; margin: 35px 0;">
            <div style="display: inline-block; width: 40px; height: 1px; background-color: #d6d3d1; margin: 0 10px;"></div>
            <span style="color: #5c9e9e; font-size: 20px;">⚬</span>
            <div style="display: inline-block; width: 40px; height: 1px; background-color: #d6d3d1; margin: 0 10px;"></div>
          </div>

          <!-- Closing Message -->
          <div style="text-align: center;">
            <p style="color: #57534e; font-size: 15px; margin: 0 0 10px 0; line-height: 1.6;">
              Thank you for your flexibility
            </p>
            <p style="color: #78716c; font-size: 14px; margin: 0;">
              We look forward to your visit
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: linear-gradient(135deg, #f6f7f5 0%, #faf2f0 100%); padding: 30px; text-align: center; border-top: 1px solid #e7e5e4;">
          <p style="color: #78716c; font-size: 13px; margin: 0 0 10px 0; font-style: italic;">
            "Where tranquility meets transformation"
          </p>
          <p style="color: #a8a29e; font-size: 12px; margin: 0;">
            © 2024 Serenity Spa. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail(data.to, `Appointment Rescheduled - ${data.serviceName}`, html)
}

export const sendCancellationNotification = async (data: EmailData & { reason?: string }) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Georgia', 'Times New Roman', serif; background-color: #faf9f8;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header with subtle gradient -->
        <div style="background: linear-gradient(135deg, #ceaca1 0%, #dea59b 50%, #eecec8 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0 0 10px 0; font-size: 32px; font-weight: 300; letter-spacing: 2px;">Serenity Spa</h1>
          <div style="width: 60px; height: 1px; background-color: #ffffff; margin: 0 auto 15px auto;"></div>
          <p style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 300; letter-spacing: 1px;">Appointment Cancelled</p>
        </div>

        <!-- Content Section -->
        <div style="padding: 40px 30px; background-color: #ffffff;">
          <p style="font-size: 16px; color: #44403c; margin-bottom: 25px; line-height: 1.6;">
            Dear ${data.customerName},
          </p>

          <p style="font-size: 15px; color: #57534e; margin-bottom: 30px; line-height: 1.8;">
            We've received your cancellation request and have removed your appointment from our schedule. We understand that plans change, and we're here whenever you're ready to reschedule.
          </p>

          <!-- Cancelled Appointment Details -->
          <div style="background-color: #faf9f8; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
            <h2 style="color: #936b63; font-size: 20px; margin: 0 0 20px 0; font-weight: 400; letter-spacing: 1px;">Cancelled Appointment Details</h2>

            <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; border-left: 3px solid #dea59b;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; vertical-align: top;">
                    <span style="color: #78716c; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Service</span>
                    <p style="color: #292524; font-size: 16px; margin: 5px 0 0 0;">${data.serviceName}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; vertical-align: top;">
                    <span style="color: #78716c; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Original Date</span>
                    <p style="color: #292524; font-size: 16px; margin: 5px 0 0 0;">${new Date(data.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; vertical-align: top;">
                    <span style="color: #78716c; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Original Time</span>
                    <p style="color: #292524; font-size: 16px; margin: 5px 0 0 0;">${data.time}</p>
                  </td>
                </tr>
                ${data.reason ? `<tr>
                  <td style="padding: 10px 0; vertical-align: top;">
                    <span style="color: #78716c; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Reason</span>
                    <p style="color: #292524; font-size: 16px; margin: 5px 0 0 0;">${data.reason}</p>
                  </td>
                </tr>` : ''}
              </table>
            </div>
          </div>

          <!-- Rebook Encouragement -->
          <div style="background: linear-gradient(135deg, #f6f7f5 0%, #eaebe7 100%); border-radius: 8px; padding: 25px; text-align: center; margin-bottom: 30px;">
            <p style="color: #708360; font-size: 18px; margin: 0 0 10px 0;">✨</p>
            <p style="color: #5a6b4e; font-size: 16px; margin: 0 0 15px 0; font-weight: 500;">Your wellness journey continues</p>
            <p style="color: #78716c; font-size: 14px; margin: 0; line-height: 1.6;">
              When you're ready to reschedule, we'll be here with open arms and peaceful hearts.
            </p>
          </div>

          <!-- Divider -->
          <div style="text-align: center; margin: 35px 0;">
            <div style="display: inline-block; width: 40px; height: 1px; background-color: #d6d3d1; margin: 0 10px;"></div>
            <span style="color: #ceaca1; font-size: 20px;">✦</span>
            <div style="display: inline-block; width: 40px; height: 1px; background-color: #d6d3d1; margin: 0 10px;"></div>
          </div>

          <!-- Closing Message -->
          <div style="text-align: center;">
            <p style="color: #57534e; font-size: 15px; margin: 0 0 10px 0; line-height: 1.6;">
              Thank you for letting us know
            </p>
            <p style="color: #78716c; font-size: 14px; margin: 0;">
              We hope to see you again soon
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: linear-gradient(135deg, #f6f7f5 0%, #faf2f0 100%); padding: 30px; text-align: center; border-top: 1px solid #e7e5e4;">
          <p style="color: #78716c; font-size: 13px; margin: 0 0 10px 0; font-style: italic;">
            "Where tranquility meets transformation"
          </p>
          <p style="color: #a8a29e; font-size: 12px; margin: 0;">
            © 2024 Serenity Spa. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
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