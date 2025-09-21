import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, Edit2, Trash2, DollarSign, Clock, Save, X, Package, Tag, Sparkles, Flower2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useModal } from '../contexts/ModalContext'

interface ServiceCategory {
  id: string
  name: string
  display_order: number
}

interface Service {
  id: string
  category_id: string | null
  name: string
  description: string
  duration: number
  price: number
  is_active: boolean
  display_order: number
  category?: ServiceCategory
}

const AdminServices = () => {
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    duration: 60,
    price: 0,
    is_active: true
  })
  const { showAlert, showConfirm } = useModal()

  useEffect(() => {
    fetchCategories()
    fetchServices()
  }, [])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .order('display_order')

      if (error) throw error
      setCategories(data || [])
      
      // If no categories exist, prompt to create them
      if (data && data.length === 0) {
        await showAlert('No categories found. Please create categories first from the Categories page.', 'warning')
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchServices = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          category:service_categories(*)
        `)
        .order('display_order')

      if (error) throw error
      setServices(data || [])
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
               name === 'duration' || name === 'price' ? parseFloat(value) || 0 : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const submitData = {
        ...formData,
        category_id: formData.category_id || null
      }

      if (editingService) {
        const { error } = await supabase
          .from('services')
          .update(submitData)
          .eq('id', editingService.id)

        if (error) throw error
        await showAlert('Service updated successfully!', 'success')
      } else {
        const { error } = await supabase
          .from('services')
          .insert([submitData])

        if (error) throw error
        await showAlert('Service added successfully!', 'success')
      }

      setFormData({
        name: '',
        description: '',
        category_id: '',
        duration: 60,
        price: 0,
        is_active: true
      })
      setShowAddForm(false)
      setEditingService(null)
      fetchServices()
    } catch (error: any) {
      await showAlert('Error saving service: ' + error.message, 'error')
    }
  }

  const handleEdit = (service: Service) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      description: service.description || '',
      category_id: service.category_id || '',
      duration: service.duration,
      price: service.price,
      is_active: service.is_active
    })
    setShowAddForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!(await showConfirm('Are you sure you want to delete this service? This will also remove all staff assignments for this service.'))) return

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id)

      if (error) throw error
      await showAlert('Service deleted successfully!', 'success')
      fetchServices()
    } catch (error: any) {
      await showAlert('Error deleting service: ' + error.message, 'error')
    }
  }

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error
      fetchServices()
    } catch (error: any) {
      await showAlert('Error updating status: ' + error.message, 'error')
    }
  }

  const cancelForm = () => {
    setShowAddForm(false)
    setEditingService(null)
    setFormData({
      name: '',
      description: '',
      category_id: '',
      duration: 60,
      price: 0,
      is_active: true
    })
  }

  const groupServicesByCategory = () => {
    const grouped: { [key: string]: Service[] } = { 'Uncategorized': [] }
    categories.forEach(cat => {
      grouped[cat.name] = []
    })
    
    services.forEach(service => {
      if (service.category) {
        grouped[service.category.name] = grouped[service.category.name] || []
        grouped[service.category.name].push(service)
      } else {
        grouped['Uncategorized'].push(service)
      }
    })

    return Object.entries(grouped).filter(([_, services]) => services.length > 0)
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
            <Package className="h-4 w-4 text-gold-500 mr-2" />
            <span className="text-sm font-medium text-stone-700">Service Management</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-light text-stone-800 mb-6">
            Spa
            <span className="block text-4xl md:text-5xl font-normal text-transparent bg-clip-text bg-gradient-to-r from-sage-600 to-spa-600 mt-2">
              Services
            </span>
          </h1>

          <p className="text-xl text-stone-600 max-w-3xl mx-auto leading-relaxed">
            Curate your collection of therapeutic treatments and wellness experiences
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

        {/* Action Button */}
        {!showAddForm && (
          <div className="mb-6">
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-sage-600 to-sage-700 text-white px-6 py-2.5 rounded-full hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span className="font-light">Add Service</span>
            </button>
          </div>
        )}

        {showAddForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">
            {editingService ? 'Edit Service' : 'Add New Service'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <Package className="inline h-4 w-4 mr-1" />
                  Service Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                  placeholder="e.g., Swedish Massage"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <Tag className="inline h-4 w-4 mr-1" />
                  Category
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                >
                  <option value="">No Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  required
                  min="15"
                  step="15"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <DollarSign className="inline h-4 w-4 mr-1" />
                  Price ($) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                placeholder="Brief description of the service..."
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                className="h-4 w-4 text-slate-700 rounded"
              />
              <label className="ml-2 text-sm text-slate-700">
                Active (available for booking)
              </label>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-slate-700 text-white px-6 py-2 rounded-lg hover:bg-slate-800 flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{editingService ? 'Update' : 'Add'} Service</span>
              </button>
              <button
                type="button"
                onClick={cancelForm}
                className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="text-slate-600">Loading services...</div>
        </div>
      ) : (
        <div className="space-y-6">
          {services.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Package className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-600">No services yet</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 text-slate-700 hover:text-slate-900 font-medium"
              >
                Add your first service
              </button>
            </div>
          ) : (
            groupServicesByCategory().map(([categoryName, categoryServices]) => (
              <div key={categoryName} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-slate-50 px-6 py-3">
                  <h3 className="text-lg font-semibold text-slate-800">{categoryName}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                          Service
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                          Duration
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {categoryServices.map((service) => (
                        <tr key={service.id}>
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-slate-900">{service.name}</div>
                              {service.description && (
                                <div className="text-xs text-slate-500 max-w-xs">{service.description}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            <Clock className="inline h-3 w-3 mr-1" />
                            {service.duration} min
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-900">
                            <DollarSign className="inline h-3 w-3" />
                            {service.price.toFixed(2)}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => toggleStatus(service.id, service.is_active)}
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                service.is_active 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {service.is_active ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium">
                            <button
                              onClick={() => handleEdit(service)}
                              className="text-slate-600 hover:text-slate-900 mr-3"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(service.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      </div>
    </div>
  )
}

export default AdminServices