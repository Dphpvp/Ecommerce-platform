// frontend/src/index.js - Optimized import structure for luxury theme
import React from 'react';
import ReactDOM from 'react-dom/client';

// CSS imports in correct order for luxury theme
import './index.css';
import './styles/variables.css';
import './styles/design-system.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/theme/luxury.css';
import './styles/theme/luxury-theme.css';
import './styles/parallax-enhancements.css';
import './styles/pages/admin.css';
import './styles/utilities.css';
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