import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, Edit2, Trash2, Tag, Save, X, ArrowUp, ArrowDown } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Category {
  id: string
  name: string
  display_order: number
  created_at: string
}

const AdminCategories = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    display_order: 0
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'display_order' ? parseInt(value) || 0 : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('service_categories')
          .update(formData)
          .eq('id', editingCategory.id)

        if (error) throw error
        alert('Category updated successfully!')
      } else {
        // Set display_order to be last if not specified
        const orderToUse = formData.display_order || categories.length + 1
        const { error } = await supabase
          .from('service_categories')
          .insert([{ ...formData, display_order: orderToUse }])

        if (error) throw error
        alert('Category added successfully!')
      }

      setFormData({ name: '', display_order: 0 })
      setShowAddForm(false)
      setEditingCategory(null)
      fetchCategories()
    } catch (error: any) {
      alert('Error saving category: ' + error.message)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      display_order: category.display_order
    })
    setShowAddForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This will remove the category from all services. Services will become uncategorized.')) return

    try {
      const { error } = await supabase
        .from('service_categories')
        .delete()
        .eq('id', id)

      if (error) throw error
      alert('Category deleted successfully!')
      fetchCategories()
    } catch (error: any) {
      alert('Error deleting category: ' + error.message)
    }
  }

  const moveCategory = async (category: Category, direction: 'up' | 'down') => {
    const currentIndex = categories.findIndex(c => c.id === category.id)
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    
    if (newIndex < 0 || newIndex >= categories.length) return

    const targetCategory = categories[newIndex]
    
    try {
      // Swap display_order values
      await supabase
        .from('service_categories')
        .update({ display_order: targetCategory.display_order })
        .eq('id', category.id)
      
      await supabase
        .from('service_categories')
        .update({ display_order: category.display_order })
        .eq('id', targetCategory.id)
      
      fetchCategories()
    } catch (error: any) {
      alert('Error reordering categories: ' + error.message)
    }
  }

  const cancelForm = () => {
    setShowAddForm(false)
    setEditingCategory(null)
    setFormData({ name: '', display_order: 0 })
  }

  // Count services in each category
  const [serviceCounts, setServiceCounts] = useState<{ [key: string]: number }>({})
  
  useEffect(() => {
    const fetchServiceCounts = async () => {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('category_id')
          .eq('is_active', true)

        if (!error && data) {
          const counts: { [key: string]: number } = {}
          data.forEach(service => {
            if (service.category_id) {
              counts[service.category_id] = (counts[service.category_id] || 0) + 1
            }
          })
          setServiceCounts(counts)
        }
      } catch (error) {
        console.error('Error fetching service counts:', error)
      }
    }

    if (categories.length > 0) {
      fetchServiceCounts()
    }
  }, [categories])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link to="/admin" className="text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Category Management</h1>
            <p className="text-slate-600">Manage service categories and their display order</p>
          </div>
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-800 flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Add Category</span>
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">
            {editingCategory ? 'Edit Category' : 'Add New Category'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <Tag className="inline h-4 w-4 mr-1" />
                  Category Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                  placeholder="e.g., Massage Therapy"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  name="display_order"
                  value={formData.display_order}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                  placeholder="Leave empty for automatic ordering"
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-slate-700 text-white px-6 py-2 rounded-lg hover:bg-slate-800 flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{editingCategory ? 'Update' : 'Add'} Category</span>
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
          <div className="text-slate-600">Loading categories...</div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {categories.length === 0 ? (
            <div className="p-12 text-center text-slate-600">
              <Tag className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>No categories yet</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 text-slate-700 hover:text-slate-900 font-medium"
              >
                Add your first category
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Category Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Services Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categories.map((category, index) => (
                    <tr key={category.id}>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => moveCategory(category, 'up')}
                            disabled={index === 0}
                            className={`p-1 rounded ${
                              index === 0 
                                ? 'text-gray-300 cursor-not-allowed' 
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => moveCategory(category, 'down')}
                            disabled={index === categories.length - 1}
                            className={`p-1 rounded ${
                              index === categories.length - 1 
                                ? 'text-gray-300 cursor-not-allowed' 
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </button>
                          <span className="text-sm text-slate-600">#{category.display_order}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Tag className="h-4 w-4 text-slate-400 mr-2" />
                          <span className="text-sm font-medium text-slate-900">{category.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">
                          {serviceCounts[category.id] || 0} services
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(category.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <button
                          onClick={() => handleEdit(category)}
                          className="text-slate-600 hover:text-slate-900 mr-3"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
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

export default AdminCategories