import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/admincategories.css';


const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
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
      setCategories(data.categories);
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
        <div className="categories-grid">
          {categories.map(cat => (
            <div key={cat.name} className="category-card">
              <h3>{cat.name}</h3>
              <p>Products: {cat.product_count}</p>
              <p>Total Stock: {cat.total_stock}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

console.log('Response status:', response.status);
const data = await response.json();
console.log('Categories data:', data);

export default AdminCategories;