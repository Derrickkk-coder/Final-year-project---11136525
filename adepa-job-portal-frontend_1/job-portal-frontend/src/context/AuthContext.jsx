import React, { createContext, useContext, useEffect, useState } from 'react'
import { registerUser, loginUser, getMe } from '../api/auth.js'

const AuthContext = createContext(null)
const TOKEN_KEY = 'adepa_token'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setLoading(false)
      return
    }

    getMe()
      .then((data) => setUser(data.user))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async ({ email, password }) => {
    const data = await loginUser({ email, password })
    localStorage.setItem(TOKEN_KEY, data.token)
    setUser(data.user)
    return data.user
  }

  const register = async ({ name, email, password, role, company }) => {
    const data = await registerUser({ name, email, password, role, company })
    localStorage.setItem(TOKEN_KEY, data.token)
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }

  const updateUser = (updatedUser) => {
    setUser(updatedUser)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}