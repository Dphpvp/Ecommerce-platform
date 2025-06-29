// frontend/src/index.js - Updated with Parallax Imports
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/variables.css';
import './styles/main.css';
import './styles/layout.css';
import './styles/utilities.css';
import './styles/components.css';
import './styles/base.css';
import './styles/tailoring-theme.css';
import './styles/parallax-enhancements.css';
import './styles/luxury-background.css'; 
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