import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import JobListings from './pages/JobListings.jsx'
import JobDetails from './pages/JobDetails.jsx'
import JobSeekerDashboard from './pages/JobSeekerDashboard.jsx'
import EmployerDashboard from './pages/EmployerDashboard.jsx'
import PostJob from './pages/PostJob.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout><Home /></Layout>} />
      <Route path="/jobs" element={<Layout><JobListings /></Layout>} />
      <Route path="/jobs/:id" element={<Layout><JobDetails /></Layout>} />
      <Route path="/login" element={<Layout hideFooter><Login /></Layout>} />
      <Route path="/register" element={<Layout hideFooter><Register /></Layout>} />

      <Route
        path="/dashboard"
        element={
          <Layout>
            <ProtectedRoute role="seeker">
              <JobSeekerDashboard />
            </ProtectedRoute>
          </Layout>
        }
      />

      <Route
        path="/employer"
        element={
          <Layout>
            <ProtectedRoute role="employer">
              <EmployerDashboard />
            </ProtectedRoute>
          </Layout>
        }
      />

      <Route
        path="/employer/post"
        element={
          <Layout>
            <ProtectedRoute role="employer">
              <PostJob />
            </ProtectedRoute>
          </Layout>
        }
      />

      <Route path="*" element={<Layout><NotFound /></Layout>} />
    </Routes>
  )
}
