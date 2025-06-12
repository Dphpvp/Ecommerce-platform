import React, { useState } from 'react';
import { useToastContext } from '../toast';
import '../../styles/ProductForm.css';

const API_BASE = process.env.REACT_APP_API_BASE_URL;

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
  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price || "",
    category: product?.category || "",
    image_url: product?.image_url || "",
    stock: product?.stock || "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = isEdit
        ? `${API_BASE}/admin/products/${product._id}`
        : `${API_BASE}/products`;

      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock),
        }),
      });

      if (response.ok) {
        showToast(
          isEdit
            ? "Product updated successfully"
            : "Product added successfully",
          "success"
        );
        onSave();
      } else {
        showToast("Failed to save product", "error");
      }
    } catch (error) {
      console.error("Failed to save product:", error);
      showToast("Failed to save product", "error");
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCategoryTypeChange = (e) => {
    setCategoryType(e.target.value);
    if (e.target.value === "existing") {
      setCustomCategory("");
      setFormData({ ...formData, category: "" });
    }
  };

  const handleCategoryChange = (e) => {
    if (categoryType === "existing") {
      setFormData({ ...formData, category: e.target.value });
    } else {
      setCustomCategory(e.target.value);
      setFormData({ ...formData, category: e.target.value });
    }
  };

  // Group categories by hierarchy for better display
  const getCategoryDisplay = (category) => {
    const parts = category.split('/');
    const indent = '  '.repeat(parts.length - 1);
    const displayName = parts[parts.length - 1];
    return `${indent}${displayName}`;
  };

  // Sort categories to show hierarchy properly
  const sortedCategories = [...categories].sort((a, b) => {
    // Sort by hierarchy depth first, then alphabetically
    const aDepth = a.split('/').length;
    const bDepth = b.split('/').length;
    if (aDepth !== bDepth) return aDepth - bDepth;
    return a.localeCompare(b);
  });

  return (
    <div className="product-form-overlay">
      <div className="product-form-container">
        <div className="product-form">
          <h3>{isEdit ? "Edit Product" : "Add New Product"}</h3>
          <form onSubmit={handleSubmit}>
            <label htmlFor="name">Product Name:</label>
            <input
              type="text"
              name="name"
              placeholder="Product Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <label htmlFor="description">Description:</label>
            <textarea
              name="description"
              placeholder="Product Description"
              value={formData.description}
              onChange={handleChange}
              required
            />
            <label htmlFor="price">Price:</label>
            <input
              type="number"
              step="0.01"
              name="price"
              placeholder="Price"
              value={formData.price}
              onChange={handleChange}
              required
            />

            <div className="category-section">
              <label>Category Selection:</label>
              <select
                value={categoryType}
                onChange={handleCategoryTypeChange}
                className="category-select"
              >
                <option value="existing">Select Existing Category</option>
                <option value="new">Create New Category</option>
              </select>

              {categoryType === "existing" ? (
                <select
                  value={formData.category}
                  onChange={handleCategoryChange}
                  required
                  className="category-select"
                >
                  <option value="">Choose Category</option>
                  {sortedCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {getCategoryDisplay(cat)}
                    </option>
                  ))}
                </select>
              ) : (
                <div>
                  <input
                    type="text"
                    placeholder="Enter new category (use / for subcategories, e.g., Sports/Football)"
                    value={customCategory}
                    onChange={handleCategoryChange}
                    required
                  />
                  <small style={{ color: '#666', fontSize: '0.9rem', display: 'block', marginTop: '0.5rem' }}>
                    Examples: "Electronics", "Sports/Football", "Home/Kitchen/Appliances"
                  </small>
                </div>
              )}
            </div>
            
            <label htmlFor="image_url">Image URL:</label>
            <input
              type="url"
              name="image_url"
              placeholder="Image URL"
              value={formData.image_url}
              onChange={handleChange}
              required
            />
            <label htmlFor="stock">Stock Quantity:</label>
            <input
              type="number"
              name="stock"
              placeholder="Stock Quantity"
              value={formData.stock}
              onChange={handleChange}
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
          </form>
        </div>
        <div className="product-image-preview">
          {formData.image_url ? (
            <img src={formData.image_url} alt="Product Preview" />
          ) : (
            <p>No image preview</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductForm;