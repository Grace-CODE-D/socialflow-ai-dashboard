import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { configureApi } from './api/configure'
import './index.css'

// Wire the generated OpenAPI client to a real base URL and the stored access
// token once, at app startup, so every src/api/services/* client call is
// authenticated and points at the real backend instead of being dead code.
configureApi({
  baseUrl: import.meta.env.VITE_API_URL,
  getToken: () => localStorage.getItem('sf_auth_token') ?? undefined,
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
