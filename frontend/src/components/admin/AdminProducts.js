import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToastContext } from '../toast';
import ProductForm from './ProductForm';
import 'styles/admin/admin.css';

const API_BASE = process.env.REACT_APP_API_BASE_URL;

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const { makeAuthenticatedRequest } = useAuth();
  const { showToast } = useToastContext();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await makeAuthenticatedRequest(`${API_BASE}/admin/products`);
      setProducts(data.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await makeAuthenticatedRequest(`${API_BASE}/admin/categories`);
      const categoryNames = data.categories?.map(cat => cat.name).sort() || [];
      setCategories(categoryNames);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await makeAuthenticatedRequest(`${API_BASE}/admin/products/${productId}`, {
        method: 'DELETE'
      });

      showToast('Product deleted successfully', 'success');
      fetchProducts();
      fetchCategories();
    } catch (error) {
      console.error('Failed to delete product:', error);
      showToast('Failed to delete product', 'error');
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowAddForm(true);
  };

  const handleEditProduct = (product) => {
    setShowAddForm(false);
    setEditingProduct(product);
  };

  const closeModals = () => {
    setShowAddForm(false);
    setEditingProduct(null);
  };

  if (loading) return <div className="container"><p>Loading products...</p></div>;

  return (
    <div className="admin-products">
      <div className="container">
        <div className="products-header">
          <h1>Product Management</h1>
          <button
            onClick={handleAddProduct}
            className="btn btn-primary"
          >
            Add New Product
          </button>
        </div>

        {/* Add Product Modal */}
        {showAddForm && (
          <ProductForm
            categories={categories}
            onSave={() => {
              closeModals();
              fetchProducts();
              fetchCategories();
            }}
            onCancel={closeModals}
          />
        )}

        {/* Edit Product Modal */}
        {editingProduct && (
          <ProductForm
            product={editingProduct}
            categories={categories}
            onSave={() => {
              closeModals();
              fetchProducts();
              fetchCategories();
            }}
            onCancel={closeModals}
            isEdit={true}
          />
        )}

        <div className="products-grid">
          {products.map((product) => (
            <div key={product._id} className="admin-product-card">
              <img src={product.image_url} alt={product.name} />
              <div className="product-info">
                <h3>{product.name}</h3>
                <p className="description">{product.description}</p>
                <p>
                  <strong>Price:</strong> ${product.price}
                </p>
                <p>
                  <strong>Category:</strong> {product.category}
                </p>
                <p className={`stock ${product.stock < 10 ? "low-stock" : ""}`}>
                  <strong>Stock:</strong> {product.stock}
                  {product.stock < 10 && " ⚠️"}
                </p>
              </div>
              <div className="product-actions">
                <button
                  onClick={() => handleEditProduct(product)}
                  className="btn btn-outline"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteProduct(product._id)}
                  className="btn btn-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {products.length === 0 && (
          <div className="no-products">
            <p>No products found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProducts;