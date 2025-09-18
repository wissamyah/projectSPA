import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = 'http://localhost:54321'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkData() {
  console.log('Checking database data...\n')

  // Check staff
  const { data: staff, error: staffError } = await supabase
    .from('staff')
    .select('*')

  console.log('Staff members:', staff?.length || 0)
  if (staff && staff.length > 0) {
    console.log('Staff data:', staff)
  }

  // Check bookings
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('*, staff:staff_id(id, name, email)')

  console.log('\nBookings:', bookings?.length || 0)
  if (bookings && bookings.length > 0) {
    console.log('First booking structure:', bookings[0])
  }

  // Check services
  const { data: services, error: servicesError } = await supabase
    .from('services')
    .select('*')

  console.log('\nServices:', services?.length || 0)

  // Check categories
  const { data: categories, error: categoriesError } = await supabase
    .from('service_categories')
    .select('*')

  console.log('Categories:', categories?.length || 0)

  if (staffError || bookingsError || servicesError || categoriesError) {
    console.error('Errors:', { staffError, bookingsError, servicesError, categoriesError })
  }
}

checkData()