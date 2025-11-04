import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/index.css';

// Service Worker DISABLED to prevent caching issues
// If you need PWA functionality, implement proper cache versioning
if ('serviceWorker' in navigator) {
  // Unregister any existing service workers
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister();
      console.log('🗑️ Service Worker unregistered');
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
