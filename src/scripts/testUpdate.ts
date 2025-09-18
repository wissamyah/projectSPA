import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://znqgwmhdosldydxrcsvp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpucWd3bWhkb3NsZHlkeHJjc3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MTE4MTksImV4cCI6MjA3MzI4NzgxOX0.PQiGbCtdOdOFStdMv2bKaxSIVWBGCQ5exmXqg31KFCA'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testUpdate() {
  console.log('Testing booking update...\n')

  // First, get a booking
  const { data: bookings, error: fetchError } = await supabase
    .from('bookings')
    .select('*')
    .limit(1)

  if (fetchError) {
    console.error('Error fetching bookings:', fetchError)
    return
  }

  if (!bookings || bookings.length === 0) {
    console.log('No bookings found')
    return
  }

  const booking = bookings[0]
  console.log('Found booking:', booking.id, 'with status:', booking.status)

  // Try to update it
  const { data, error } = await supabase
    .from('bookings')
    .update({
      status: 'completed',
      updated_at: new Date().toISOString()
    })
    .eq('id', booking.id)
    .select()

  if (error) {
    console.error('Update error:', error)
    console.error('Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    })
  } else {
    console.log('Update successful:', data)
  }
}

testUpdate()