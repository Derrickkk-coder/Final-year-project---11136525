import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import JobCard from '../components/JobCard.jsx'
import { fetchJobs } from '../api/jobs.js'
import { categories, jobTypes, locations } from '../data/mockJobs.js' // static filter option lists only

export default function JobListings() {
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [category, setCategory] = useState(searchParams.get('category') || 'All categories')
  const [type, setType] = useState('All types')
  const [location, setLocation] = useState('All locations')

  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(true)
      setError('')

      fetchJobs({ q: query, category, type, location })
        .then((data) => setJobs(data.jobs))
        .catch(() => setError('Could not load jobs right now. Please try again.'))
        .finally(() => setLoading(false))
    }, 300)

    return () => clearTimeout(timeout)
  }, [query, category, type, location])

  const clearFilters = () => {
    setQuery('')
    setCategory('All categories')
    setType('All types')
    setLocation('All locations')
  }

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 72 }}>
      <span className="eyebrow">Browse jobs</span>
      <h1 style={{ fontSize: 32, marginTop: 8, marginBottom: 28 }}>Browse open roles</h1>

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
        <button className="btn btn--ghost btn--sm" type="button" onClick={clearFilters}>
          Clear
        </button>
      </div>

      {loading && <p style={{ color: 'var(--ink-soft)', fontSize: 13, marginBottom: 18 }}>Loading jobs…</p>}

      {error && (
        <div className="empty-state">
          <h3>Something went wrong</h3>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          <p style={{ color: 'var(--ink-soft)', fontSize: 13, marginBottom: 18 }}>
            {jobs.length} {jobs.length === 1 ? 'role' : 'roles'} found
          </p>

          {jobs.length > 0 ? (
            <div className="listings-grid">
              {jobs.map((job) => <JobCard key={job._id} job={job} />)}
            </div>
          ) : (
            <div className="empty-state">
              <h3>No roles match those filters</h3>
              <p>Try clearing a filter or searching a different keyword.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}