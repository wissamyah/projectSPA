import { CalendarDays } from 'lucide-react'

const ScheduleHeader = () => {
  return (
    <section className="relative pt-40 pb-20 bg-gradient-to-r from-sage-50 via-spa-50 to-rose-50 print:hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-64 h-64 bg-sage-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-rose-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      </div>

      <div className="relative container mx-auto px-4 text-center">
        <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-gold-300 mb-6">
          <CalendarDays className="h-4 w-4 text-gold-500 mr-2" />
          <span className="text-sm font-medium text-stone-700">Staff Scheduling</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-light text-stone-800 mb-6">
          Team
          <span className="block text-4xl md:text-5xl font-normal text-transparent bg-clip-text bg-gradient-to-r from-sage-600 to-spa-600 mt-2">
            Schedule Manager
          </span>
        </h1>

        <p className="text-xl text-stone-600 max-w-3xl mx-auto leading-relaxed">
          Coordinate your spa professionals and ensure seamless service delivery
        </p>
      </div>
    </section>
  )
}

export default ScheduleHeader