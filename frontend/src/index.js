import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/var.css';
import './styles/tailoring-theme.css';
import './App.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import './styles/admin.css';
import './styles/enhanced-products.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();