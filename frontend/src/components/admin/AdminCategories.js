import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/admincategories.css';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    console.log('AdminCategories mounted, calling fetchCategories');
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    console.log('Fetching categories...');
    console.log('API URL:', `${API_BASE}/admin/categories`);
    console.log('Token:', token);
    
    try {
      const response = await fetch(`${API_BASE}/admin/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Categories data:', data);
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="container"><p>Loading categories...</p></div>;

  return (
    <div className="admin-categories">
      <div className="container">
        <h1>Categories Management</h1>
        {categories.length === 0 ? (
          <p>No categories found. Add some products first.</p>
        ) : (
          <div className="categories-grid">
            {categories.map(cat => (
              <div key={cat.name} className="category-card">
                <h3>{cat.name}</h3>
                <p>Products: {cat.product_count}</p>
                <p>Total Stock: {cat.total_stock}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCategories;