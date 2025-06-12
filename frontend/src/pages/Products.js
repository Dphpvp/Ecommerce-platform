import React, { useState, useEffect, useCallback } from 'react';
import ProductCard from '../components/ProductCard';

const API_BASE = process.env.REACT_APP_API_BASE_URL;

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  const fetchProducts = useCallback(async () => {
    try {
      const url = selectedCategory 
        ? `${API_BASE}/products?category=${selectedCategory}`
        : `${API_BASE}/products`;
      
      const response = await fetch(url);
      const data = await response.json();
      setProducts(data);

      const uniqueCategories = [...new Set(data.map(p => p.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="products">
      <div className="container">
        <div className="products-header">
          <h1>Products</h1>
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-filter"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div className="product-grid">
          {products.map(product => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Products;