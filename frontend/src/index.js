// frontend/src/index.js - Updated with Parallax Imports
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/pages/admin.css';
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