import React, { useState, useEffect, useRef } from 'react';
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
  const [editingProduct, setEditingProduct] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const { token } = useAuth();
  const productsRef = useRef(null);

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
      
      // Scroll to products section after a short delay
      setTimeout(() => {
        productsRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      alert('Failed to load products');
    } finally {
      setLoadingProducts(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startEditProduct = (product) => {
    setEditingProduct(product._id);
    setEditFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      image_url: product.image_url
    });
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setEditFormData({});
  };

  const saveProduct = async (productId) => {
    try {
      const response = await fetch(`${API_BASE}/admin/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editFormData)
      });

      if (response.ok) {
        // Refresh the products in the current category
        viewCategoryProducts(selectedCategory);
        fetchCategories(); // Refresh category counts
        setEditingProduct(null);
        setEditFormData({});
      } else {
        alert('Failed to update product');
      }
    } catch (error) {
      console.error('Failed to update product:', error);
      alert('Failed to update product');
    }
  };

  const deleteProduct = async (productId, productName) => {
    if (!window.confirm(`Delete product "${productName}"?`)) return;

    try {
      const response = await fetch(`${API_BASE}/admin/products/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        // Refresh the products in the current category
        viewCategoryProducts(selectedCategory);
        fetchCategories(); // Refresh category counts
      } else {
        alert('Failed to delete product');
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Failed to delete product');
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
              <div className="products-section" ref={productsRef}>
                <h2>Products in "{selectedCategory}" Category</h2>
                {loadingProducts ? (
                  <p>Loading products...</p>
                ) : categoryProducts.length === 0 ? (
                  <p>No products found in this category.</p>
                ) : (
                  <div className="products-grid">
                    {categoryProducts.map(product => (
                      <div key={product._id} className="product-card">
                        {editingProduct === product._id ? (
                          <div className="edit-form">
                            <input
                              type="text"
                              value={editFormData.name}
                              onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                              placeholder="Product name"
                            />
                            <textarea
                              value={editFormData.description}
                              onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                              placeholder="Description"
                              rows="3"
                            />
                            <input
                              type="number"
                              step="0.01"
                              value={editFormData.price}
                              onChange={(e) => setEditFormData({...editFormData, price: parseFloat(e.target.value)})}
                              placeholder="Price"
                            />
                            <input
                              type="number"
                              value={editFormData.stock}
                              onChange={(e) => setEditFormData({...editFormData, stock: parseInt(e.target.value)})}
                              placeholder="Stock"
                            />
                            <input
                              type="url"
                              value={editFormData.image_url}
                              onChange={(e) => setEditFormData({...editFormData, image_url: e.target.value})}
                              placeholder="Image URL"
                            />
                            <div className="edit-actions">
                              <button 
                                className="save-btn"
                                onClick={() => saveProduct(product._id)}
                              >
                                Save
                              </button>
                              <button 
                                className="cancel-btn"
                                onClick={cancelEdit}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <img src={product.image_url} alt={product.name} />
                            <h4>{product.name}</h4>
                            <p className="price">${product.price}</p>
                            <p className="stock">Stock: {product.stock}</p>
                            <p className="description">{product.description}</p>
                            <div className="product-actions">
                              <button 
                                className="edit-btn"
                                onClick={() => startEditProduct(product)}
                              >
                                Edit
                              </button>
                              <button 
                                className="delete-product-btn"
                                onClick={() => deleteProduct(product._id, product.name)}
                              >
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Scroll to top button */}
                <div className="scroll-controls">
                  <button className="scroll-to-top" onClick={scrollToTop}>
                    ↑ Back to Top
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminCategories;