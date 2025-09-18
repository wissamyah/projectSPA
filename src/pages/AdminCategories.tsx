import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, Edit2, Trash2, Tag, Save, X, ArrowUp, ArrowDown, Sparkles, Flower2, Layers, Hash } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useModal } from '../contexts/ModalContext'

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
  const { showAlert, showConfirm } = useModal()

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
        await showAlert('Category updated successfully!', 'success')
      } else {
        // Set display_order to be last if not specified
        const orderToUse = formData.display_order || categories.length + 1
        const { error } = await supabase
          .from('service_categories')
          .insert([{ ...formData, display_order: orderToUse }])

        if (error) throw error
        await showAlert('Category added successfully!', 'success')
      }

      setFormData({ name: '', display_order: 0 })
      setShowAddForm(false)
      setEditingCategory(null)
      fetchCategories()
    } catch (error: any) {
      await showAlert('Error saving category: ' + error.message, 'error')
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
    if (!(await showConfirm('Are you sure? This will remove the category from all services. Services will become uncategorized.'))) return

    try {
      const { error } = await supabase
        .from('service_categories')
        .delete()
        .eq('id', id)

      if (error) throw error
      await showAlert('Category deleted successfully!', 'success')
      fetchCategories()
    } catch (error: any) {
      await showAlert('Error deleting category: ' + error.message, 'error')
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
      await showAlert('Error reordering categories: ' + error.message, 'error')
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
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-sage-50">
      {/* Hero Section */}
      <section className="relative pt-40 pb-20 bg-gradient-to-r from-sage-50 via-spa-50 to-rose-50">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-72 h-72 bg-spa-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
          <div className="absolute bottom-20 right-20 w-72 h-72 bg-sage-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
          <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-rose-100 rounded-full mix-blend-multiply filter blur-3xl opacity-15"></div>
        </div>

        <div className="relative container mx-auto px-4 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-gold-300 mb-6">
            <Layers className="h-4 w-4 text-gold-500 mr-2" />
            <span className="text-sm font-medium text-stone-700">Service Organization</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-light text-stone-800 mb-6">
            Treatment
            <span className="block text-4xl md:text-5xl font-normal text-transparent bg-clip-text bg-gradient-to-r from-sage-600 to-spa-600 mt-2">
              Categories
            </span>
          </h1>

          <p className="text-xl text-stone-600 max-w-3xl mx-auto leading-relaxed">
            Organize your wellness services into beautiful, intuitive categories
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Action Bar */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link to="/admin" className="text-stone-600 hover:text-sage-700 transition-colors">
              <ArrowLeft className="h-6 w-6" />
            </Link>
          </div>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-sage-600 to-sage-700 text-white px-6 py-2.5 rounded-full hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span className="font-light">Add Category</span>
            </button>
          )}
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 mb-6">
            <div className="flex items-center mb-6">
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-spa-500 to-sage-500 flex items-center justify-center mr-4">
                <Flower2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-light text-stone-800">
                  {editingCategory ? 'Edit Category' : 'Create New Category'}
                </h2>
                <p className="text-sm text-stone-600">Organize your services effectively</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    <Tag className="inline h-4 w-4 mr-1 text-sage-600" />
                    Category Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-sage-500 focus:border-sage-500 transition-all"
                    placeholder="e.g., Massage Therapy, Facial Treatments"
                  />
                  <p className="mt-1 text-xs text-stone-500">Choose a clear, descriptive name</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    <Hash className="inline h-4 w-4 mr-1 text-sage-600" />
                    Display Order
                  </label>
                  <input
                    type="number"
                    name="display_order"
                    value={formData.display_order}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-sage-500 focus:border-sage-500 transition-all"
                    placeholder="Leave empty for automatic ordering"
                  />
                  <p className="mt-1 text-xs text-stone-500">Lower numbers appear first</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-spa-50 to-sage-50 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <Sparkles className="h-5 w-5 text-spa-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-stone-700">Pro Tip</p>
                    <p className="text-xs text-stone-600 mt-1">
                      Categories help customers find services quickly. Group similar treatments together for better navigation.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 pt-2">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-sage-600 to-sage-700 text-white px-8 py-3 rounded-full hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{editingCategory ? 'Update' : 'Create'} Category</span>
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

        {/* Categories List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sage-600"></div>
            <p className="mt-4 text-stone-600">Loading categories...</p>
          </div>
        ) : (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
            {categories.length === 0 ? (
              <div className="p-16 text-center">
                <div className="h-20 w-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-spa-100 to-sage-100 flex items-center justify-center">
                  <Layers className="h-10 w-10 text-sage-600" />
                </div>
                <h3 className="text-xl font-light text-stone-800 mb-2">No Categories Yet</h3>
                <p className="text-stone-600 mb-6">Start organizing your services into categories</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-gradient-to-r from-sage-600 to-sage-700 text-white px-6 py-2.5 rounded-full hover:shadow-lg hover:scale-105 transition-all duration-300"
                >
                  Create First Category
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-sage-50 to-spa-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-stone-700 uppercase tracking-wider">
                        Display Order
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-stone-700 uppercase tracking-wider">
                        Category Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-stone-700 uppercase tracking-wider">
                        Active Services
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-stone-700 uppercase tracking-wider">
                        Created Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-stone-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-stone-100">
                    {categories.map((category, index) => (
                      <tr key={category.id} className="hover:bg-sage-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <div className="flex flex-col">
                              <button
                                onClick={() => moveCategory(category, 'up')}
                                disabled={index === 0}
                                className={`p-1 rounded-lg transition-all ${
                                  index === 0
                                    ? 'text-stone-300 cursor-not-allowed'
                                    : 'text-sage-600 hover:text-sage-800 hover:bg-sage-100'
                                }`}
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => moveCategory(category, 'down')}
                                disabled={index === categories.length - 1}
                                className={`p-1 rounded-lg transition-all ${
                                  index === categories.length - 1
                                    ? 'text-stone-300 cursor-not-allowed'
                                    : 'text-sage-600 hover:text-sage-800 hover:bg-sage-100'
                                }`}
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-sage-100 to-spa-100 text-sage-800">
                              #{category.display_order}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-spa-200 to-sage-200 flex items-center justify-center mr-3">
                              <Tag className="h-5 w-5 text-sage-700" />
                            </div>
                            <span className="text-sm font-medium text-stone-900">{category.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              serviceCounts[category.id] > 0
                                ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800'
                                : 'bg-gradient-to-r from-stone-100 to-gray-100 text-stone-600'
                            }`}>
                              {serviceCounts[category.id] || 0} {serviceCounts[category.id] === 1 ? 'service' : 'services'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-stone-600">
                          {new Date(category.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          <button
                            onClick={() => handleEdit(category)}
                            className="text-sage-600 hover:text-sage-800 mr-3 transition-colors"
                            title="Edit Category"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(category.id)}
                            className="text-rose-600 hover:text-rose-800 transition-colors"
                            title="Delete Category"
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

        {/* Summary Stats */}
        {categories.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-md border border-white/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-600">Total Categories</p>
                  <p className="text-2xl font-light text-transparent bg-clip-text bg-gradient-to-r from-sage-600 to-spa-600">
                    {categories.length}
                  </p>
                </div>
                <Layers className="h-8 w-8 text-sage-400" />
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-md border border-white/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-600">Total Services</p>
                  <p className="text-2xl font-light text-transparent bg-clip-text bg-gradient-to-r from-spa-600 to-sage-600">
                    {Object.values(serviceCounts).reduce((a, b) => a + b, 0)}
                  </p>
                </div>
                <Sparkles className="h-8 w-8 text-spa-400" />
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-md border border-white/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-600">Avg per Category</p>
                  <p className="text-2xl font-light text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-gold-500">
                    {categories.length > 0
                      ? (Object.values(serviceCounts).reduce((a, b) => a + b, 0) / categories.length).toFixed(1)
                      : '0'}
                  </p>
                </div>
                <Flower2 className="h-8 w-8 text-gold-400" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminCategories