import 'katex/dist/katex.min.css';

import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/index.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/firebase-messaging-sw.js', { scope: '/' })
      .then((registration) => {
        setInterval(() => {
          registration.update();
        }, 60000);
      })
      .catch((error) => {});
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
