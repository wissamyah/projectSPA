import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string
  subject: string
  html: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html } = await req.json() as EmailRequest

    // Get Gmail credentials from environment variables
    const GMAIL_USER = Deno.env.get('GMAIL_USER')
    const GMAIL_APP_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD')

    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      console.log('Gmail credentials not configured, skipping email send')
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Email logged (credentials not configured)',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Create SMTP client with Gmail settings
    const client = new SMTPClient({
      connection: {
        hostname: 'smtp.gmail.com',
        port: 465,
        tls: true,
        auth: {
          username: GMAIL_USER,
          password: GMAIL_APP_PASSWORD,
        },
      },
    })

    // Send the email
    await client.send({
      from: GMAIL_USER,
      to: to,
      subject: subject,
      content: 'Please view this email in HTML',
      html: html,
    })

    await client.close()

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully via Gmail SMTP',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Email send error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        note: 'Email may still be logged locally'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Return 200 to allow fallback
      }
    )
  }
})