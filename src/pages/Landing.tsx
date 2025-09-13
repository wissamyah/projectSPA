import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Clock, Star, Users, ChevronRight, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Service {
  id: string
  name: string
  duration: number
  price: number
}

const Landing = () => {
  const [popularServices, setPopularServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPopularServices()
  }, [])

  const fetchPopularServices = async () => {
    try {
      // Fetch first 4 active services as popular services
      const { data, error } = await supabase
        .from('services')
        .select('id, name, duration, price')
        .eq('is_active', true)
        .limit(4)
        .order('name')

      if (error) throw error
      setPopularServices(data || [])
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoading(false)
    }
  }

  const features = [
    {
      icon: <Calendar className="h-8 w-8 text-slate-700" />,
      title: "Easy Booking",
      description: "Book your spa appointment in just a few clicks"
    },
    {
      icon: <Clock className="h-8 w-8 text-slate-700" />,
      title: "Flexible Scheduling",
      description: "Choose from available time slots that work for you"
    },
    {
      icon: <Star className="h-8 w-8 text-slate-700" />,
      title: "Premium Services",
      description: "Wide range of spa treatments and wellness services"
    },
    {
      icon: <Users className="h-8 w-8 text-slate-700" />,
      title: "Expert Therapists",
      description: "Experienced professionals dedicated to your wellness"
    }
  ]

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-50 to-ivory-50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl font-bold text-slate-900 mb-6">
              Your Journey to <span className="text-slate-700">Relaxation</span> Starts Here
            </h1>
            <p className="text-xl text-slate-600 mb-8">
              Book your perfect spa experience with our easy online booking system. 
              Relax, rejuvenate, and restore your well-being.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/book" 
                className="bg-slate-700 text-white px-8 py-3 rounded-lg hover:bg-slate-800 flex items-center justify-center space-x-2"
              >
                <span>Book Appointment</span>
                <ChevronRight className="h-5 w-5" />
              </Link>
              <Link 
                to="/services" 
                className="border-2 border-slate-700 text-slate-700 px-8 py-3 rounded-lg hover:bg-slate-50 flex items-center justify-center space-x-2"
              >
                <span>View Services</span>
                <Sparkles className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            Why Choose Our Spa
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="bg-ivory-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            Popular Services
          </h2>
          {loading ? (
            <div className="text-center">
              <p className="text-slate-600">Loading services...</p>
            </div>
          ) : popularServices.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {popularServices.map((service) => (
                  <div key={service.id} className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">{service.name}</h3>
                    <p className="text-slate-600 mb-1">{service.duration} min</p>
                    <p className="text-2xl font-bold text-slate-700">${Number(service.price).toFixed(0)}</p>
                  </div>
                ))}
              </div>
              <div className="text-center">
                <Link 
                  to="/services" 
                  className="inline-flex items-center space-x-2 text-slate-700 hover:text-slate-900"
                >
                  <span>View All Services</span>
                  <ChevronRight className="h-5 w-5" />
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-600">Services coming soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="bg-slate-700 rounded-2xl p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to Relax?</h2>
            <p className="text-xl mb-8 opacity-90">
              Book your spa treatment today and experience ultimate relaxation
            </p>
            <Link 
              to="/book" 
              className="bg-white text-slate-700 px-8 py-3 rounded-lg hover:bg-ivory-50 inline-flex items-center space-x-2"
            >
              <span>Book Now</span>
              <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Landing