import { useEffect, useState } from 'react';
import '../../admin/Category/categoryList.css'; // Ensure you have a CSS file for styling


const   API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';
const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/categories`);
      if (!response.ok) throw new Error("Failed to fetch categories");
      const data = await response.json();
      const uniqueCategories = [...new Set(data.map((p) => p.category))];
      console.log("Fetched categories:", uniqueCategories);
      
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="category-list">
      <h2>Product Categories</h2>
      <ul>
        {categories.map((category) => (
          <li key={category}>{category}</li>
        ))}
      </ul>
      {categories.length === 0 && <p>No categories found.</p>}
    </div>
  );
};


export default CategoryList;