import { supabase } from '../lib/supabase'

/**
 * Mark past confirmed bookings as completed
 * This should be called periodically or on admin dashboard load
 */
export async function markPastBookingsCompleted() {
  try {
    const now = new Date()
    const currentDate = now.toISOString().split('T')[0]
    const twoHoursAgo = new Date(now.getTime() - (2 * 60 * 60 * 1000))
    const currentTime = twoHoursAgo.toTimeString().split(' ')[0].substring(0, 5)

    // Find all confirmed bookings that are in the past
    const { data: pastBookings, error: fetchError } = await supabase
      .from('bookings')
      .select('id, booking_date, booking_time')
      .eq('status', 'confirmed')

    if (fetchError) throw fetchError

    // Filter past bookings in JavaScript
    const bookingsToComplete = pastBookings?.filter(booking => {
      const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`)
      return bookingDateTime < twoHoursAgo
    }) || []

    if (bookingsToComplete.length > 0) {
      // Update them to completed status one by one to avoid issues
      let successCount = 0
      for (const booking of bookingsToComplete) {
        const { error: updateError } = await supabase
          .from('bookings')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', booking.id)

        if (!updateError) {
          successCount++
        } else {
          console.error(`Failed to update booking ${booking.id}:`, updateError)
        }
      }

      console.log(`Marked ${successCount} bookings as completed`)
      return successCount
    }

    return 0
  } catch (error) {
    console.error('Error marking bookings as completed:', error)
    return 0
  }
}

/**
 * Archive completed bookings older than specified days
 * @param daysOld - Number of days old a booking should be before archiving (default 30)
 */
export async function archiveOldBookings(daysOld: number = 30) {
  try {
    const archiveDate = new Date()
    archiveDate.setDate(archiveDate.getDate() - daysOld)
    const archiveDateStr = archiveDate.toISOString().split('T')[0]

    // Fetch old completed bookings
    const { data: oldBookings, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('status', 'completed')
      .lt('booking_date', archiveDateStr)

    if (fetchError) throw fetchError

    if (oldBookings && oldBookings.length > 0) {
      // Insert into archived_bookings table
      const archivedBookings = oldBookings.map(booking => ({
        ...booking,
        archived_at: new Date().toISOString()
      }))

      const { error: archiveError } = await supabase
        .from('archived_bookings')
        .insert(archivedBookings)

      if (archiveError) {
        // If archived_bookings table doesn't exist, just log
        console.warn('Could not archive bookings:', archiveError)
        return 0
      }

      // Delete from main bookings table
      const { error: deleteError } = await supabase
        .from('bookings')
        .delete()
        .in('id', oldBookings.map(b => b.id))

      if (deleteError) throw deleteError

      console.log(`Archived ${oldBookings.length} old bookings`)
      return oldBookings.length
    }

    return 0
  } catch (error) {
    console.error('Error archiving bookings:', error)
    return 0
  }
}

/**
 * Get statistics about bookings including archived ones
 */
export async function getBookingStats() {
  try {
    // Get active bookings count
    const { count: activeCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })

    // Get archived bookings count
    const { count: archivedCount } = await supabase
      .from('archived_bookings')
      .select('*', { count: 'exact', head: true })

    return {
      active: activeCount || 0,
      archived: archivedCount || 0,
      total: (activeCount || 0) + (archivedCount || 0)
    }
  } catch (error) {
    console.error('Error getting booking stats:', error)
    return { active: 0, archived: 0, total: 0 }
  }
}