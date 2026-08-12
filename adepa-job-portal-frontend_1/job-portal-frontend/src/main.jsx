import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { NotificationsProvider } from './context/NotificationsContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { ConfirmProvider } from './context/ConfirmContext.jsx'
import { SidebarProvider } from './context/SidebarContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import Toaster from './components/Toaster.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Outermost: nothing about auth, routing, or data should gate whether the
        page can paint in the right theme. The inline script in index.html
        already set the attribute before this even runs — this is what keeps
        it in sync from here on (an OS change, the toggle, another tab). */}
    <ThemeProvider>
      <BrowserRouter>
        {/* Toast and Confirm are outermost: they hold no data of their own and
            anything inside may need to raise a message or ask for confirmation.
            NotificationsProvider sits inside AuthProvider — it reads the current
            user to know whether to fetch, and to clear on logout. */}
        <ToastProvider>
          <ConfirmProvider>
            <AuthProvider>
              <NotificationsProvider>
                {/* Above App so the header and the routed page below it share one
                    drawer state — they're siblings inside Layout. */}
                <SidebarProvider>
                  <App />
                </SidebarProvider>
                <Toaster />
              </NotificationsProvider>
            </AuthProvider>
          </ConfirmProvider>
        </ToastProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
)
