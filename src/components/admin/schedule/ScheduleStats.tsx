import { Calendar, Users, Sparkles } from 'lucide-react'
import { Booking, Staff } from '../../../types/schedule'

interface ScheduleStatsProps {
  bookings: Booking[]
  staffToShow: Staff[]
}

const ScheduleStats = ({ bookings, staffToShow }: ScheduleStatsProps) => {
  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 hover:shadow-2xl transition-all duration-300 group">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-stone-600 text-sm font-light">Total Appointments</div>
            <div className="text-3xl font-light text-transparent bg-clip-text bg-gradient-to-r from-sage-600 to-spa-600 mt-1">
              {bookings.length}
            </div>
          </div>
          <Calendar className="h-8 w-8 text-sage-400 group-hover:text-sage-600 transition-colors" />
        </div>
      </div>

      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 hover:shadow-2xl transition-all duration-300 group">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-stone-600 text-sm font-light">Staff on Duty</div>
            <div className="text-3xl font-light text-transparent bg-clip-text bg-gradient-to-r from-spa-600 to-sage-600 mt-1">
              {staffToShow.length}
            </div>
          </div>
          <Users className="h-8 w-8 text-spa-400 group-hover:text-spa-600 transition-colors" />
        </div>
      </div>

      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 hover:shadow-2xl transition-all duration-300 group">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-stone-600 text-sm font-light">Average per Staff</div>
            <div className="text-3xl font-light text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-gold-500 mt-1">
              {staffToShow.length > 0 ? (bookings.length / staffToShow.length).toFixed(1) : 0}
            </div>
          </div>
          <Sparkles className="h-8 w-8 text-gold-400 group-hover:text-gold-600 transition-colors" />
        </div>
      </div>
    </div>
  )
}

export default ScheduleStats