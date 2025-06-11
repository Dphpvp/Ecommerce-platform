import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/admincategories.css';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
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
        if (selectedCategory === categoryName) {
          setSelectedCategory(null);
          setCategoryProducts([]);
        }
      } else {
        alert('Failed to delete category');
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Failed to delete category');
    }
  };

  const viewCategoryProducts = async (categoryName) => {
    if (selectedCategory === categoryName) {
      setSelectedCategory(null);
      setCategoryProducts([]);
      return;
    }
    
    setLoadingProducts(true);
    try {
      const response = await fetch(`${API_BASE}/products?category=${encodeURIComponent(categoryName)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const products = await response.json();
      setCategoryProducts(products);
      setSelectedCategory(categoryName);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      alert('Failed to load products');
    } finally {
      setLoadingProducts(false);
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
          <>
            <div className="categories-grid">
              {categories.map(cat => (
                <div key={cat.name} className="category-card">
                  <h3>{cat.name}</h3>
                  <p>Products: {cat.product_count}</p>
                  <p>Total Stock: {cat.total_stock}</p>
                  <div className="category-actions">
                    <button 
                      className="view-btn"
                      onClick={() => viewCategoryProducts(cat.name)}
                      disabled={loadingProducts}
                    >
                      {selectedCategory === cat.name ? 'Hide Products' : 'View Category'}
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => deleteCategory(cat.name)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {selectedCategory && (
              <div className="products-section">
                <h2>Products in "{selectedCategory}" Category</h2>
                {loadingProducts ? (
                  <p>Loading products...</p>
                ) : categoryProducts.length === 0 ? (
                  <p>No products found in this category.</p>
                ) : (
                  <div className="products-grid">
                    {categoryProducts.map(product => (
                      <div key={product._id} className="product-card">
                        <img src={product.image_url} alt={product.name} />
                        <h4>{product.name}</h4>
                        <p className="price">${product.price}</p>
                        <p className="stock">Stock: {product.stock}</p>
                        <p className="description">{product.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminCategories;