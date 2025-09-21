import { ChevronLeft, ChevronRight, List, Grid3X3, User } from 'lucide-react'
import { Staff } from '../../../types/schedule'

interface ScheduleControlsProps {
  viewMode: 'daily' | 'weekly'
  setViewMode: (mode: 'daily' | 'weekly') => void
  selectedDate: Date
  navigateDate: (direction: 'prev' | 'next') => void
  setSelectedDate: (date: Date) => void
  selectedStaff: string
  setSelectedStaff: (staffId: string) => void
  staffMembers: Staff[]
  formatDateHeader: (date: Date) => string
  getWeekStart: (date: Date) => Date
  getWeekEnd: (date: Date) => Date
  formatLocalDate: (date: Date) => string
}

const ScheduleControls = ({
  viewMode,
  setViewMode,
  selectedDate,
  navigateDate,
  setSelectedDate,
  selectedStaff,
  setSelectedStaff,
  staffMembers,
  formatDateHeader,
  getWeekStart,
  getWeekEnd,
  formatLocalDate
}: ScheduleControlsProps) => {
  const handleTodayClick = () => {
    const today = new Date()
    const dateToSet = viewMode === 'weekly' ? getWeekStart(today) : today
    console.log('Today button clicked, setting date to:', formatLocalDate(dateToSet))
    setSelectedDate(dateToSet)
  }

  const handleDailyMode = () => {
    setViewMode('daily')
    if (viewMode === 'weekly') {
      setSelectedDate(getWeekStart(selectedDate))
    }
  }

  const handleWeeklyMode = () => {
    setViewMode('weekly')
    if (viewMode === 'daily') {
      setSelectedDate(getWeekStart(selectedDate))
    }
  }

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden lg:block bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-4 mb-6 print:hidden">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={handleDailyMode}
              className={`px-4 py-2 rounded-full ${
                viewMode === 'daily'
                  ? 'bg-gradient-to-r from-sage-600 to-sage-700 text-white shadow-md'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              } transition-all`}
            >
              <List className="h-4 w-4 inline mr-2" />
              Daily
            </button>
            <button
              onClick={handleWeeklyMode}
              className={`px-4 py-2 rounded-full ${
                viewMode === 'weekly'
                  ? 'bg-gradient-to-r from-sage-600 to-sage-700 text-white shadow-md'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              } transition-all`}
            >
              <Grid3X3 className="h-4 w-4 inline mr-2" />
              Weekly
            </button>
          </div>

          {/* Date Navigation */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 hover:bg-stone-100 rounded-full transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="text-center">
              <div className="font-light text-stone-900">
                {viewMode === 'daily'
                  ? formatDateHeader(selectedDate)
                  : (() => {
                      const weekStart = getWeekStart(selectedDate)
                      const weekEnd = getWeekEnd(selectedDate)
                      return `${weekStart.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })} - ${weekEnd.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}`
                    })()}
              </div>
            </div>
            <button
              onClick={() => navigateDate('next')}
              className="p-2 hover:bg-stone-100 rounded-full transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <button
              onClick={handleTodayClick}
              className="px-3 py-1.5 bg-spa-100 text-spa-700 rounded-full hover:bg-spa-200 text-sm font-light transition-colors"
            >
              Today
            </button>
          </div>

          {/* Staff Filter */}
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-stone-600" />
            <select
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="px-4 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-sage-500 focus:border-sage-500 transition-colors"
            >
              <option value="all">All Staff</option>
              {staffMembers.map(staff => (
                <option key={staff.id} value={staff.id}>{staff.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden space-y-3 mb-6 print:hidden">
        {/* View Mode Toggle */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-md border border-sage-200 p-1 flex">
          <button
            onClick={handleDailyMode}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'daily'
                ? 'bg-gradient-to-r from-sage-600 to-sage-700 text-white shadow-sm'
                : 'text-stone-600'
            }`}
          >
            <List className="h-4 w-4 inline mr-1" />
            Daily
          </button>
          <button
            onClick={handleWeeklyMode}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'weekly'
                ? 'bg-gradient-to-r from-sage-600 to-sage-700 text-white shadow-sm'
                : 'text-stone-600'
            }`}
          >
            <Grid3X3 className="h-4 w-4 inline mr-1" />
            Weekly
          </button>
        </div>

        {/* Date Navigation and Today Button */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-md border border-white/50 p-3">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="text-center flex-1">
              <div className="font-medium text-sm text-stone-900">
                {viewMode === 'daily'
                  ? formatDateHeader(selectedDate)
                  : (() => {
                      const weekStart = getWeekStart(selectedDate)
                      const weekEnd = getWeekEnd(selectedDate)
                      return `${weekStart.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })} - ${weekEnd.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}`
                    })()}
              </div>
            </div>
            <button
              onClick={() => navigateDate('next')}
              className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <button
            onClick={handleTodayClick}
            className="w-full px-3 py-2 bg-spa-100 text-spa-700 rounded-lg hover:bg-spa-200 text-sm font-medium transition-colors"
          >
            Today
          </button>
        </div>

        {/* Staff Filter */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-md border border-white/50 p-3">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-stone-600 flex-shrink-0" />
            <select
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-sage-500 focus:border-sage-500 transition-colors"
            >
              <option value="all">All Staff</option>
              {staffMembers.map(staff => (
                <option key={staff.id} value={staff.id}>{staff.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </>
  )
}

export default ScheduleControls