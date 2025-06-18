import React, { useState } from 'react';
import { useToastContext } from '../toast';
import SecureForm from '../SecureForm';
import { csrfManager } from '../../utils/csrf';
import '../../styles/ProductForm.css';

const ProductForm = ({
  product,
  categories = [],
  onSave,
  onCancel,
  token,
  isEdit = false,
}) => {
  const { showToast } = useToastContext();
  const [categoryType, setCategoryType] = useState("existing");
  const [customCategory, setCustomCategory] = useState("");

  const handleSubmit = async (sanitizedData, csrfToken) => {
    try {
      const url = isEdit
        ? `${process.env.REACT_APP_API_BASE_URL}/admin/products/${product._id}`
        : `${process.env.REACT_APP_API_BASE_URL}/products`;

      const method = isEdit ? "PUT" : "POST";

      const productData = {
        ...sanitizedData,
        price: parseFloat(sanitizedData.price),
        stock: parseInt(sanitizedData.stock),
        category: categoryType === "existing" ? sanitizedData.category : customCategory
      };

      const response = await csrfManager.makeSecureRequest(url, {
        method,
        headers: {
          'X-CSRF-Token': csrfToken,
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        showToast(
          isEdit ? "Product updated successfully" : "Product added successfully",
          "success"
        );
        onSave();
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to save product');
      }
    } catch (error) {
      throw error;
    }
  };

  return (
    <div className="product-form-overlay">
      <div className="product-form-container">
        <div className="product-form">
          <h3>{isEdit ? "Edit Product" : "Add New Product"}</h3>
          <SecureForm onSubmit={handleSubmit} validate={true}>
            <label htmlFor="name">Product Name:</label>
            <input
              type="text"
              name="name"
              placeholder="Product Name"
              defaultValue={product?.name || ""}
              minLength="1"
              maxLength="200"
              required
            />
            
            <label htmlFor="description">Description:</label>
            <textarea
              name="description"
              placeholder="Product Description (min 10 characters)"
              defaultValue={product?.description || ""}
              minLength="10"
              maxLength="2000"
              required
            />
            
            <label htmlFor="price">Price:</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max="999999.99"
              name="price"
              placeholder="Price"
              defaultValue={product?.price || ""}
              required
            />

            <div className="category-section">
              <label>Category Selection:</label>
              <select
                value={categoryType}
                onChange={(e) => setCategoryType(e.target.value)}
                className="category-select"
              >
                <option value="existing">Select Existing Category</option>
                <option value="new">Create New Category</option>
              </select>

              {categoryType === "existing" ? (
                <select
                  name="category"
                  defaultValue={product?.category || ""}
                  required
                  className="category-select"
                >
                  <option value="">Choose Category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Enter new category (use / for subcategories)"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  maxLength="100"
                  required
                />
              )}
            </div>
            
            <label htmlFor="image_url">Image URL:</label>
            <input
              type="url"
              name="image_url"
              placeholder="Image URL"
              defaultValue={product?.image_url || ""}
              maxLength="500"
              required
            />
            
            <label htmlFor="stock">Stock Quantity:</label>
            <input
              type="number"
              min="0"
              max="999999"
              name="stock"
              placeholder="Stock Quantity"
              defaultValue={product?.stock || ""}
              required
            />
            
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {isEdit ? "Update Product" : "Add Product"}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="btn btn-outline"
              >
                Cancel
              </button>
            </div>
          </SecureForm>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;