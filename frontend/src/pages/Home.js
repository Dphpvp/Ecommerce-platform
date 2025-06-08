import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await fetch(`${API_BASE}/products?limit=8`);
      const data = await response.json();
      setFeaturedProducts(data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  return (
    // <div className="home">
    //   <section className="hero">
    //     <div className="container">
    //       <h1>Welcome to E-Shop</h1>
    //       <p>Discover amazing products at great prices</p>
    //       <Link to="/products" className="btn btn-primary">Shop Now</Link>
    //     </div>
    //   </section>

      <section className="featured-products">
        <div className="container">
          <h2>Featured Products</h2>
          <div className="product-grid">
            {featuredProducts.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;