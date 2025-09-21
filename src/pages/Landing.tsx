import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Clock, Star, Users, ChevronRight, Sparkles, Flower2, Heart, Leaf, Droplets } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { executeQuery } from '../utils/supabaseQuery'

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
    console.log('[Landing] fetchPopularServices called')

    try {
      console.log('[Landing] Starting to fetch popular services...')

      // Direct query for testing
      const { data, error } = await supabase
        .from('services')
        .select('id, name, duration, price')
        .eq('is_active', true)
        .limit(4)
        .order('name')

      console.log('[Landing] Query returned, data:', data?.length || 0, 'services, error:', error)

      if (error) {
        console.error('[Landing] Error fetching services:', error)
        setPopularServices([])
        // Retry after a delay
        setTimeout(() => {
          console.log('[Landing] Retrying fetch...')
          fetchPopularServices()
        }, 3000)
      } else if (data) {
        console.log('[Landing] Setting', data.length, 'popular services')
        setPopularServices(data)
      } else {
        console.log('[Landing] No data and no error, setting empty services')
        setPopularServices([])
      }
    } catch (error) {
      console.error('[Landing] Unexpected error in fetchPopularServices:', error)
      setPopularServices([])
    } finally {
      console.log('[Landing] Setting loading to false')
      setLoading(false)
    }
  }

  const features = [
    {
      icon: <Flower2 className="h-10 w-10 text-sage-600" />,
      title: "Luxury Experience",
      description: "Immerse yourself in tranquility with our premium spa treatments"
    },
    {
      icon: <Heart className="h-10 w-10 text-rose-500" />,
      title: "Holistic Wellness",
      description: "Nurture your mind, body, and spirit with personalized care"
    },
    {
      icon: <Leaf className="h-10 w-10 text-sage-600" />,
      title: "Natural Products",
      description: "Pure, organic ingredients for the ultimate skin rejuvenation"
    },
    {
      icon: <Droplets className="h-10 w-10 text-spa-500" />,
      title: "Expert Therapists",
      description: "Certified professionals dedicated to your complete relaxation"
    }
  ]

  return (
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen pt-20 bg-gradient-to-br from-cream-50 via-rose-50 to-sage-50">
        {/* Decorative background elements - optimized for mobile */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 -left-20 md:left-10 w-48 md:w-72 h-48 md:h-72 bg-sage-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 md:opacity-30 animate-float"></div>
          <div className="absolute top-40 -right-20 md:right-10 w-48 md:w-72 h-48 md:h-72 bg-rose-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 md:opacity-30 animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 w-48 md:w-72 h-48 md:h-72 bg-spa-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 md:opacity-30 animate-float" style={{ animationDelay: '4s' }}></div>
        </div>

        <div className="relative container mx-auto px-6 md:px-4 py-20 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Decorative element - enhanced for mobile */}
            <div className="flex justify-center mb-8 md:mb-6 animate-slide-up">
              <div className="inline-flex items-center px-5 py-2.5 md:px-4 md:py-2 bg-white/90 md:bg-white/80 backdrop-blur-sm rounded-full border border-gold-300 shadow-sm">
                <Sparkles className="h-4 w-4 text-gold-500 mr-2" />
                <span className="text-sm font-medium text-stone-700">Welcome to Serenity</span>
              </div>
            </div>

            {/* Main heading - better mobile typography */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-stone-800 mb-4 md:mb-6 animate-slide-up leading-tight" style={{ animationDelay: '0.1s' }}>
              Discover Your
              <span className="block text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal text-transparent bg-clip-text bg-gradient-to-r from-sage-600 to-spa-600 mt-2 md:mt-2">
                Inner Peace
              </span>
            </h1>

            {/* Description - improved mobile readability */}
            <p className="text-base sm:text-lg md:text-xl text-stone-600 mb-10 md:mb-12 leading-relaxed max-w-2xl mx-auto animate-slide-up px-4 md:px-0" style={{ animationDelay: '0.2s' }}>
              Escape to a sanctuary of tranquility where luxury meets wellness.
              <span className="hidden sm:inline"> Experience transformative spa treatments tailored to restore your natural radiance.</span>
              <span className="sm:hidden block mt-3">Transform your wellness journey with our expert treatments.</span>
            </p>

            {/* CTA Buttons - enhanced mobile layout */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center animate-slide-up px-4 md:px-0" style={{ animationDelay: '0.3s' }}>
              <Link
                to="/book"
                className="group bg-gradient-to-r from-sage-600 to-sage-700 text-white px-8 sm:px-10 py-4 rounded-full hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg"
              >
                <span className="font-medium text-base sm:text-base">Book Your Escape</span>
                <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/services"
                className="group bg-white/95 sm:bg-white/90 backdrop-blur-sm border-2 border-sage-300 text-sage-700 px-8 sm:px-10 py-4 rounded-full hover:bg-sage-50 hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2 shadow-md sm:shadow-none"
              >
                <span className="font-medium text-base sm:text-base">Explore Treatments</span>
                <Sparkles className="h-5 w-5 text-gold-500 group-hover:rotate-12 transition-transform" />
              </Link>
            </div>

            {/* Trust indicators - improved mobile spacing */}
            <div className="mt-12 md:mt-16 grid grid-cols-1 sm:flex sm:flex-wrap justify-center gap-6 sm:gap-8 text-stone-600 animate-slide-up px-4 md:px-0" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center justify-center sm:justify-start space-x-2 py-2 sm:py-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gold-50">
                  <Star className="h-5 w-5 text-gold-500" />
                </div>
                <span className="text-sm font-medium">5-Star Rated</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start space-x-2 py-2 sm:py-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-sage-50">
                  <Users className="h-5 w-5 text-sage-600" />
                </div>
                <span className="text-sm font-medium">10,000+ Happy Clients</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start space-x-2 py-2 sm:py-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-spa-50">
                  <Calendar className="h-5 w-5 text-spa-600" />
                </div>
                <span className="text-sm font-medium">Easy Online Booking</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-light text-stone-800 mb-4">
              The <span className="font-normal text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-rose-600">Luxury</span> Experience
            </h2>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              Indulge in our signature spa treatments designed to rejuvenate your senses
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group text-center p-6 hover:bg-gradient-to-br hover:from-cream-50 hover:to-sage-50 rounded-2xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="bg-gradient-to-br from-white to-cream-50 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-medium text-stone-800 mb-3">{feature.title}</h3>
                <p className="text-stone-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-24 bg-gradient-to-br from-spa-50 via-white to-rose-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-light text-stone-800 mb-4">
              Signature <span className="font-normal text-transparent bg-clip-text bg-gradient-to-r from-spa-600 to-sage-600">Treatments</span>
            </h2>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              Carefully curated spa services to address your unique wellness needs
            </p>
          </div>

          {loading ? (
            <div className="text-center">
              <div className="inline-flex items-center space-x-2">
                <div className="w-2 h-2 bg-sage-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-sage-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-sage-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <p className="text-stone-600 mt-4">Loading our exclusive treatments...</p>
            </div>
          ) : popularServices.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {popularServices.map((service, index) => (
                  <div
                    key={service.id}
                    className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden hover:-translate-y-2"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Decorative gradient top */}
                    <div className="h-2 bg-gradient-to-r from-sage-400 via-spa-400 to-rose-400"></div>

                    <div className="p-8">
                      <div className="mb-4">
                        <Leaf className="h-8 w-8 text-sage-500 opacity-50" />
                      </div>
                      <h3 className="text-xl font-medium text-stone-800 mb-3">{service.name}</h3>

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center text-stone-600">
                          <Clock className="h-4 w-4 mr-1 text-spa-600" />
                          <span className="text-sm">{service.duration} min</span>
                        </div>
                        <div className="text-2xl font-light text-sage-700">
                          ${Number(service.price).toFixed(0)}
                        </div>
                      </div>

                      <button className="w-full py-2 text-sm font-medium text-sage-700 bg-sage-50 rounded-lg hover:bg-sage-100 transition-colors duration-200">
                        Learn More
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <Link
                  to="/services"
                  className="inline-flex items-center space-x-2 px-8 py-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
                >
                  <span className="text-sage-700 font-medium">View All Treatments</span>
                  <ChevronRight className="h-5 w-5 text-sage-600 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Flower2 className="h-16 w-16 mx-auto mb-4 text-sage-300 animate-float" />
              <p className="text-stone-600 text-lg">New treatments coming soon!</p>
              <p className="text-stone-500 mt-2">Check back for our exclusive spa services</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-stone-900 to-stone-800 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-gold-500 rounded-full mix-blend-overlay filter blur-3xl opacity-10"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-sage-500 rounded-full mix-blend-overlay filter blur-3xl opacity-10"></div>
        </div>

        <div className="relative container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gold-500/20 rounded-full mb-6">
              <Sparkles className="h-8 w-8 text-gold-400" />
            </div>

            <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
              Begin Your Journey to
              <span className="block text-3xl md:text-4xl font-normal text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-300 mt-2">
                Complete Wellness
              </span>
            </h2>

            <p className="text-xl text-stone-300 mb-10 leading-relaxed">
              Reserve your personalized spa experience today and discover
              the perfect balance of luxury and tranquility
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/book"
                className="group bg-gradient-to-r from-gold-400 to-gold-500 text-stone-900 px-10 py-4 rounded-full hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2 font-medium"
              >
                <span>Book Your Treatment</span>
                <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="tel:+1234567890"
                className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-10 py-4 rounded-full hover:bg-white/20 transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <span>Call Us Today</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Landing