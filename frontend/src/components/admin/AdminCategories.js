import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import 'styles/pages/admin.css';

const API_BASE = process.env.REACT_APP_API_BASE_URL;

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [parentCategory, setParentCategory] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const { makeAuthenticatedRequest } = useAuth();
  const productsRef = useRef(null);

  useEffect(() => {
    fetchCategories();
    fetchDebugInfo();
  }, []);

  const fetchDebugInfo = async () => {
    try {
      const data = await makeAuthenticatedRequest(`${API_BASE}/admin/debug`);
      setDebugInfo(data);
      console.log('Debug info:', data);
    } catch (error) {
      console.error('Failed to fetch debug info:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await makeAuthenticatedRequest(`${API_BASE}/admin/categories`);
      console.log('Categories response:', data);
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setError(error.message);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    
    setCreating(true);
    try {
      const result = await makeAuthenticatedRequest(`${API_BASE}/admin/categories`, {
        method: 'POST',
        body: JSON.stringify({ 
          name: newCategoryName.trim(),
          parent: parentCategory 
        })
      });
      
      console.log('Category created:', result);
      setNewCategoryName('');
      setParentCategory('');
      fetchCategories();
      fetchDebugInfo();
    } catch (error) {
      console.error('Failed to create category:', error);
      alert(error.message || 'Failed to create category');
    } finally {
      setCreating(false);
    }
  };

  const deleteCategory = async (categoryName) => {
    const subcategoryCount = categories.filter(cat => 
      cat.name.startsWith(categoryName + '/') || cat.name === categoryName
    ).length;
    
    const hasProducts = categories.find(cat => cat.name === categoryName)?.product_count > 0;
    
    let message = subcategoryCount > 1 
      ? `Delete "${categoryName}" and ${subcategoryCount - 1} subcategories?`
      : `Delete category "${categoryName}"?`;
    
    if (hasProducts) {
      message += '\n\nProducts will be moved to "Uncategorized" category.';
    }
    
    if (!window.confirm(message)) return;
    
    try {
      const encodedName = encodeURIComponent(categoryName);
      const result = await makeAuthenticatedRequest(`${API_BASE}/admin/categories/${encodedName}`, {
        method: 'DELETE'
      });
      
      alert(result.message);
      fetchCategories();
      fetchDebugInfo();
      if (selectedCategory === categoryName) {
        setSelectedCategory(null);
        setCategoryProducts([]);
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert(error.message || 'Failed to delete category');
    }
  };

  // Get hierarchical structure for display
  const getHierarchicalCategories = () => {
    const tree = {};
    
    categories.forEach(cat => {
      const parts = cat.name.split('/');
      let current = tree;
      
      parts.forEach((part, index) => {
        const fullPath = parts.slice(0, index + 1).join('/');
        if (!current[part]) {
          current[part] = {
            name: fullPath,
            children: {},
            data: categories.find(c => c.name === fullPath) || { 
              name: fullPath, 
              product_count: 0, 
              total_stock: 0, 
              level: index 
            }
          };
        }
        current = current[part].children;
      });
    });
    
    return tree;
  };

  const toggleExpanded = (categoryName) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  const renderCategoryTree = (tree, level = 0) => {
    return Object.entries(tree).map(([key, value]) => {
      const hasChildren = Object.keys(value.children).length > 0;
      const isExpanded = expandedCategories.has(value.name);
      const indentStyle = { marginLeft: `${level * 20}px` };
      
      return (
        <div key={value.name} className="category-tree-item">
          <div className="category-card" style={indentStyle}>
            <div className="category-header">
              {hasChildren && (
                <button 
                  className="expand-toggle"
                  onClick={() => toggleExpanded(value.name)}
                >
                  {isExpanded ? '▼' : '▶'}
                </button>
              )}
              <div className="category-info">
                <h3>{key}</h3>
                <div className="category-stats">
                  <span>Products: {value.data.product_count}</span>
                  <span>Stock: {value.data.total_stock}</span>
                </div>
              </div>
            </div>
            <div className="category-actions">
              <button 
                className="view-btn"
                onClick={() => viewCategoryProducts(value.name)}
                disabled={loadingProducts}
              >
                {selectedCategory === value.name ? 'Hide Products' : 'View'}
              </button>
              <button 
                className="add-sub-btn"
                onClick={() => setParentCategory(value.name)}
              >
                Add Sub
              </button>
              <button 
                className="delete-btn"
                onClick={() => deleteCategory(value.name)}
              >
                Delete
              </button>
            </div>
          </div>
          {hasChildren && isExpanded && (
            <div className="subcategories">
              {renderCategoryTree(value.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const viewCategoryProducts = async (categoryName) => {
    if (selectedCategory === categoryName) {
      setSelectedCategory(null);
      setCategoryProducts([]);
      return;
    }
    
    setLoadingProducts(true);
    try {
      const products = await makeAuthenticatedRequest(`${API_BASE}/products?category=${encodeURIComponent(categoryName)}`);
      setCategoryProducts(products);
      setSelectedCategory(categoryName);
      
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
      await makeAuthenticatedRequest(`${API_BASE}/admin/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify(editFormData)
      });

      viewCategoryProducts(selectedCategory);
      fetchCategories();
      setEditingProduct(null);
      setEditFormData({});
    } catch (error) {
      console.error('Failed to update product:', error);
      alert('Failed to update product');
    }
  };

  const deleteProduct = async (productId, productName) => {
    if (!window.confirm(`Delete product "${productName}"?`)) return;

    try {
      await makeAuthenticatedRequest(`${API_BASE}/admin/products/${productId}`, {
        method: 'DELETE'
      });

      viewCategoryProducts(selectedCategory);
      fetchCategories();
      fetchDebugInfo();
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Failed to delete product');
    }
  };

  // Get parent categories for dropdown
  const getParentOptions = () => {
    const parents = [...new Set(categories.map(cat => {
      const parts = cat.name.split('/');
      return parts.slice(0, -1).join('/');
    }).filter(Boolean))];
    
    const roots = categories.filter(cat => !cat.name.includes('/')).map(cat => cat.name);
    
    return [...new Set([...roots, ...parents])].sort();
  };

  if (loading) return <div className="container"><p>Loading categories...</p></div>;

  return (
    <div className="admin-categories">
      <div className="container">
        <h1>Categories Management</h1>
        
        {/* Debug Information */}
        {debugInfo && (
          <div className="debug-info" style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '1rem', 
            marginBottom: '1rem', 
            borderRadius: '5px',
            fontSize: '0.9rem' 
          }}>
            <strong>Debug Info:</strong> 
            Total Products: {debugInfo.total_products || 0} | 
            Categories Found: {categories.length}
            {debugInfo.error && <div style={{ color: 'red' }}>Error: {debugInfo.error}</div>}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="error-message" style={{ 
            backgroundColor: '#f8d7da', 
            color: '#721c24', 
            padding: '1rem', 
            marginBottom: '1rem', 
            borderRadius: '5px' 
          }}>
            Error: {error}
          </div>
        )}
        
        <form onSubmit={createCategory} className="category-form">
          <div className="form-row">
            <select
              value={parentCategory}
              onChange={(e) => setParentCategory(e.target.value)}
              disabled={creating}
            >
              <option value="">Root Category</option>
              {getParentOptions().map(parent => (
                <option key={parent} value={parent}>{parent}</option>
              ))}
            </select>
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
          </div>
          {parentCategory && (
            <p className="parent-preview">
              Creating: <strong>{parentCategory}/{newCategoryName}</strong>
              <button type="button" onClick={() => setParentCategory('')} className="clear-parent">×</button>
            </p>
          )}
        </form>

        {categories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
            <h3>No categories found</h3>
            <p>Categories are created from existing products. You can:</p>
            <ol style={{ textAlign: 'left', display: 'inline-block' }}>
              <li>Create your first category above</li>
              <li>Add products in the Products section</li>
              <li>Assign categories to products</li>
            </ol>
            <p>
              <strong>Tip:</strong> Create a category like "Electronics" or "Clothing" to get started.
            </p>
          </div>
        ) : (
          <div className="categories-tree">
            {renderCategoryTree(getHierarchicalCategories())}
          </div>
        )}
            
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
            
            <div className="scroll-controls">
              <button className="scroll-to-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                ↑ Back to Top
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCategories;