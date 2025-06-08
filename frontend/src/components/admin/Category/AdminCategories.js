import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const { token } = useAuth();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/admin/categories`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    setCategories(data.categories);
  };

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

export default AdminCategories;