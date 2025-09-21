import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Calendar, User, Mail, Phone, Package, Search, Download, RefreshCw, Archive, Clock, CheckCircle, XCircle, RotateCcw, Sparkles, History } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useModal } from '../contexts/ModalContext'

interface ArchivedBooking {
  id: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  service_id?: number
  service_uuid?: string
  staff_id?: string
  booking_date: string
  booking_time: string
  status: string
  notes?: string
  created_at: string
  archived_at: string
  service?: any
  staff?: any
}

const AdminArchive = () => {
  const [archivedBookings, setArchivedBookings] = useState<ArchivedBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const { showAlert, showConfirm } = useModal()

  useEffect(() => {
    fetchArchivedBookings()
  }, [dateFilter, statusFilter])

  const fetchArchivedBookings = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('archived_bookings')
        .select(`
          *,
          service:service_uuid(name, duration, price),
          staff:staff_id(name, email)
        `)
        .order('booking_date', { ascending: false })

      if (dateFilter) {
        query = query.gte('booking_date', dateFilter)
          .lte('booking_date', dateFilter)
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setArchivedBookings(data || [])
    } catch (error) {
      console.error('Error fetching archived bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const restoreBooking = async (bookingId: string) => {
    if (!(await showConfirm('Are you sure you want to restore this booking to active bookings?'))) return

    try {
      // Get the booking to restore
      const booking = archivedBookings.find(b => b.id === bookingId)
      if (!booking) return

      // Insert back into bookings table
      const { error: insertError } = await supabase
        .from('bookings')
        .insert({
          id: booking.id,
          customer_name: booking.customer_name,
          customer_email: booking.customer_email,
          customer_phone: booking.customer_phone,
          service_id: booking.service_id,
          service_uuid: booking.service_uuid,
          staff_id: booking.staff_id,
          booking_date: booking.booking_date,
          booking_time: booking.booking_time,
          status: booking.status,
          notes: booking.notes,
          created_at: booking.created_at,
          updated_at: new Date().toISOString()
        })

      if (insertError) throw insertError

      // Delete from archived_bookings
      const { error: deleteError } = await supabase
        .from('archived_bookings')
        .delete()
        .eq('id', bookingId)

      if (deleteError) throw deleteError

      await showAlert('Booking restored successfully', 'success')
      fetchArchivedBookings()
    } catch (error) {
      console.error('Error restoring booking:', error)
      await showAlert('Failed to restore booking', 'error')
    }
  }

  const exportToCSV = () => {
    const headers = ['Date', 'Time', 'Customer', 'Email', 'Phone', 'Service', 'Staff', 'Status', 'Archived Date']
    const rows = filteredBookings.map(booking => [
      booking.booking_date,
      booking.booking_time,
      booking.customer_name,
      booking.customer_email,
      booking.customer_phone || '',
      booking.service?.name || 'Unknown',
      booking.staff?.name || 'Unknown',
      booking.status,
      new Date(booking.archived_at).toLocaleDateString()
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `archived-bookings-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const filteredBookings = archivedBookings.filter(booking => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      booking.customer_name.toLowerCase().includes(search) ||
      booking.customer_email.toLowerCase().includes(search) ||
      booking.customer_phone?.toLowerCase().includes(search) ||
      booking.service?.name?.toLowerCase().includes(search) ||
      booking.staff?.name?.toLowerCase().includes(search)
    )
  })

  const stats = {
    total: filteredBookings.length,
    completed: filteredBookings.filter(b => b.status === 'completed').length,
    cancelled: filteredBookings.filter(b => b.status === 'cancelled').length,
    confirmed: filteredBookings.filter(b => b.status === 'confirmed').length
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800'
      case 'confirmed':
        return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800'
      case 'cancelled':
        return 'bg-gradient-to-r from-rose-100 to-red-100 text-red-800'
      default:
        return 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800'
    }
  }

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
            <Archive className="h-4 w-4 text-gold-500 mr-2" />
            <span className="text-sm font-medium text-stone-700">Historical Records</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-light text-stone-800 mb-6">
            Booking
            <span className="block text-4xl md:text-5xl font-normal text-transparent bg-clip-text bg-gradient-to-r from-sage-600 to-spa-600 mt-2">
              Archives
            </span>
          </h1>

          <p className="text-xl text-stone-600 max-w-3xl mx-auto leading-relaxed">
            Access and manage your complete booking history
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link to="/admin" className="inline-flex items-center text-stone-600 hover:text-sage-700 transition-colors">
            <ArrowLeft className="h-6 w-6 mr-2" />
            <span className="font-light">Back to Dashboard</span>
          </Link>
        </div>

        {/* Action Buttons - Desktop */}
        <div className="hidden lg:flex gap-3 mb-6">
          <button
            onClick={fetchArchivedBookings}
            className="bg-white/95 backdrop-blur-sm text-stone-700 px-4 py-2.5 rounded-full hover:bg-white hover:shadow-md flex items-center gap-2 border border-stone-200 transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="font-light">Refresh</span>
          </button>
          <button
            onClick={exportToCSV}
            className="bg-white/95 backdrop-blur-sm text-stone-700 px-4 py-2.5 rounded-full hover:bg-white hover:shadow-md flex items-center gap-2 border border-stone-200 transition-all"
          >
            <Download className="h-4 w-4" />
            <span className="font-light">Export CSV</span>
          </button>
        </div>

        {/* Action Buttons - Mobile */}
        <div className="lg:hidden grid grid-cols-2 gap-2 mb-6">
          <button
            onClick={fetchArchivedBookings}
            className="bg-white/95 backdrop-blur-sm text-stone-700 px-4 py-2.5 rounded-xl hover:bg-white hover:shadow-md flex items-center justify-center gap-2 border border-stone-200 transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="font-medium text-sm">Refresh</span>
          </button>
          <button
            onClick={exportToCSV}
            className="bg-white/95 backdrop-blur-sm text-stone-700 px-4 py-2.5 rounded-xl hover:bg-white hover:shadow-md flex items-center justify-center gap-2 border border-stone-200 transition-all"
          >
            <Download className="h-4 w-4" />
            <span className="font-medium text-sm">Export</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-md border border-white/50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-stone-600 text-sm font-light">Total Archived</div>
                <div className="text-3xl font-light text-transparent bg-clip-text bg-gradient-to-r from-sage-600 to-spa-600 mt-1">
                  {stats.total}
                </div>
              </div>
              <History className="h-8 w-8 text-sage-400" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl shadow-md border border-purple-200/50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-purple-700 text-sm font-light">Completed</div>
                <div className="text-3xl font-light text-purple-900">
                  {stats.completed}
                </div>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-400" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-md border border-green-200/50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-green-700 text-sm font-light">Confirmed</div>
                <div className="text-3xl font-light text-green-900">
                  {stats.confirmed}
                </div>
              </div>
              <Calendar className="h-8 w-8 text-green-400" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-rose-50 to-red-50 rounded-xl shadow-md border border-rose-200/50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-rose-700 text-sm font-light">Cancelled</div>
                <div className="text-3xl font-light text-rose-900">
                  {stats.cancelled}
                </div>
              </div>
              <XCircle className="h-8 w-8 text-rose-400" />
            </div>
          </div>
        </div>

        {/* Filters - Desktop */}
        <div className="hidden lg:block bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-sage-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, service, or staff..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-sage-500 focus:border-sage-500 transition-all"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sage-400" />
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="pl-10 pr-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-sage-500 focus:border-sage-500 transition-all"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-sage-500 focus:border-sage-500 transition-all"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filters - Mobile */}
        <div className="lg:hidden space-y-3 mb-6">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-md border border-white/50 p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-sage-400" />
              <input
                type="text"
                placeholder="Search archives..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-sage-500 focus:border-sage-500 transition-all"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sage-400" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-9 pr-2 py-2.5 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-sage-500 focus:border-sage-500 transition-all"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-sage-500 focus:border-sage-500 transition-all"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sage-600"></div>
            <p className="mt-4 text-stone-600">Loading archived bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-16 text-center">
            <div className="h-20 w-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-sage-100 to-spa-100 flex items-center justify-center">
              <Archive className="h-10 w-10 text-sage-600" />
            </div>
            <h3 className="text-xl font-light text-stone-800 mb-2">No Archived Bookings</h3>
            <p className="text-stone-600">Your archived bookings will appear here</p>
          </div>
        ) : (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-sage-50 to-spa-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-stone-700 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-stone-700 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-stone-700 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-stone-700 uppercase tracking-wider">
                      Staff
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-stone-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-stone-700 uppercase tracking-wider">
                      Archived
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-stone-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-sage-50/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-sage-100 to-spa-100 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-sage-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-stone-900">
                              {new Date(booking.booking_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </div>
                            <div className="text-sm text-stone-500">
                              {booking.booking_time.substring(0, 5)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-stone-900">
                            {booking.customer_name}
                          </div>
                          <div className="text-xs text-stone-500 flex items-center mt-1">
                            <Mail className="h-3 w-3 mr-1" />
                            {booking.customer_email}
                          </div>
                          {booking.customer_phone && (
                            <div className="text-xs text-stone-500 flex items-center mt-1">
                              <Phone className="h-3 w-3 mr-1" />
                              {booking.customer_phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-spa-100 to-sage-100 flex items-center justify-center">
                            <Package className="h-4 w-4 text-spa-700" />
                          </div>
                          <span className="text-sm text-stone-900 font-medium">
                            {booking.service?.name || 'Unknown Service'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-rose-100 to-pink-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-rose-700" />
                          </div>
                          <span className="text-sm text-stone-900">
                            {booking.staff?.name || 'No Staff'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(booking.status)}`}>
                          {booking.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {booking.status === 'cancelled' && <XCircle className="h-3 w-3 mr-1" />}
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-stone-600">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1 text-stone-400" />
                            {new Date(booking.archived_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => restoreBooking(booking.id)}
                          className="inline-flex items-center gap-1.5 text-spa-600 hover:text-spa-800 text-sm font-medium transition-colors"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Restore
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary Section */}
        {filteredBookings.length > 0 && (
          <div className="mt-6 bg-gradient-to-r from-spa-50 to-sage-50 rounded-xl p-6 border border-spa-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-spa-600" />
                <span className="text-sm font-medium text-stone-700">
                  Showing {filteredBookings.length} archived {filteredBookings.length === 1 ? 'booking' : 'bookings'}
                </span>
              </div>
              <div className="text-xs text-stone-600">
                Data preserved for historical reference and reporting
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminArchive