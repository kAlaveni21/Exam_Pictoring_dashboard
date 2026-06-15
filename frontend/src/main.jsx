import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import axios from 'axios'
import './index.css'
import App from './App.jsx'

// Set up global environment constants on window
window.API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
window.SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

// Global request interceptor to rewrite hardcoded localhost:4000 calls
axios.interceptors.request.use((config) => {
  if (config.url && config.url.startsWith('http://localhost:4000/api')) {
    config.url = config.url.replace('http://localhost:4000/api', window.API_BASE);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
