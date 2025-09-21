import { Link } from 'react-router-dom'
import { Settings, Package, CalendarDays, Tag, Users, Archive, Grid3X3, List, Bell, Sparkles } from 'lucide-react'

interface AdminHeaderProps {
  stats: {
    total: number
    pending: number
    confirmed: number
    cancelled: number
    completed: number
  }
  viewMode: 'calendar' | 'list'
  setViewMode: (mode: 'calendar' | 'list') => void
  handleArchiveOld: () => void
  handleMarkCompleted: () => void
  totalPendingCount: number
  hasNewPending: boolean
  handlePendingButtonClick: () => void
}

export const AdminHeader = ({
  stats,
  viewMode,
  setViewMode,
  handleArchiveOld,
  handleMarkCompleted,
  totalPendingCount,
  hasNewPending,
  handlePendingButtonClick
}: AdminHeaderProps) => {

  return (
    <div className="-mt-16 relative z-10">
      {/* Desktop Navigation - Centered Pills */}
      <div className="hidden lg:flex justify-center mb-8">
        <div className="flex flex-wrap justify-center gap-3">
          {totalPendingCount > 0 && (
            <div className="relative">
              <button
                onClick={handlePendingButtonClick}
                className={`bg-gradient-to-r from-gold-500 to-amber-500 text-white px-4 py-2 rounded-full hover:shadow-lg flex items-center space-x-2 shadow-lg transition-all hover:scale-105 ${
                  hasNewPending ? 'flash-pending-button' : 'animate-pulse'
                }`}
              >
                <Bell className="h-4 w-4" />
                <span className="font-light">Pending ({totalPendingCount})</span>
                {totalPendingCount !== stats.pending && (
                  <span className="text-xs bg-white/30 px-2 py-0.5 rounded-full">
                    {stats.pending} today
                  </span>
                )}
              </button>
            </div>
          )}
          <Link
            to="/admin/schedule"
            className="bg-white/95 backdrop-blur-sm text-spa-700 px-4 py-2 rounded-full hover:shadow-lg flex items-center space-x-2 shadow-md transition-all hover:scale-105 border border-spa-200"
          >
            <CalendarDays className="h-4 w-4" />
            <span className="font-light">Schedule</span>
          </Link>
          <Link
            to="/admin/services"
            className="bg-white/95 backdrop-blur-sm text-sage-700 px-4 py-2 rounded-full hover:shadow-lg flex items-center space-x-2 shadow-md transition-all hover:scale-105 border border-sage-200"
          >
            <Package className="h-4 w-4" />
            <span className="font-light">Services</span>
          </Link>
          <Link
            to="/admin/staff"
            className="bg-white/95 backdrop-blur-sm text-stone-700 px-4 py-2 rounded-full hover:shadow-lg flex items-center space-x-2 shadow-md transition-all hover:scale-105 border border-stone-200"
          >
            <Users className="h-4 w-4" />
            <span className="font-light">Staff</span>
          </Link>
          <Link
            to="/admin/categories"
            className="bg-white/95 backdrop-blur-sm text-rose-700 px-4 py-2 rounded-full hover:shadow-lg flex items-center space-x-2 shadow-md transition-all hover:scale-105 border border-rose-200"
          >
            <Tag className="h-4 w-4" />
            <span className="font-light">Categories</span>
          </Link>
          <Link
            to="/admin/archive"
            className="bg-white/95 backdrop-blur-sm text-stone-600 px-4 py-2 rounded-full hover:shadow-lg flex items-center space-x-2 shadow-md transition-all hover:scale-105 border border-stone-200"
          >
            <Archive className="h-4 w-4" />
            <span className="font-light">Archive</span>
          </Link>
          <Link
            to="/admin/settings"
            className="bg-gradient-to-r from-sage-600 to-sage-700 text-white px-4 py-2 rounded-full hover:shadow-lg flex items-center space-x-2 shadow-md transition-all hover:scale-105"
          >
            <Settings className="h-4 w-4" />
            <span className="font-light">Settings</span>
          </Link>
        </div>
      </div>

      {/* Mobile Navigation - Scrollable Horizontal with Gradient Fade */}
      <div className="lg:hidden mb-8">
        {totalPendingCount > 0 && (
          <div className="mb-3 px-4">
            <button
              onClick={handlePendingButtonClick}
              className={`w-full bg-gradient-to-r from-gold-500 to-amber-500 text-white px-4 py-3 rounded-xl hover:shadow-lg flex items-center justify-center space-x-2 shadow-lg transition-all ${
                hasNewPending ? 'flash-pending-button' : 'animate-pulse'
              }`}
            >
              <Bell className="h-5 w-5" />
              <span className="font-medium">Pending ({totalPendingCount})</span>
              {totalPendingCount !== stats.pending && (
                <span className="text-xs bg-white/30 px-2 py-0.5 rounded-full ml-2">
                  {stats.pending} today
                </span>
              )}
            </button>
          </div>
        )}

        <div className="relative">
          {/* Scrollable container */}
          <div className="overflow-x-auto scrollbar-hide px-4">
            <div className="flex gap-2 pb-2">
              <Link
                to="/admin/schedule"
                className="flex-shrink-0 bg-white/95 backdrop-blur-sm text-spa-700 px-4 py-2.5 rounded-xl hover:shadow-lg flex items-center space-x-2 shadow-md transition-all border border-spa-200"
              >
                <CalendarDays className="h-4 w-4" />
                <span className="font-medium text-sm whitespace-nowrap">Schedule</span>
              </Link>
              <Link
                to="/admin/services"
                className="flex-shrink-0 bg-white/95 backdrop-blur-sm text-sage-700 px-4 py-2.5 rounded-xl hover:shadow-lg flex items-center space-x-2 shadow-md transition-all border border-sage-200"
              >
                <Package className="h-4 w-4" />
                <span className="font-medium text-sm whitespace-nowrap">Services</span>
              </Link>
              <Link
                to="/admin/staff"
                className="flex-shrink-0 bg-white/95 backdrop-blur-sm text-stone-700 px-4 py-2.5 rounded-xl hover:shadow-lg flex items-center space-x-2 shadow-md transition-all border border-stone-200"
              >
                <Users className="h-4 w-4" />
                <span className="font-medium text-sm whitespace-nowrap">Staff</span>
              </Link>
              <Link
                to="/admin/categories"
                className="flex-shrink-0 bg-white/95 backdrop-blur-sm text-rose-700 px-4 py-2.5 rounded-xl hover:shadow-lg flex items-center space-x-2 shadow-md transition-all border border-rose-200"
              >
                <Tag className="h-4 w-4" />
                <span className="font-medium text-sm whitespace-nowrap">Categories</span>
              </Link>
              <Link
                to="/admin/archive"
                className="flex-shrink-0 bg-white/95 backdrop-blur-sm text-stone-600 px-4 py-2.5 rounded-xl hover:shadow-lg flex items-center space-x-2 shadow-md transition-all border border-stone-200"
              >
                <Archive className="h-4 w-4" />
                <span className="font-medium text-sm whitespace-nowrap">Archive</span>
              </Link>
              <Link
                to="/admin/settings"
                className="flex-shrink-0 bg-gradient-to-r from-sage-600 to-sage-700 text-white px-4 py-2.5 rounded-xl hover:shadow-lg flex items-center space-x-2 shadow-md transition-all"
              >
                <Settings className="h-4 w-4" />
                <span className="font-medium text-sm whitespace-nowrap">Settings</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards with Glass Effect */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-4 hover:shadow-2xl transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-stone-600">Total</p>
              <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-stone-700 to-stone-800">{stats.total}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-sage-100 to-spa-100 rounded-xl group-hover:scale-110 transition-transform">
              <CalendarDays className="h-6 w-6 text-sage-600" />
            </div>
          </div>
        </div>
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-4 hover:shadow-2xl transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gold-600">Pending</p>
              <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold-500 to-amber-600">{stats.pending}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-gold-100 to-amber-100 rounded-xl group-hover:scale-110 transition-transform">
              <Bell className="h-6 w-6 text-gold-600" />
            </div>
          </div>
        </div>
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-4 hover:shadow-2xl transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-sage-600">Confirmed</p>
              <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sage-600 to-sage-700">{stats.confirmed}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-sage-100 to-spa-100 rounded-xl group-hover:scale-110 transition-transform">
              <CalendarDays className="h-6 w-6 text-sage-600" />
            </div>
          </div>
        </div>
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-4 hover:shadow-2xl transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-rose-600">Cancelled</p>
              <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-rose-600">{stats.cancelled}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-rose-100 to-pink-100 rounded-xl group-hover:scale-110 transition-transform">
              <CalendarDays className="h-6 w-6 text-rose-600" />
            </div>
          </div>
        </div>
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-4 hover:shadow-2xl transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-spa-600">Completed</p>
              <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-spa-600 to-spa-700">{stats.completed}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-spa-100 to-sage-100 rounded-xl group-hover:scale-110 transition-transform">
              <CalendarDays className="h-6 w-6 text-spa-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons - Desktop */}
      <div className="hidden lg:flex items-center justify-between mb-6">
        <div className="flex gap-3">
          <button
            onClick={handleArchiveOld}
            className="bg-white/95 backdrop-blur-sm text-stone-700 px-5 py-2.5 rounded-full hover:shadow-lg flex items-center gap-2 transition-all hover:scale-105 border border-stone-200 font-light"
          >
            <Archive className="h-4 w-4" />
            Archive Old
          </button>
          <button
            onClick={handleMarkCompleted}
            className="bg-white/95 backdrop-blur-sm text-sage-700 px-5 py-2.5 rounded-full hover:shadow-lg flex items-center gap-2 transition-all hover:scale-105 border border-sage-200 font-light"
          >
            <Sparkles className="h-4 w-4" />
            Mark Completed
          </button>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-full shadow-md border border-sage-200 p-1 flex">
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-5 py-2 rounded-full text-sm font-light transition-all flex items-center gap-2 ${
              viewMode === 'calendar'
                ? 'bg-gradient-to-r from-sage-600 to-sage-700 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Grid3X3 className="h-4 w-4" />
            <span>Calendar</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-5 py-2 rounded-full text-sm font-light transition-all flex items-center gap-2 ${
              viewMode === 'list'
                ? 'bg-gradient-to-r from-sage-600 to-sage-700 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <List className="h-4 w-4" />
            <span>List</span>
          </button>
        </div>
      </div>

      {/* Action Buttons - Mobile */}
      <div className="lg:hidden space-y-3 mb-6 px-4">
        {/* View Mode Toggle */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-md border border-sage-200 p-1 flex">
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              viewMode === 'calendar'
                ? 'bg-gradient-to-r from-sage-600 to-sage-700 text-white shadow-sm'
                : 'text-stone-600'
            }`}
          >
            <Grid3X3 className="h-4 w-4" />
            <span>Calendar</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              viewMode === 'list'
                ? 'bg-gradient-to-r from-sage-600 to-sage-700 text-white shadow-sm'
                : 'text-stone-600'
            }`}
          >
            <List className="h-4 w-4" />
            <span>List</span>
          </button>
        </div>

        {/* Action Buttons Row */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleArchiveOld}
            className="bg-white/95 backdrop-blur-sm text-stone-700 px-4 py-2.5 rounded-xl hover:shadow-lg flex items-center justify-center gap-2 transition-all border border-stone-200 font-medium text-sm"
          >
            <Archive className="h-4 w-4" />
            Archive
          </button>
          <button
            onClick={handleMarkCompleted}
            className="bg-white/95 backdrop-blur-sm text-sage-700 px-4 py-2.5 rounded-xl hover:shadow-lg flex items-center justify-center gap-2 transition-all border border-sage-200 font-medium text-sm"
          >
            <Sparkles className="h-4 w-4" />
            Complete
          </button>
        </div>
      </div>
    </div>
  )
}