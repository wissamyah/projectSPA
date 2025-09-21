import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, Edit2, Trash2, User, Mail, Phone, Calendar, CheckCircle, XCircle, Save, X, Info, Users, Heart, Sparkles, Flower2, Star } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Tooltip from '../components/Tooltip'
import { useModal } from '../contexts/ModalContext'

interface Staff {
  id: string
  name: string
  email: string
  phone: string
  specialization: string
  bio: string
  is_active: boolean
  hire_date: string
}

interface Service {
  id: string
  name: string
  category_id: string | null
  duration: number
  price: number
  is_active: boolean
}

interface Category {
  id: string
  name: string
  display_order: number
}

interface StaffService {
  staff_id: string
  service_id: string
}

interface StaffCategory {
  staff_id: string
  category_id: string
}

const AdminStaff = () => {
  const [staff, setStaff] = useState<Staff[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [staffServices, setStaffServices] = useState<StaffService[]>([])
  const [staffCategories, setStaffCategories] = useState<StaffCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    bio: '',
    is_active: true
  })
  const { showAlert, showConfirm } = useModal()

  useEffect(() => {
    fetchStaff()
    fetchCategories()
    fetchServices()
    fetchStaffServices()
    fetchStaffCategories()
  }, [])

  useEffect(() => {
    // When categories change, update the available services
    if (selectedCategories.length > 0) {
      fetchServicesByCategories()
    } else {
      setSelectedServices([])
    }
  }, [selectedCategories])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .order('display_order')

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchStaffCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_categories')
        .select('*')

      if (error) throw error
      setStaffCategories(data || [])
    } catch (error) {
      console.error('Error fetching staff categories:', error)
    }
  }

  const fetchServicesByCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .in('category_id', selectedCategories)
        .eq('is_active', true)
        .order('name')

      if (error) throw error

      // Keep only services that are in the selected categories
      const serviceIds = (data || []).map(s => s.id)
      setSelectedServices(prev => prev.filter(id => serviceIds.includes(id)))
    } catch (error) {
      console.error('Error fetching services by categories:', error)
    }
  }

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setServices(data || [])
    } catch (error) {
      console.error('Error fetching services:', error)
    }
  }

  const fetchStaffServices = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_services')
        .select('*')

      if (error) throw error
      setStaffServices(data || [])
    } catch (error) {
      console.error('Error fetching staff services:', error)
    }
  }

  const fetchStaff = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('name')

      if (error) throw error
      setStaff(data || [])
    } catch (error) {
      console.error('Error fetching staff:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingStaff) {
        // Update existing staff
        const { error } = await supabase
          .from('staff')
          .update(formData)
          .eq('id', editingStaff.id)

        if (error) throw error

        // Update staff services and categories
        await updateStaffServices(editingStaff.id)
        await updateStaffCategories(editingStaff.id)
        await showAlert('Staff member updated successfully!', 'success')
      } else {
        // Add new staff
        const { data: newStaff, error } = await supabase
          .from('staff')
          .insert([formData])
          .select()
          .single()

        if (error) throw error

        // Add staff services and categories
        if (newStaff) {
          if (selectedServices.length > 0) {
            await updateStaffServices(newStaff.id)
          }
          if (selectedCategories.length > 0) {
            await updateStaffCategories(newStaff.id)
          }
        }
        await showAlert('Staff member added successfully!', 'success')
      }

      // Reset form and refresh
      setFormData({
        name: '',
        email: '',
        phone: '',
        specialization: '',
        bio: '',
        is_active: true
      })
      setSelectedServices([])
      setSelectedCategories([])
      setShowAddForm(false)
      setEditingStaff(null)
      fetchStaff()
      fetchStaffServices()
      fetchStaffCategories()
    } catch (error: any) {
      await showAlert('Error saving staff: ' + error.message, 'error')
    }
  }

  const updateStaffCategories = async (staffId: string) => {
    try {
      // Delete existing categories for this staff member
      await supabase
        .from('staff_categories')
        .delete()
        .eq('staff_id', staffId)

      // Insert new categories
      if (selectedCategories.length > 0) {
        const staffCategoryRecords = selectedCategories.map(categoryId => ({
          staff_id: staffId,
          category_id: categoryId
        }))

        const { error } = await supabase
          .from('staff_categories')
          .insert(staffCategoryRecords)

        if (error) throw error
      }
    } catch (error) {
      console.error('Error updating staff categories:', error)
    }
  }

  const updateStaffServices = async (staffId: string) => {
    try {
      // Delete existing services for this staff member
      await supabase
        .from('staff_services')
        .delete()
        .eq('staff_id', staffId)

      // Insert new services
      if (selectedServices.length > 0) {
        const staffServiceRecords = selectedServices.map(serviceId => ({
          staff_id: staffId,
          service_id: serviceId
        }))

        const { error } = await supabase
          .from('staff_services')
          .insert(staffServiceRecords)

        if (error) throw error
      }
    } catch (error) {
      console.error('Error updating staff services:', error)
    }
  }

  const handleEdit = (staffMember: Staff) => {
    setEditingStaff(staffMember)
    setFormData({
      name: staffMember.name,
      email: staffMember.email || '',
      phone: staffMember.phone || '',
      specialization: staffMember.specialization || '',
      bio: staffMember.bio || '',
      is_active: staffMember.is_active
    })

    // Set selected services and categories for this staff member
    const memberServices = staffServices
      .filter(ss => ss.staff_id === staffMember.id)
      .map(ss => ss.service_id)
    setSelectedServices(memberServices)

    const memberCategories = staffCategories
      .filter(sc => sc.staff_id === staffMember.id)
      .map(sc => sc.category_id)
    setSelectedCategories(memberCategories)

    setShowAddForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!(await showConfirm('Are you sure you want to delete this staff member?'))) return

    try {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', id)

      if (error) throw error
      await showAlert('Staff member deleted successfully!', 'success')
      fetchStaff()
    } catch (error: any) {
      await showAlert('Error deleting staff: ' + error.message, 'error')
    }
  }

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('staff')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error
      fetchStaff()
    } catch (error: any) {
      await showAlert('Error updating status: ' + error.message, 'error')
    }
  }

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId)
      } else {
        return [...prev, categoryId]
      }
    })
  }

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId)
      } else {
        return [...prev, serviceId]
      }
    })
  }

  const getStaffServiceCount = (staffId: string) => {
    return staffServices.filter(ss => ss.staff_id === staffId).length
  }

  const getStaffServicesList = (staffId: string) => {
    const serviceIds = staffServices
      .filter(ss => ss.staff_id === staffId)
      .map(ss => ss.service_id)

    return services
      .filter(s => serviceIds.includes(s.id))
      .map(s => ({ name: s.name, duration: s.duration, price: s.price }))
  }

  const getStaffCategoryNames = (staffId: string) => {
    const categoryIds = staffCategories
      .filter(sc => sc.staff_id === staffId)
      .map(sc => sc.category_id)

    return categories
      .filter(c => categoryIds.includes(c.id))
      .map(c => c.name)
      .join(', ')
  }

  const getServicesByCategory = () => {
    const servicesByCategory: { [key: string]: Service[] } = {}

    selectedCategories.forEach(categoryId => {
      const category = categories.find(c => c.id === categoryId)
      if (category) {
        servicesByCategory[category.name] = services.filter(s => s.category_id === categoryId)
      }
    })

    return servicesByCategory
  }

  const cancelForm = () => {
    setShowAddForm(false)
    setEditingStaff(null)
    setFormData({
      name: '',
      email: '',
      phone: '',
      specialization: '',
      bio: '',
      is_active: true
    })
    setSelectedServices([])
    setSelectedCategories([])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-sage-50">
      {/* Hero Section */}
      <section className="relative pt-40 pb-20 bg-gradient-to-r from-sage-50 via-spa-50 to-rose-50">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-64 h-64 bg-sage-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-rose-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-spa-100 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
        </div>

        <div className="relative container mx-auto px-4 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-gold-300 mb-6">
            <Users className="h-4 w-4 text-gold-500 mr-2" />
            <span className="text-sm font-medium text-stone-700">Team Excellence</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-light text-stone-800 mb-6">
            Our Healing
            <span className="block text-4xl md:text-5xl font-normal text-transparent bg-clip-text bg-gradient-to-r from-sage-600 to-spa-600 mt-2">
              Practitioners
            </span>
          </h1>

          <p className="text-xl text-stone-600 max-w-3xl mx-auto leading-relaxed">
            Nurture your team of skilled therapists and wellness experts
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
              <span className="font-light">Add Staff Member</span>
            </button>
          </div>
        )}

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 mb-6">
            <div className="flex items-center mb-6">
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-sage-500 to-spa-500 flex items-center justify-center mr-4">
                <Star className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-light text-stone-800">
                  {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
                </h2>
                <p className="text-sm text-stone-600">Fill in the details below</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    <User className="inline h-4 w-4 mr-1 text-sage-600" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-sage-500 focus:border-sage-500 transition-all"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    <Mail className="inline h-4 w-4 mr-1 text-sage-600" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-sage-500 focus:border-sage-500 transition-all"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    <Phone className="inline h-4 w-4 mr-1 text-sage-600" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-sage-500 focus:border-sage-500 transition-all"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    <Sparkles className="inline h-4 w-4 mr-1 text-sage-600" />
                    Specialization
                  </label>
                  <input
                    type="text"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-sage-500 focus:border-sage-500 transition-all"
                    placeholder="e.g., Senior Therapist, Massage Specialist"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  <Heart className="inline h-4 w-4 mr-1 text-sage-600" />
                  Professional Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-sage-500 focus:border-sage-500 transition-all"
                  placeholder="Brief description of experience and specialties..."
                />
              </div>

              <div className="flex items-center bg-spa-50 rounded-xl p-4">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="h-5 w-5 text-sage-600 rounded focus:ring-sage-500"
                />
                <label className="ml-3 text-sm font-medium text-stone-700">
                  Active Status
                  <span className="block text-xs text-stone-500 mt-1">
                    Active staff members can receive bookings
                  </span>
                </label>
              </div>

              <div className="bg-gradient-to-r from-sage-50 to-spa-50 rounded-xl p-6">
                <label className="block text-sm font-medium text-stone-700 mb-3">
                  <Flower2 className="inline h-4 w-4 mr-1 text-sage-600" />
                  Service Categories
                </label>
                <div className="border border-sage-200 rounded-xl p-4 max-h-40 overflow-y-auto bg-white/80">
                  {categories.length === 0 ? (
                    <p className="text-sm text-stone-500 text-center py-2">No categories available</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {categories.map(category => (
                        <label key={category.id} className="flex items-center hover:bg-sage-50 rounded-lg p-2 cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(category.id)}
                            onChange={() => handleCategoryToggle(category.id)}
                            className="h-4 w-4 text-sage-600 rounded focus:ring-sage-500"
                          />
                          <span className="ml-2 text-sm text-stone-700">{category.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {selectedCategories.length > 0 && (
                  <p className="text-xs text-sage-600 mt-2 font-medium">
                    ✓ {selectedCategories.length} {selectedCategories.length !== 1 ? 'categories' : 'category'} selected
                  </p>
                )}
              </div>

              {selectedCategories.length > 0 && (
                <div className="bg-gradient-to-r from-spa-50 to-sage-50 rounded-xl p-6">
                  <label className="block text-sm font-medium text-stone-700 mb-3">
                    Select Specific Services
                  </label>
                  <div className="border border-spa-200 rounded-xl p-4 max-h-64 overflow-y-auto bg-white/80">
                    {Object.entries(getServicesByCategory()).map(([categoryName, categoryServices]) => (
                      <div key={categoryName} className="mb-4 last:mb-0">
                        <h4 className="text-sm font-semibold text-sage-700 mb-2 flex items-center">
                          <span className="h-1.5 w-1.5 rounded-full bg-sage-500 mr-2"></span>
                          {categoryName}
                        </h4>
                        <div className="space-y-2 ml-4">
                          {categoryServices.length === 0 ? (
                            <p className="text-xs text-stone-500 italic">No services available</p>
                          ) : (
                            categoryServices.map(service => (
                              <label key={service.id} className="flex items-center hover:bg-spa-50 rounded-lg p-2 cursor-pointer transition-colors">
                                <input
                                  type="checkbox"
                                  checked={selectedServices.includes(service.id)}
                                  onChange={() => handleServiceToggle(service.id)}
                                  className="h-4 w-4 text-spa-600 rounded focus:ring-spa-500"
                                />
                                <span className="ml-2 text-sm text-stone-700">
                                  {service.name}
                                  <span className="text-xs text-stone-500 ml-2">
                                    ({service.duration} min • ${service.price})
                                  </span>
                                </span>
                              </label>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {selectedServices.length > 0 && (
                    <p className="text-xs text-spa-600 mt-2 font-medium">
                      ✓ {selectedServices.length} {selectedServices.length !== 1 ? 'services' : 'service'} selected
                    </p>
                  )}
                </div>
              )}

              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-sage-600 to-sage-700 text-white px-8 py-3 rounded-full hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{editingStaff ? 'Update' : 'Add'} Staff Member</span>
                </button>
                <button
                  type="button"
                  onClick={cancelForm}
                  className="bg-white border-2 border-stone-300 text-stone-700 px-8 py-3 rounded-full hover:bg-stone-50 transition-all duration-300 flex items-center space-x-2"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Staff List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sage-600"></div>
            <p className="mt-4 text-stone-600">Loading staff members...</p>
          </div>
        ) : (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
            {staff.length === 0 ? (
              <div className="p-16 text-center">
                <div className="h-20 w-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-sage-100 to-spa-100 flex items-center justify-center">
                  <Users className="h-10 w-10 text-sage-600" />
                </div>
                <h3 className="text-xl font-light text-stone-800 mb-2">No Staff Members Yet</h3>
                <p className="text-stone-600 mb-6">Start building your team of wellness professionals</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-gradient-to-r from-sage-600 to-sage-700 text-white px-6 py-2.5 rounded-full hover:shadow-lg hover:scale-105 transition-all duration-300"
                >
                  Add First Staff Member
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-sage-50 to-spa-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-stone-700 uppercase tracking-wider">
                        Staff Member
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-stone-700 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-stone-700 uppercase tracking-wider">
                        Specialization
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-stone-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-stone-700 uppercase tracking-wider">
                        Hire Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-stone-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-stone-100">
                    {staff.map((member) => (
                      <tr key={member.id} className="hover:bg-sage-50/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-sage-200 to-spa-200 flex items-center justify-center">
                              <User className="h-6 w-6 text-sage-700" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-stone-900">{member.name}</div>
                              {member.bio && (
                                <div className="text-xs text-stone-500 max-w-xs truncate">{member.bio}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-stone-600">
                            {member.email && (
                              <div className="flex items-center">
                                <Mail className="h-3 w-3 mr-1 text-sage-500" />
                                {member.email}
                              </div>
                            )}
                            {member.phone && (
                              <div className="flex items-center mt-1">
                                <Phone className="h-3 w-3 mr-1 text-sage-500" />
                                {member.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-stone-900 font-medium">{member.specialization || '-'}</div>
                          <div className="text-xs text-stone-600 mt-1">
                            {getStaffCategoryNames(member.id) || 'No categories'}
                          </div>
                          <div className="text-xs text-stone-500 mt-1">
                            {getStaffServiceCount(member.id) > 0 ? (
                              <Tooltip
                                content={
                                  <div>
                                    <div className="font-semibold mb-2 text-white">Assigned Services:</div>
                                    <div className="space-y-1">
                                      {getStaffServicesList(member.id).map((service, idx) => (
                                        <div key={idx} className="text-xs text-slate-200">
                                          • {service.name}
                                          <span className="text-slate-400 ml-1">
                                            ({service.duration}min - ${service.price})
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                }
                                position="top"
                                delay={100}
                              >
                                <span className="inline-flex items-center cursor-help text-spa-600 hover:text-spa-700 transition-colors">
                                  {getStaffServiceCount(member.id)} service{getStaffServiceCount(member.id) !== 1 ? 's' : ''}
                                  <Info className="h-3 w-3 ml-1" />
                                </span>
                              </Tooltip>
                            ) : (
                              <span className="text-stone-400">No services</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleStatus(member.id, member.is_active)}
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                              member.is_active
                                ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 hover:from-green-200 hover:to-emerald-200'
                                : 'bg-gradient-to-r from-rose-100 to-red-100 text-red-800 hover:from-rose-200 hover:to-red-200'
                            }`}
                          >
                            {member.is_active ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Inactive
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm text-stone-600">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1 text-sage-500" />
                            {new Date(member.hire_date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          <button
                            onClick={() => handleEdit(member)}
                            className="text-sage-600 hover:text-sage-800 mr-3 transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(member.id)}
                            className="text-rose-600 hover:text-rose-800 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminStaff