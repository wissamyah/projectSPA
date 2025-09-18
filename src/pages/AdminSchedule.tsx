import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { RefreshCw, Printer } from 'lucide-react'

// Import types
import { Booking, Staff } from '../types/schedule'

// Import components
import {
  ScheduleHeader,
  ScheduleControls,
  StaffLinks,
  DailyScheduleGrid,
  WeeklyScheduleGrid,
  ScheduleStats,
  PrintSchedule,
  PrintStyles
} from '../components/admin/schedule'

// Import utility functions
import {
  formatLocalDate,
  formatDateHeader,
  getWeekStart,
  getWeekEnd
} from '../utils/scheduleHelpers'

const AdminSchedule = () => {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [staffMembers, setStaffMembers] = useState<Staff[]>([])
  const [selectedStaff, setSelectedStaff] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [copiedLink, setCopiedLink] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [selectedDate, selectedStaff, viewMode])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch staff members
      const { data: staff, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (staffError) console.error('Error fetching staff:', staffError)
      if (staff) setStaffMembers(staff)

      // Calculate date range using local date formatting
      const startDate = viewMode === 'daily'
        ? formatLocalDate(selectedDate)
        : formatLocalDate(getWeekStart(selectedDate))

      const endDate = viewMode === 'daily'
        ? formatLocalDate(selectedDate)
        : formatLocalDate(getWeekEnd(selectedDate))

      console.log('Fetching data for date range:', { startDate, endDate, selectedDate })

      // Fetch bookings
      let query = supabase
        .from('bookings')
        .select(`
          *,
          service:service_uuid(name, duration, price),
          staff:staff_id(id, name, email)
        `)
        .gte('booking_date', startDate)
        .lte('booking_date', endDate)
        .neq('status', 'cancelled')
        .order('booking_date')
        .order('booking_time')

      if (selectedStaff !== 'all') {
        query = query.eq('staff_id', selectedStaff)
      }

      const { data: bookings, error: bookingsError } = await query

      if (bookingsError) console.error('Error fetching bookings:', bookingsError)

      if (bookings) {
        console.log('Fetched bookings:', bookings)
        setBookings(bookings)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate)
    if (viewMode === 'daily') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
    } else {
      // In weekly view, ensure we're always navigating from the week start
      const weekStart = getWeekStart(newDate)
      weekStart.setDate(weekStart.getDate() + (direction === 'next' ? 7 : -7))
      setSelectedDate(weekStart)
      return
    }
    setSelectedDate(newDate)
  }

  const copyStaffLink = (staffId: string, staffName: string) => {
    const link = `${window.location.origin}/schedule/${staffId}`
    navigator.clipboard.writeText(link)
    setCopiedLink(staffId)
    setTimeout(() => setCopiedLink(null), 2000)
  }

  const handlePrint = () => {
    window.print()
  }

  const staffToShow = selectedStaff === 'all'
    ? staffMembers
    : staffMembers.filter(s => s.id === selectedStaff)

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-sage-50 print:bg-white">
      {/* Hero Section */}
      <ScheduleHeader />

      {/* Print Components */}
      <PrintSchedule
        selectedDate={selectedDate}
        viewMode={viewMode}
        selectedStaff={selectedStaff}
        staffMembers={staffMembers}
        staffToShow={staffToShow}
        bookings={bookings}
      />

      <div className="container mx-auto px-4 py-8 print:px-0 print:py-0">
        {/* Action Buttons */}
        <div className="flex gap-3 mb-6 print:hidden">
          <button
            onClick={fetchData}
            className="bg-white/95 backdrop-blur-sm text-stone-700 px-4 py-2.5 rounded-full hover:bg-white hover:shadow-md flex items-center gap-2 border border-stone-200 transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="font-light">Refresh</span>
          </button>
          <button
            onClick={handlePrint}
            className="bg-white/95 backdrop-blur-sm text-stone-700 px-4 py-2.5 rounded-full hover:bg-white hover:shadow-md flex items-center gap-2 border border-stone-200 transition-all"
          >
            <Printer className="h-4 w-4" />
            <span className="font-light">Print</span>
          </button>
          <Link
            to="/admin"
            className="bg-gradient-to-r from-sage-600 to-sage-700 text-white px-5 py-2.5 rounded-full hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center gap-2"
          >
            <span className="font-light">Back to Dashboard</span>
          </Link>
        </div>

        {/* Controls Section */}
        <ScheduleControls
          viewMode={viewMode}
          setViewMode={setViewMode}
          selectedDate={selectedDate}
          navigateDate={navigateDate}
          setSelectedDate={setSelectedDate}
          selectedStaff={selectedStaff}
          setSelectedStaff={setSelectedStaff}
          staffMembers={staffMembers}
          formatDateHeader={formatDateHeader}
          getWeekStart={getWeekStart}
          getWeekEnd={getWeekEnd}
          formatLocalDate={formatLocalDate}
        />

        {/* Staff Links */}
        {selectedStaff === 'all' && (
          <StaffLinks
            staffMembers={staffMembers}
            copiedLink={copiedLink}
            copyStaffLink={copyStaffLink}
          />
        )}

        {/* Schedule Grid */}
        {viewMode === 'daily' ? (
          <DailyScheduleGrid
            bookings={bookings}
            staffToShow={staffToShow}
            selectedDate={selectedDate}
            loading={loading}
          />
        ) : (
          <WeeklyScheduleGrid
            bookings={bookings}
            staffToShow={staffToShow}
            selectedDate={selectedDate}
            loading={loading}
          />
        )}

        {/* Stats Cards */}
        <ScheduleStats bookings={bookings} staffToShow={staffToShow} />
      </div>

      {/* Print Styles */}
      <PrintStyles />
    </div>
  )
}

export default AdminSchedule