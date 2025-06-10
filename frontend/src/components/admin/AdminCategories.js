import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/admincategories.css';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creating, setCreating] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('Categories response:', data);
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    
    setCreating(true);
    try {
      const response = await fetch(`${API_BASE}/admin/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newCategoryName.trim() })
      });
      
      if (response.ok) {
        setNewCategoryName('');
        fetchCategories();
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to create category');
      }
    } catch (error) {
      console.error('Failed to create category:', error);
      alert('Failed to create category');
    } finally {
      setCreating(false);
    }
  };

  const deleteCategory = async (categoryName) => {
    if (!window.confirm(`Delete category "${categoryName}"? Products will be moved to "Uncategorized".`)) return;
    
    try {
      const response = await fetch(`${API_BASE}/admin/categories/${encodeURIComponent(categoryName)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        fetchCategories();
      } else {
        alert('Failed to delete category');
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Failed to delete category');
    }
  };

  if (loading) return <div className="container"><p>Loading categories...</p></div>;

  return (
    <div className="admin-categories">
      <div className="container">
        <h1>Categories Management</h1>
        
        <form onSubmit={createCategory} className="category-form">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="New category name"
            disabled={creating}
          />
          <button type="submit" disabled={creating || !newCategoryName.trim()}>
            {creating ? 'Creating...' : 'Add Category'}
          </button>
        </form>

        {categories.length === 0 ? (
          <p>No categories found. Create your first category above.</p>
        ) : (
          <div className="categories-grid">
            {categories.map(cat => (
              <div key={cat.name} className="category-card">
                <h3>{cat.name}</h3>
                <p>Products: {cat.product_count}</p>
                <p>Total Stock: {cat.total_stock}</p>
                <button 
                  className="delete-btn"
                  onClick={() => deleteCategory(cat.name)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCategories;