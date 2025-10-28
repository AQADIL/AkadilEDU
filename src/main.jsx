import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/index.css';

// Service Worker disabled in development to avoid errors
// Enable in production build only
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('/sw.js')
    .then(registration => console.log('ServiceWorker registered:', registration.scope))
    .catch(error => console.error('ServiceWorker registration failed:', error));
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
