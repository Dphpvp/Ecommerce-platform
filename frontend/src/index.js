// frontend/src/index.js - Optimized import structure for luxury theme
import React from 'react';
import ReactDOM from 'react-dom/client';

// CSS imports in correct order for luxury theme
import './index.css';
import './styles/main.css';
import './styles/styles.css'
import './App.css';

import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();