import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Safely sanitize corrupt localStorage 'user' string (e.g. "undefined")
try {
  const storedUser = localStorage.getItem('user');
  if (storedUser === 'undefined' || storedUser === 'null') {
    localStorage.removeItem('user');
  } else if (storedUser) {
    JSON.parse(storedUser); // Test if it is valid JSON
  }
} catch (e) {
  localStorage.removeItem('user');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
