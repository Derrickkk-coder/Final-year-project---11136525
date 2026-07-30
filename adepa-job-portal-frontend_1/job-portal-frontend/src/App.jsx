import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import VerifyEmail from './pages/VerifyEmail.jsx'
import JobListings from './pages/JobListings.jsx'
import JobDetails from './pages/JobDetails.jsx'
import JobSeekerDashboard from './pages/JobSeekerDashboard.jsx'
import EmployerDashboard from './pages/EmployerDashboard.jsx'
import PostJob from './pages/PostJob.jsx'
import EditJob from './pages/EditJob.jsx'
import CompanyProfile from './pages/CompanyProfile.jsx'
import MyProfile from './pages/MyProfile.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout><Home /></Layout>} />
      <Route path="/jobs" element={<Layout><JobListings /></Layout>} />
      <Route path="/jobs/:id" element={<Layout><JobDetails /></Layout>} />
      <Route path="/login" element={<Layout hideFooter><Login /></Layout>} />
      <Route path="/register" element={<Layout hideFooter><Register /></Layout>} />
      <Route path="/verify-email/:token" element={<Layout hideFooter><VerifyEmail /></Layout>} />

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
        path="/profile"
        element={
          <Layout>
            <ProtectedRoute role="seeker">
              <MyProfile />
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

      <Route
        path="/employer/jobs/:id/edit"
        element={
          <Layout>
            <ProtectedRoute role="employer">
              <EditJob />
            </ProtectedRoute>
          </Layout>
        }
      />

      <Route
        path="/employer/profile"
        element={
          <Layout>
            <ProtectedRoute role="employer">
              <CompanyProfile />
            </ProtectedRoute>
          </Layout>
        }
      />

      <Route
        path="/admin"
        element={
          <Layout>
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          </Layout>
        }
      />

      <Route path="*" element={<Layout><NotFound /></Layout>} />
    </Routes>
  )
}