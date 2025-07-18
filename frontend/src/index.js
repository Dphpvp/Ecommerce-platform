// frontend/src/index.js - Optimized import structure for luxury theme
import React from 'react';
import ReactDOM from 'react-dom/client';

// CSS imports - Using single theme.css entry point
import './styles/theme.css';



import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();