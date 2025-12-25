import { useEffect, useState } from 'react'

export default function CategoriesTab({ error, setError }) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'fa-tags',
    parent_id: ''
  })
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    icon: 'fa-tags',
    parent_id: ''
  })

  useEffect(() => {
    async function fetchCategories(){
      try {
        setLoading(true)
        setError('')
        const response = await fetch('/api/v1/categories')
        const data = await response.json()
        if (data.data && data.data.categories && Array.isArray(data.data.categories)) {
          setCategories(data.data.categories)
        } else {
          setError('Failed to load categories')
        }
      } catch (err) {
        setError('Error loading categories: ' + (err.message || 'Unknown error'))
      } finally {
        setLoading(false)
      }
    }
    
    fetchCategories()
  }, [setError])

  function formatDate(dateString) {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  function getParentName(parentId) {
    if (!parentId) return 'None'
    const parent = categories.find(c => c.category_id === parentId)
    return parent ? parent.name : 'Unknown'
  }

  // Build hierarchical path for a category (e.g., "Parent > Subcategory")
  function getCategoryPath(category) {
    if (!category.parent_id) {
      return category.name
    }
    const parent = categories.find(c => c.category_id === category.parent_id)
    if (parent) {
      return `${getCategoryPath(parent)} > ${category.name}`
    }
    return category.name
  }

  // Get all descendant IDs of a category (to prevent circular references)
  function getDescendantIds(categoryId) {
    const descendants = []
    // Ensure type consistency for comparison
    const id = typeof categoryId === 'string' ? parseInt(categoryId, 10) : categoryId
    const children = categories.filter(c => {
      const parentId = c.parent_id ? (typeof c.parent_id === 'string' ? parseInt(c.parent_id, 10) : c.parent_id) : null
      return parentId === id
    })
    for (const child of children) {
      descendants.push(child.category_id)
      descendants.push(...getDescendantIds(child.category_id))
    }
    return descendants
  }

  function resetForm() {
    setFormData({
      name: '',
      description: '',
      icon: 'fa-tags',
      parent_id: ''
    })
    setShowAddForm(false)
    setEditingId(null)
  }

  function startEdit(category) {
    setEditFormData({
      name: category.name || '',
      description: category.description || '',
      icon: category.icon || 'fa-tags',
      parent_id: category.parent_id ? String(category.parent_id) : ''
    })
    setEditingId(category.category_id)
    setShowEditModal(true)
  }

  function closeEditModal() {
    setShowEditModal(false)
    setEditingId(null)
    setEditFormData({
      name: '',
      description: '',
      icon: 'fa-tags',
      parent_id: ''
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      setUpdating({ submitting: true })
      setError('')
      
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        icon: formData.icon.trim() || 'fa-tags',
        parent_id: formData.parent_id ? parseInt(formData.parent_id, 10) : null
      }

      if (!payload.name) {
        setError('Category name is required')
        setUpdating({ submitting: false })
        return
      }

      // Create new category
      const response = await fetch('/api/v1/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      if (data.data) {
        // Refresh categories list
        const refreshResponse = await fetch('/api/v1/categories')
        const refreshData = await refreshResponse.json()
        if (refreshData.data && refreshData.data.categories) {
          setCategories(refreshData.data.categories)
        }
        resetForm()
        setError('')
      } else if (data.status === 'error') {
        setError(data.message || 'Failed to save category')
      } else {
        setError('Failed to save category: Unexpected response format')
      }
    } catch (err) {
      console.error('Error saving category:', err)
      setError('Error saving category: ' + (err.message || 'Unknown error'))
    } finally {
      setUpdating({ submitting: false })
    }
  }

  async function handleEditSubmit(e) {
    e.preventDefault()
    try {
      setUpdating({ editing: true })
      setError('')
      
      const payload = {
        name: editFormData.name.trim(),
        description: editFormData.description.trim() || null,
        icon: editFormData.icon.trim() || 'fa-tags',
        parent_id: editFormData.parent_id ? parseInt(editFormData.parent_id, 10) : null
      }

      if (!payload.name) {
        setError('Category name is required')
        setUpdating({ editing: false })
        return
      }

      // Update existing category
      const response = await fetch(`/api/v1/admin/categories/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      if (data.data) {
        // Refresh categories list immediately
        const refreshResponse = await fetch('/api/v1/categories')
        const refreshData = await refreshResponse.json()
        if (refreshData.data && refreshData.data.categories) {
          setCategories(refreshData.data.categories)
        }
        closeEditModal()
        setError('')
      } else if (data.status === 'error') {
        setError(data.message || 'Failed to update category')
      } else {
        setError('Failed to update category: Unexpected response format')
      }
    } catch (err) {
      console.error('Error updating category:', err)
      setError('Error updating category: ' + (err.message || 'Unknown error'))
    } finally {
      setUpdating({ editing: false })
    }
  }

  async function handleDelete(categoryId) {
    if (!window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return
    }

    try {
      setUpdating(prev => ({ ...prev, [categoryId]: true }))
      setError('')
      
      const response = await fetch(`/api/v1/admin/categories/${categoryId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }
      
      // Refresh categories list
      const refreshResponse = await fetch('/api/v1/categories')
      const refreshData = await refreshResponse.json()
      if (refreshData.data && refreshData.data.categories) {
        setCategories(refreshData.data.categories)
      }
      setError('')
    } catch (err) {
      console.error('Error deleting category:', err)
      setError('Error deleting category: ' + (err.message || 'Unknown error'))
    } finally {
      setUpdating(prev => ({ ...prev, [categoryId]: false }))
    }
  }

  // Get available parent categories (all categories except the one being edited and its descendants)
  const getAvailableParents = (currentEditingId = null) => {
    if (!currentEditingId) {
      // When creating new category, all categories are available
      return categories
    }
    // When editing, exclude the category itself and all its descendants to prevent circular references
    // Ensure type consistency - convert to number for comparison
    const editingIdNum = typeof currentEditingId === 'string' ? parseInt(currentEditingId, 10) : currentEditingId
    const descendantIds = getDescendantIds(editingIdNum)
    const excludedIds = new Set([editingIdNum, ...descendantIds])
    return categories.filter(c => {
      const catId = typeof c.category_id === 'string' ? parseInt(c.category_id, 10) : c.category_id
      return !excludedIds.has(catId)
    })
  }
  
  const availableParents = getAvailableParents(editingId)

  return (
    <div style={{background: '#fff', borderRadius: '8px', border: '1px solid rgba(1,47,52,.2)', overflow: 'hidden'}}>
      <div style={{padding: '20px', borderBottom: '1px solid rgba(1,47,52,.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <h2 style={{fontSize: '20px', fontWeight: '500', margin: 0}}>All Categories ({categories.length})</h2>
        <button
          onClick={() => {
            resetForm()
            setShowAddForm(true)
          }}
          style={{
            padding: '8px 16px',
            background: '#3a77ff',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <i className="fa-solid fa-plus"></i>
          Add Category
        </button>
      </div>
      
      {error && (
        <div style={{padding: '20px', color: '#b00020', background: '#ffebee'}}>
          {error}
        </div>
      )}

      {showAddForm && !showEditModal && (
        <div style={{padding: '20px', borderBottom: '1px solid rgba(1,47,52,.1)', background: '#f5f8fa'}}>
          <h3 style={{fontSize: '16px', fontWeight: '600', marginBottom: '16px'}}>
            Add New Category
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px'}}>
              <div>
                <label style={{display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#012f34'}}>
                  Category Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid rgba(1,47,52,.2)',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="e.g., Mobile Phones"
                />
              </div>
              <div>
                <label style={{display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#012f34'}}>
                  Icon (Font Awesome class)
                </label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({...formData, icon: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid rgba(1,47,52,.2)',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="fa-tags"
                />
              </div>
            </div>
            <div style={{marginBottom: '16px'}}>
              <label style={{display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#012f34'}}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows="3"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid rgba(1,47,52,.2)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
                placeholder="Category description (optional)"
              />
            </div>
            <div style={{marginBottom: '16px'}}>
              <label style={{display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#012f34'}}>
                Parent Category
              </label>
              <select
                value={formData.parent_id}
                onChange={(e) => setFormData({...formData, parent_id: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid rgba(1,47,52,.2)',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="">None (Top-level category)</option>
                {availableParents.map(cat => (
                  <option key={cat.category_id} value={cat.category_id}>
                    {getCategoryPath(cat)}
                  </option>
                ))}
              </select>
            </div>
            <div style={{display: 'flex', gap: '12px'}}>
              <button
                type="submit"
                disabled={updating.submitting}
                style={{
                  padding: '10px 20px',
                  background: '#3a77ff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: updating.submitting ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  opacity: updating.submitting ? 0.6 : 1
                }}
              >
                {updating.submitting ? 'Saving...' : 'Create'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                disabled={updating.submitting}
                style={{
                  padding: '10px 20px',
                  background: '#fff',
                  color: '#012f34',
                  border: '1px solid rgba(1,47,52,.2)',
                  borderRadius: '6px',
                  cursor: updating.submitting ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {showEditModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={closeEditModal}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '8px',
              padding: '24px',
              width: '100%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h3 style={{fontSize: '18px', fontWeight: '600', margin: 0}}>Edit Category</h3>
              <button
                onClick={closeEditModal}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#666',
                  padding: '0',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px'}}>
                <div>
                  <label style={{display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#012f34'}}>
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid rgba(1,47,52,.2)',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    placeholder="e.g., Mobile Phones"
                  />
                </div>
                <div>
                  <label style={{display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#012f34'}}>
                    Icon (Font Awesome class)
                  </label>
                  <input
                    type="text"
                    value={editFormData.icon}
                    onChange={(e) => setEditFormData({...editFormData, icon: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid rgba(1,47,52,.2)',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    placeholder="fa-tags"
                  />
                </div>
              </div>
              <div style={{marginBottom: '16px'}}>
                <label style={{display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#012f34'}}>
                  Description
                </label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid rgba(1,47,52,.2)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                  placeholder="Category description (optional)"
                />
              </div>
              <div style={{marginBottom: '16px'}}>
                <label style={{display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#012f34'}}>
                  Parent Category
                </label>
                <select
                  value={editFormData.parent_id}
                  onChange={(e) => setEditFormData({...editFormData, parent_id: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid rgba(1,47,52,.2)',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">None (Top-level category)</option>
                  {getAvailableParents(editingId).map(cat => (
                    <option key={cat.category_id} value={cat.category_id}>
                      {getCategoryPath(cat)}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end'}}>
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={updating.editing}
                  style={{
                    padding: '10px 20px',
                    background: '#fff',
                    color: '#012f34',
                    border: '1px solid rgba(1,47,52,.2)',
                    borderRadius: '6px',
                    cursor: updating.editing ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating.editing}
                  style={{
                    padding: '10px 20px',
                    background: '#3a77ff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: updating.editing ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    opacity: updating.editing ? 0.6 : 1
                  }}
                >
                  {updating.editing ? 'Updating...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {loading && (
        <div style={{padding: '40px', textAlign: 'center', color: '#666'}}>
          Loading categories...
        </div>
      )}
      
      {!loading && !error && (
        <div style={{overflowX: 'auto'}}>
          <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead>
              <tr style={{background: '#f5f5f5'}}>
                <th style={{padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '14px', color: '#012f34', borderBottom: '1px solid rgba(1,47,52,.1)'}}>ID</th>
                <th style={{padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '14px', color: '#012f34', borderBottom: '1px solid rgba(1,47,52,.1)'}}>Name</th>
                <th style={{padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '14px', color: '#012f34', borderBottom: '1px solid rgba(1,47,52,.1)'}}>Icon</th>
                <th style={{padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '14px', color: '#012f34', borderBottom: '1px solid rgba(1,47,52,.1)'}}>Parent</th>
                <th style={{padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '14px', color: '#012f34', borderBottom: '1px solid rgba(1,47,52,.1)'}}>Description</th>
                <th style={{padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '14px', color: '#012f34', borderBottom: '1px solid rgba(1,47,52,.1)'}}>Created At</th>
                <th style={{padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '14px', color: '#012f34', borderBottom: '1px solid rgba(1,47,52,.1)'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{padding: '40px', textAlign: 'center', color: '#666'}}>
                    No categories found
                  </td>
                </tr>
              ) : (
                categories.map((category) => {
                  const isUpdating = updating[category.category_id]
                  return (
                    <tr key={category.category_id} style={{borderBottom: '1px solid rgba(1,47,52,.05)'}}>
                      <td style={{padding: '12px 16px', fontSize: '14px', color: '#012f34'}}>{category.category_id}</td>
                      <td style={{padding: '12px 16px', fontSize: '14px', color: '#012f34', fontWeight: '500'}}>{category.name || 'N/A'}</td>
                      <td style={{padding: '12px 16px', fontSize: '14px', color: '#012f34'}}>
                        <i className={`fa-solid ${category.icon || 'fa-tags'}`} style={{fontSize: '16px'}}></i>
                        <span style={{marginLeft: '8px', fontSize: '12px', color: '#666'}}>{category.icon || 'fa-tags'}</span>
                      </td>
                      <td style={{padding: '12px 16px', fontSize: '14px', color: '#012f34'}}>{getParentName(category.parent_id)}</td>
                      <td style={{padding: '12px 16px', fontSize: '14px', color: '#666', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                        {category.description || 'N/A'}
                      </td>
                      <td style={{padding: '12px 16px', fontSize: '14px', color: '#666'}}>{formatDate(category.created_at)}</td>
                      <td style={{padding: '12px 16px', fontSize: '14px'}}>
                        <div style={{display: 'flex', gap: '8px'}}>
                          <button
                            onClick={() => startEdit(category)}
                            disabled={isUpdating}
                            style={{
                              padding: '6px 12px',
                              background: '#3a77ff',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: isUpdating ? 'not-allowed' : 'pointer',
                              fontSize: '12px',
                              fontWeight: '500',
                              opacity: isUpdating ? 0.6 : 1
                            }}
                          >
                            <i className="fa-solid fa-edit"></i> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(category.category_id)}
                            disabled={isUpdating}
                            style={{
                              padding: '6px 12px',
                              background: '#b00020',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: isUpdating ? 'not-allowed' : 'pointer',
                              fontSize: '12px',
                              fontWeight: '500',
                              opacity: isUpdating ? 0.6 : 1
                            }}
                          >
                            <i className="fa-solid fa-trash"></i> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

