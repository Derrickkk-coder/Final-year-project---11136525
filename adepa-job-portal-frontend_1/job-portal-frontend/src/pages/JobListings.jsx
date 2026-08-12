import React, { useEffect, useState } from 'react'
import { useSearchParams, Navigate } from 'react-router-dom'
import JobCard from '../components/JobCard.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { SkeletonJobList } from '../components/Skeleton.jsx'
import { fetchJobs } from '../api/jobs.js'
import { categories, jobTypes, locations } from '../data/mockJobs.js' // static filter option lists only
import { useAuth } from '../context/AuthContext.jsx'
import DashboardShell from '../components/DashboardShell.jsx'

export default function JobListings() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()

  // The links to get here are already gone from an admin's nav (they moderate
  // through "All jobs" instead), but /jobs itself is a public route, so typing
  // it in still worked. This closes that gap rather than just hiding the door.
  // Scoped to the listing only — a job's own /jobs/:id page isn't touched, so
  // an admin moderating a specific posting doesn't get bounced away from it.
  if (user?.role === 'admin') return <Navigate to="/admin" replace />
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [category, setCategory] = useState(searchParams.get('category') || 'All categories')
  const [type, setType] = useState('All types')
  const [location, setLocation] = useState('All locations')
  // Deep-linkable, so the homepage "See all" lands here with it already on
  const [studentOnly, setStudentOnly] = useState(searchParams.get('studentFriendly') === 'true')

  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  // Bumped by the "Try again" button to re-run the fetch effect without
  // needing to touch any of the filter values
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(true)
      setError('')

      fetchJobs({
        q: query,
        category,
        type,
        location,
        // Only send it when on — an explicit `false` would still be a string in
        // the query and the server checks for 'true'
        ...(studentOnly ? { studentFriendly: true } : {}),
      })
        .then((data) => setJobs(data.jobs))
        .catch(() => setError('Could not load jobs right now. Please try again.'))
        .finally(() => setLoading(false))
    }, 300)

    return () => clearTimeout(timeout)
  }, [query, category, type, location, studentOnly, reloadKey])

  const clearFilters = () => {
    setQuery('')
    setCategory('All categories')
    setType('All types')
    setLocation('All locations')
    setStudentOnly(false)
  }

  // Extracted so the signed-in and public layouts render exactly the same
  // filters and results, rather than two copies that can drift apart.
  const body = (
    <>
      <div className="filters">
        <div className="form-field">
          <label htmlFor="q">Keyword</label>
          <input id="q" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Role or company" />
        </div>
        <div className="form-field">
          <label htmlFor="category">Category</label>
          <select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="type">Job type</label>
          <select id="type" value={type} onChange={(e) => setType(e.target.value)}>
            {jobTypes.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="location">Location</label>
          <select id="location" value={location} onChange={(e) => setLocation(e.target.value)}>
            {locations.map((l) => <option key={l}>{l}</option>)}
          </select>
        </div>
        <label className="filter-check">
          <input
            type="checkbox"
            checked={studentOnly}
            onChange={(e) => setStudentOnly(e.target.checked)}
          />
          Students &amp; graduates only
        </label>

        <button className="btn btn--ghost btn--sm" type="button" onClick={clearFilters}>
          Clear
        </button>
      </div>

      {loading && <SkeletonJobList count={4} />}

      {!loading && error && (
        <EmptyState
          icon="⚠️"
          tone="error"
          title="Couldn't load jobs"
          description={error}
          action={
            <button className="btn btn--pine" onClick={() => setReloadKey((k) => k + 1)}>
              Try again
            </button>
          }
        />
      )}

      {!loading && !error && (
        <>
          <p style={{ color: 'var(--ink-soft)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-5)' }}>
            {jobs.length} {jobs.length === 1 ? 'role' : 'roles'} found
          </p>

          {jobs.length > 0 ? (
            <div className="listings-grid">
              {jobs.map((job) => <JobCard key={job._id} job={job} />)}
            </div>
          ) : (
            <EmptyState
              icon="🔍"
              title="No roles match those filters"
              description="Nothing open fits that combination right now. Try a different keyword, or widen one of the filters."
              action={
                <button className="btn btn--outline-teal" onClick={clearFilters}>
                  Clear all filters
                </button>
              }
            />
          )}
        </>
      )}
    </>
  )

  // /jobs is public, so the dashboard frame is only right for someone who has
  // one. A visitor has no avatar, role or sign-out to put in a sidebar, and an
  // employer arriving here is deliberately looking at the public view of the
  // board — both get the plain page.
  if (user?.role === 'seeker') {
    return (
      <DashboardShell eyebrow="Find work" title="Browse open roles">
        {body}
      </DashboardShell>
    )
  }

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 72 }}>
      <span className="eyebrow">Browse jobs</span>
      <h1 style={{ fontSize: 32, marginTop: 8, marginBottom: 28 }}>Browse open roles</h1>
      {body}
    </div>
  )
}