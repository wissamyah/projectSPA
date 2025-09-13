import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Clock, DollarSign, ChevronRight, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'

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

const Services = () => {
  const [services, setServices] = useState<ServiceWithCategory[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchServicesAndCategories()
  }, [])

  const fetchServicesAndCategories = async () => {
    setLoading(true)
    try {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('service_categories')
        .select('*')
        .order('display_order')

      if (categoriesError) throw categoriesError
      setCategories(categoriesData || [])

      // Fetch services with categories
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select(`
          *,
          category:service_categories(*)
        `)
        .eq('is_active', true)
        .order('name')

      if (servicesError) throw servicesError
      setServices(servicesData || [])
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoading(false)
    }
  }

  // Group services by category
  const getServicesByCategory = () => {
    const grouped: { [key: string]: ServiceWithCategory[] } = {}
    
    // Initialize with all categories
    categories.forEach(cat => {
      grouped[cat.name] = []
    })
    
    // Add "Uncategorized" for services without category
    grouped['Uncategorized'] = []
    
    // Group services
    services.forEach(service => {
      if (service.category) {
        if (!grouped[service.category.name]) {
          grouped[service.category.name] = []
        }
        grouped[service.category.name].push(service)
      } else {
        grouped['Uncategorized'].push(service)
      }
    })
    
    // Filter out empty categories
    return Object.entries(grouped).filter(([_, services]) => services.length > 0)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <div className="text-slate-600">Loading services...</div>
        </div>
      </div>
    )
  }

  const servicesByCategory = getServicesByCategory()

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Our Services</h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Discover our comprehensive range of spa treatments designed to rejuvenate your body and mind
        </p>
      </div>

      {servicesByCategory.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <Sparkles className="h-12 w-12 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-600">No services available at the moment.</p>
          <p className="text-sm text-slate-500 mt-2">Please check back later.</p>
        </div>
      ) : (
        servicesByCategory.map(([categoryName, categoryServices]) => (
          <div key={categoryName} className="mb-12">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">{categoryName}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryServices.map((service) => (
                <div key={service.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">{service.name}</h3>
                  <p className="text-slate-600 mb-4">
                    {service.description || 'Experience our premium spa treatment'}
                  </p>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-1 text-slate-700">
                      <Clock className="h-4 w-4" />
                      <span>{service.duration} min</span>
                    </div>
                    <div className="flex items-center space-x-1 text-slate-700">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-semibold">{Number(service.price).toFixed(0)}</span>
                    </div>
                  </div>
                  <Link 
                    to={`/book?service=${service.id}`}
                    className="w-full bg-slate-700 text-white py-2 rounded-lg hover:bg-slate-800 flex items-center justify-center space-x-2"
                  >
                    <span>Book Now</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      <div className="text-center mt-12 p-8 bg-slate-50 rounded-lg">
        <h3 className="text-2xl font-bold text-slate-900 mb-4">Ready to Book?</h3>
        <p className="text-slate-600 mb-6">Choose your preferred service and book your appointment today</p>
        <Link 
          to="/book" 
          className="inline-flex items-center space-x-2 bg-slate-700 text-white px-6 py-3 rounded-lg hover:bg-slate-800"
        >
          <span>Book Appointment</span>
          <ChevronRight className="h-5 w-5" />
        </Link>
      </div>
    </div>
  )
}

export default Services