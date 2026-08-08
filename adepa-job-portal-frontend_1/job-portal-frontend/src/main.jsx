import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { NotificationsProvider } from './context/NotificationsContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { ConfirmProvider } from './context/ConfirmContext.jsx'
import Toaster from './components/Toaster.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* Toast and Confirm are outermost: they hold no data of their own and
          anything inside may need to raise a message or ask for confirmation.
          NotificationsProvider sits inside AuthProvider — it reads the current
          user to know whether to fetch, and to clear on logout. */}
      <ToastProvider>
        <ConfirmProvider>
          <AuthProvider>
            <NotificationsProvider>
              <App />
              <Toaster />
            </NotificationsProvider>
          </AuthProvider>
        </ConfirmProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
