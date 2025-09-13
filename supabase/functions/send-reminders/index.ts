import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get tomorrow's date
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    // Fetch bookings for tomorrow that are confirmed
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        *,
        service:service_uuid(id, name),
        staff:staff_id(id, name)
      `)
      .eq('booking_date', tomorrowStr)
      .eq('status', 'confirmed')

    if (error) throw error

    const emailPromises = []
    
    for (const booking of bookings || []) {
      // Skip if no email
      if (!booking.customer_email) continue

      const emailHtml = `
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
              <p>Dear ${booking.customer_name},</p>
              <p>This is a friendly reminder about your appointment tomorrow.</p>
              
              <div class="booking-details">
                <h3>Appointment Details:</h3>
                <div class="detail-row">
                  <span class="detail-label">Service:</span>
                  <span>${booking.service?.name || 'Service'}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Date:</span>
                  <span>${new Date(booking.booking_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Time:</span>
                  <span>${booking.booking_time.substring(0, 5)}</span>
                </div>
                ${booking.staff ? `
                <div class="detail-row">
                  <span class="detail-label">Staff:</span>
                  <span>${booking.staff.name}</span>
                </div>
                ` : ''}
              </div>
              
              <p>Please arrive 10 minutes early to check in.</p>
              
              <div class="footer">
                <p>We look forward to seeing you!</p>
                <p>Thank you for choosing our spa!</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `

      // Send email using the send-email function
      const emailPromise = fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: booking.customer_email,
          subject: `Appointment Reminder - Tomorrow at ${booking.booking_time.substring(0, 5)}`,
          html: emailHtml
        })
      })

      emailPromises.push(emailPromise)
    }

    // Wait for all emails to be sent
    const results = await Promise.allSettled(emailPromises)
    
    const sent = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Sent ${sent} reminders, ${failed} failed`,
        total: bookings?.length || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})