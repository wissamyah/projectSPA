import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, Edit2, Trash2, User, Mail, Phone, Calendar, CheckCircle, XCircle, Save, X, Info } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Tooltip from '../components/Tooltip'

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
        alert('Staff member updated successfully!')
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
        alert('Staff member added successfully!')
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
      alert('Error saving staff: ' + error.message)
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
    if (!confirm('Are you sure you want to delete this staff member?')) return

    try {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', id)

      if (error) throw error
      alert('Staff member deleted successfully!')
      fetchStaff()
    } catch (error: any) {
      alert('Error deleting staff: ' + error.message)
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
      alert('Error updating status: ' + error.message)
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
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link to="/admin" className="text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Staff Management</h1>
            <p className="text-slate-600">Manage your spa staff members</p>
          </div>
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-800 flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Add Staff</span>
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">
            {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <User className="inline h-4 w-4 mr-1" />
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <Mail className="inline h-4 w-4 mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <Phone className="inline h-4 w-4 mr-1" />
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Specialization
                </label>
                <input
                  type="text"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                  placeholder="e.g., Senior Therapist, Massage Specialist"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Bio
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                placeholder="Brief description of experience and specialties..."
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
                Active (can receive bookings)
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Service Categories This Staff Specializes In
              </label>
              <div className="border border-gray-200 rounded-lg p-3 max-h-32 overflow-y-auto">
                {categories.length === 0 ? (
                  <p className="text-sm text-slate-500">No categories available. Please add categories first.</p>
                ) : (
                  <div className="space-y-2">
                    {categories.map(category => (
                      <label key={category.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category.id)}
                          onChange={() => handleCategoryToggle(category.id)}
                          className="h-4 w-4 text-slate-700 rounded mr-2"
                        />
                        <span className="text-sm text-slate-700">{category.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {selectedCategories.length > 0 && (
                <p className="text-xs text-slate-600 mt-1">
                  {selectedCategories.length} categor{selectedCategories.length !== 1 ? 'ies' : 'y'} selected
                </p>
              )}
            </div>

            {selectedCategories.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select Specific Services from Selected Categories
                </label>
                <div className="border border-gray-200 rounded-lg p-3 max-h-64 overflow-y-auto">
                  {Object.entries(getServicesByCategory()).map(([categoryName, categoryServices]) => (
                    <div key={categoryName} className="mb-4">
                      <h4 className="text-sm font-semibold text-slate-700 mb-2">{categoryName}</h4>
                      <div className="space-y-1 ml-4">
                        {categoryServices.length === 0 ? (
                          <p className="text-xs text-slate-500">No services in this category</p>
                        ) : (
                          categoryServices.map(service => (
                            <label key={service.id} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={selectedServices.includes(service.id)}
                                onChange={() => handleServiceToggle(service.id)}
                                className="h-4 w-4 text-slate-700 rounded mr-2"
                              />
                              <span className="text-sm text-slate-700">
                                {service.name} ({service.duration} min - ${service.price})
                              </span>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {selectedServices.length > 0 && (
                  <p className="text-xs text-slate-600 mt-1">
                    {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
            )}

            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-slate-700 text-white px-6 py-2 rounded-lg hover:bg-slate-800 flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{editingStaff ? 'Update' : 'Add'} Staff</span>
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

      {/* Staff List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-slate-600">Loading staff...</div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {staff.length === 0 ? (
            <div className="p-12 text-center text-slate-600">
              <User className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>No staff members yet</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 text-slate-700 hover:text-slate-900 font-medium"
              >
                Add your first staff member
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Staff Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Specialization / Services
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Hire Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {staff.map((member) => (
                    <tr key={member.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                            <User className="h-5 w-5 text-slate-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-slate-900">{member.name}</div>
                            {member.bio && (
                              <div className="text-xs text-slate-500 max-w-xs truncate">{member.bio}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600">
                          {member.email && (
                            <div className="flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {member.email}
                            </div>
                          )}
                          {member.phone && (
                            <div className="flex items-center mt-1">
                              <Phone className="h-3 w-3 mr-1" />
                              {member.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900">{member.specialization || '-'}</div>
                        <div className="text-xs text-slate-600 mt-1">
                          Categories: {getStaffCategoryNames(member.id) || 'None'}
                        </div>
                        <div className="text-xs text-slate-500">
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
                              <span className="inline-flex items-center cursor-help border-b border-dotted border-slate-400 hover:border-slate-600 transition-colors">
                                {getStaffServiceCount(member.id)} service{getStaffServiceCount(member.id) !== 1 ? 's' : ''}
                                <Info className="h-3 w-3 ml-1" />
                              </span>
                            </Tooltip>
                          ) : (
                            <span>0 services</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleStatus(member.id, member.is_active)}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            member.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
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
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <Calendar className="inline h-3 w-3 mr-1" />
                        {new Date(member.hire_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <button
                          onClick={() => handleEdit(member)}
                          className="text-slate-600 hover:text-slate-900 mr-3"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(member.id)}
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
          )}
        </div>
      )}
    </div>
  )
}

export default AdminStaff