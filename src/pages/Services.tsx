import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Sparkles, ChevronRight, Flower2, Leaf, Heart, Droplets, Star, Filter, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { executeQuery, executeBatchQueries } from '../utils/supabaseQuery'

interface Service {
  id: string
  name: string
  description: string | null
  duration: number
  price: number
  category_id: string | null
}

interface Category {
  id: string
  name: string
  display_order: number
}

interface ServiceWithCategory extends Service {
  category?: Category
}

// Category icons mapping
const categoryIcons: { [key: string]: React.ReactNode } = {
  'Massage': <Heart className="h-5 w-5" />,
  'Facial': <Flower2 className="h-5 w-5" />,
  'Body Treatment': <Leaf className="h-5 w-5" />,
  'Wellness': <Droplets className="h-5 w-5" />,
  'Package': <Star className="h-5 w-5" />,
  'Uncategorized': <Sparkles className="h-5 w-5" />
}

const Services = () => {
  const [services, setServices] = useState<ServiceWithCategory[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    fetchServicesAndCategories()
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const fetchServicesAndCategories = async () => {
    console.log('[Services Page] fetchServicesAndCategories called')
    setLoading(true)

    try {
      console.log('[Services Page] Starting to fetch data...')

      // Direct queries for testing
      const [categoriesResult, servicesResult] = await Promise.all([
        supabase
          .from('service_categories')
          .select('*')
          .order('display_order'),
        supabase
          .from('services')
          .select(`
            *,
            category:service_categories(*)
          `)
          .eq('is_active', true)
          .order('name')
      ])

      console.log('[Services Page] Queries returned')
      console.log('[Services Page] Categories:', categoriesResult.data?.length || 0, 'error:', categoriesResult.error)
      console.log('[Services Page] Services:', servicesResult.data?.length || 0, 'error:', servicesResult.error)

      if (categoriesResult.error || servicesResult.error) {
        console.error('[Services Page] Errors:', {
          categories: categoriesResult.error,
          services: servicesResult.error
        })
        // Still set what we have
        setCategories(categoriesResult.data || [])
        setServices(servicesResult.data || [])
        // Retry
        setTimeout(() => {
          console.log('[Services Page] Retrying after error...')
          fetchServicesAndCategories()
        }, 3000)
      } else {
        console.log('[Services Page] Setting state with data')
        setCategories(categoriesResult.data || [])
        setServices(servicesResult.data || [])
      }
    } catch (error) {
      console.error('[Services Page] Unexpected error:', error)
      setCategories([])
      setServices([])
    } finally {
      console.log('[Services Page] Setting loading to false')
      setLoading(false)
    }
  }

  // Get filtered services based on selected category
  const getFilteredServices = () => {
    if (selectedCategory === 'all') {
      return services
    }

    if (selectedCategory === 'uncategorized') {
      return services.filter(service => !service.category)
    }

    return services.filter(service =>
      service.category?.id === selectedCategory
    )
  }

  // Get category counts
  const getCategoryCounts = () => {
    const counts: { [key: string]: number } = { all: services.length }

    categories.forEach(cat => {
      counts[cat.id] = services.filter(s => s.category?.id === cat.id).length
    })

    const uncategorizedCount = services.filter(s => !s.category).length
    if (uncategorizedCount > 0) {
      counts['uncategorized'] = uncategorizedCount
    }

    return counts
  }

  const categoryCounts = getCategoryCounts()
  const filteredServices = getFilteredServices()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-sage-50">
        <div className="container mx-auto px-4 pt-36 pb-16">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2">
              <div className="w-2 h-2 bg-sage-600 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-sage-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-sage-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <p className="text-stone-600 mt-4">Loading our exclusive treatments...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-sage-50">
      {/* Hero Section */}
      <section className="relative pt-40 pb-20 bg-gradient-to-r from-sage-50 via-spa-50 to-rose-50">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-64 h-64 bg-sage-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-rose-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        </div>

        <div className="relative container mx-auto px-4 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-gold-300 mb-6">
            <Sparkles className="h-4 w-4 text-gold-500 mr-2" />
            <span className="text-sm font-medium text-stone-700">Our Treatments</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-light text-stone-800 mb-6">
            Indulge in
            <span className="block text-4xl md:text-5xl font-normal text-transparent bg-clip-text bg-gradient-to-r from-sage-600 to-spa-600 mt-2">
              Pure Bliss
            </span>
          </h1>

          <p className="text-xl text-stone-600 max-w-3xl mx-auto leading-relaxed">
            Discover our comprehensive collection of luxury spa treatments,
            each designed to restore balance and enhance your natural radiance
          </p>
        </div>
      </section>

      {/* Category Filters - Desktop */}
      <section className={`sticky z-40 glass-effect shadow-sm hidden md:block transition-all duration-500 ${
        isScrolled ? 'top-[60px]' : 'top-[88px]'
      }`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center space-x-2 py-4 overflow-x-auto">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-6 py-2.5 rounded-full transition-all duration-300 flex items-center space-x-2 ${
                selectedCategory === 'all'
                  ? 'bg-gradient-to-r from-sage-600 to-sage-700 text-white shadow-lg'
                  : 'bg-white border border-sage-200 text-stone-700 hover:border-sage-400'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>All Services</span>
              <span className="ml-1 text-xs opacity-70">({categoryCounts.all})</span>
            </button>

            {categories.map((category) => (
              categoryCounts[category.id] > 0 && (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-6 py-2.5 rounded-full transition-all duration-300 flex items-center space-x-2 ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-sage-600 to-sage-700 text-white shadow-lg'
                      : 'bg-white border border-sage-200 text-stone-700 hover:border-sage-400'
                  }`}
                >
                  {categoryIcons[category.name] || <Sparkles className="h-4 w-4" />}
                  <span>{category.name}</span>
                  <span className="ml-1 text-xs opacity-70">({categoryCounts[category.id]})</span>
                </button>
              )
            ))}

            {categoryCounts['uncategorized'] > 0 && (
              <button
                onClick={() => setSelectedCategory('uncategorized')}
                className={`px-6 py-2.5 rounded-full transition-all duration-300 flex items-center space-x-2 ${
                  selectedCategory === 'uncategorized'
                    ? 'bg-gradient-to-r from-sage-600 to-sage-700 text-white shadow-lg'
                    : 'bg-white border border-sage-200 text-stone-700 hover:border-sage-400'
                }`}
              >
                <Sparkles className="h-4 w-4" />
                <span>Other</span>
                <span className="ml-1 text-xs opacity-70">({categoryCounts['uncategorized']})</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Mobile Filter Button */}
      <div className={`md:hidden sticky z-40 glass-effect shadow-sm transition-all duration-500 ${
        isScrolled ? 'top-[60px]' : 'top-[88px]'
      }`}>
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="w-full bg-gradient-to-r from-sage-600 to-sage-700 text-white px-6 py-3 rounded-full flex items-center justify-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>Filter Services</span>
            {selectedCategory !== 'all' && (
              <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                Filtered
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Filter Menu */}
      {isFilterOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setIsFilterOpen(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-stone-800">Filter by Category</h3>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="p-2 hover:bg-sage-50 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-stone-600" />
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              <button
                onClick={() => {
                  setSelectedCategory('all')
                  setIsFilterOpen(false)
                }}
                className={`w-full px-4 py-3 rounded-lg flex items-center justify-between ${
                  selectedCategory === 'all'
                    ? 'bg-sage-100 text-sage-700'
                    : 'hover:bg-sage-50 text-stone-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Sparkles className="h-5 w-5" />
                  <span>All Services</span>
                </div>
                <span className="text-sm opacity-70">{categoryCounts.all}</span>
              </button>

              {categories.map((category) => (
                categoryCounts[category.id] > 0 && (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.id)
                      setIsFilterOpen(false)
                    }}
                    className={`w-full px-4 py-3 rounded-lg flex items-center justify-between ${
                      selectedCategory === category.id
                        ? 'bg-sage-100 text-sage-700'
                        : 'hover:bg-sage-50 text-stone-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {categoryIcons[category.name] || <Sparkles className="h-5 w-5" />}
                      <span>{category.name}</span>
                    </div>
                    <span className="text-sm opacity-70">{categoryCounts[category.id]}</span>
                  </button>
                )
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Services Grid */}
      <section className="container mx-auto px-4 py-16">
        {filteredServices.length === 0 ? (
          <div className="text-center py-16">
            <Flower2 className="h-16 w-16 mx-auto mb-4 text-sage-300 animate-float" />
            <p className="text-stone-600 text-lg">No services found in this category</p>
            <button
              onClick={() => setSelectedCategory('all')}
              className="mt-4 text-sage-600 hover:text-sage-700 underline"
            >
              View all services
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredServices.map((service, index) => (
              <div
                key={service.id}
                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden animate-slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Card Header with Gradient */}
                <div className="h-32 bg-gradient-to-br from-sage-100 via-spa-50 to-rose-50 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-4 right-4 w-24 h-24 bg-sage-300 rounded-full filter blur-2xl"></div>
                    <div className="absolute bottom-4 left-4 w-20 h-20 bg-rose-300 rounded-full filter blur-2xl"></div>
                  </div>
                  <div className="relative h-full flex items-center justify-center">
                    <div className="bg-white/80 backdrop-blur-sm p-4 rounded-full">
                      {categoryIcons[service.category?.name || 'Uncategorized'] || (
                        <Sparkles className="h-8 w-8 text-sage-600" />
                      )}
                    </div>
                  </div>
                  {/* Category Badge */}
                  {service.category && (
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                      <span className="text-xs font-medium text-stone-700">{service.category.name}</span>
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-8">
                  <h3 className="text-xl font-medium text-stone-800 mb-3 group-hover:text-sage-700 transition-colors">
                    {service.name}
                  </h3>

                  <p className="text-stone-600 mb-6 line-clamp-2 leading-relaxed">
                    {service.description || 'Experience ultimate relaxation with our premium spa treatment'}
                  </p>

                  {/* Service Details */}
                  <div className="flex items-center justify-between mb-6 pb-6 border-b border-sage-100">
                    <div className="flex items-center text-stone-600">
                      <Clock className="h-4 w-4 mr-2 text-spa-600" />
                      <span className="text-sm">{service.duration} minutes</span>
                    </div>
                    <div className="text-2xl font-light text-sage-700">
                      ${Number(service.price).toFixed(0)}
                    </div>
                  </div>

                  {/* Book Button */}
                  <Link
                    to={`/book?service=${service.id}`}
                    className="w-full bg-gradient-to-r from-sage-600 to-sage-700 text-white py-3 rounded-full hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2 group"
                  >
                    <span>Reserve Treatment</span>
                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-stone-900 to-stone-800 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-gold-500 rounded-full mix-blend-overlay filter blur-3xl opacity-10"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-sage-500 rounded-full mix-blend-overlay filter blur-3xl opacity-10"></div>
        </div>

        <div className="relative container mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gold-500/20 rounded-full mb-6">
            <Star className="h-8 w-8 text-gold-400" />
          </div>

          <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
            Not Sure Which Treatment to Choose?
          </h2>

          <p className="text-xl text-stone-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Our expert therapists will help you create a personalized spa experience
            tailored to your unique wellness needs
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/book"
              className="group bg-gradient-to-r from-gold-400 to-gold-500 text-stone-900 px-10 py-4 rounded-full hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2 font-medium"
            >
              <span>Book a Consultation</span>
              <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="tel:+1234567890"
              className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-10 py-4 rounded-full hover:bg-white/20 transition-all duration-300"
            >
              <span>Call for Advice</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Services