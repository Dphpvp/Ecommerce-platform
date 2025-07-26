import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToastContext } from '../toast';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

const BulkUpdateProducts = () => {
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [updateType, setUpdateType] = useState('price');
  const [updateValue, setUpdateValue] = useState('');
  const [updateMethod, setUpdateMethod] = useState('set'); // set, increase, decrease, percentage
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  const { makeAuthenticatedRequest } = useAuth();
  const { showToast } = useToastContext();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await makeAuthenticatedRequest(`${API_BASE}/admin/products`);
      setProducts(data.products || []);
    } catch (error) {
      showToast('Failed to fetch products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p._id));
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedProducts.length === 0) {
      showToast('Please select at least one product', 'error');
      return;
    }

    if (!updateValue) {
      showToast('Please enter an update value', 'error');
      return;
    }

    setUpdating(true);

    try {
      await makeAuthenticatedRequest(`${API_BASE}/admin/products/bulk-update`, {
        method: 'POST',
        body: JSON.stringify({
          product_ids: selectedProducts,
          update_type: updateType,
          update_value: parseFloat(updateValue),
          update_method: updateMethod
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      showToast(`Successfully updated ${selectedProducts.length} products`, 'success');
      fetchProducts();
      setSelectedProducts([]);
      setUpdateValue('');
    } catch (error) {
      showToast(error.message || 'Failed to update products', 'error');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-bulk-update">
        <div className="container">
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-bulk-update">
      <div className="container">
        <div className="bulk-update-header">
          <h1>💰 Bulk Update Products</h1>
          <button
            onClick={() => navigate('/admin/products')}
            className="btn btn-outline"
          >
            ← Back to Products
          </button>
        </div>

        <div className="bulk-update-content">
          <div className="update-controls">
            <h3>Update Configuration</h3>
            
            <div className="control-group">
              <label>Update Type:</label>
              <select 
                value={updateType} 
                onChange={(e) => setUpdateType(e.target.value)}
                className="form-select"
              >
                <option value="price">Price</option>
                <option value="stock">Stock</option>
              </select>
            </div>

            <div className="control-group">
              <label>Update Method:</label>
              <select 
                value={updateMethod} 
                onChange={(e) => setUpdateMethod(e.target.value)}
                className="form-select"
              >
                <option value="set">Set Value</option>
                <option value="increase">Increase By</option>
                <option value="decrease">Decrease By</option>
                <option value="percentage">Percentage Change</option>
              </select>
            </div>

            <div className="control-group">
              <label>Value:</label>
              <input
                type="number"
                value={updateValue}
                onChange={(e) => setUpdateValue(e.target.value)}
                className="form-input"
                placeholder="Enter value"
                step="0.01"
              />
            </div>

            <button
              onClick={handleBulkUpdate}
              disabled={updating || selectedProducts.length === 0}
              className="btn btn-primary"
            >
              {updating ? 'Updating...' : `Update ${selectedProducts.length} Products`}
            </button>
          </div>

          <div className="products-list">
            <div className="list-header">
              <h3>Select Products to Update ({selectedProducts.length} selected)</h3>
              <button onClick={handleSelectAll} className="btn btn-outline">
                {selectedProducts.length === products.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="products-grid">
              {products.map(product => (
                <div 
                  key={product._id} 
                  className={`product-card ${selectedProducts.includes(product._id) ? 'selected' : ''}`}
                  onClick={() => handleProductSelect(product._id)}
                >
                  <div className="product-image">
                    <img src={product.image_url} alt={product.name} />
                  </div>
                  <div className="product-info">
                    <h4>{product.name}</h4>
                    <p>Price: ${product.price}</p>
                    <p>Stock: {product.stock}</p>
                    <p>Category: {product.category}</p>
                  </div>
                  <div className="product-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product._id)}
                      onChange={() => handleProductSelect(product._id)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkUpdateProducts;