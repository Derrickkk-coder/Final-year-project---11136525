import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DepartureBoard from '../components/DepartureBoard.jsx'
import JobCard from '../components/JobCard.jsx'
import LogoStrip from '../components/LogoStrip.jsx'
import Testimonials from '../components/Testimonials.jsx'
import { fetchJobs } from '../api/jobs.js'
import { categories } from '../data/mockJobs.js' // static filter option list only, not job data

const FEATURES = [
  {
    title: 'Higher-quality listings',
    body: 'Every vacancy on Adepa comes from a verified employer account — no scraped duplicates, no expired postings.',
  },
  {
    title: 'One dashboard, every application',
    body: 'Track status, see who viewed your profile, and manage every application from a single job-seeker dashboard.',
  },
  {
    title: 'Built for Ghana\'s job market',
    body: 'Local salary ranges in GHS, roles across Accra, Tema, and remote-friendly companies you actually recognise.',
  },
]

export default function Home() {
  const [query, setQuery] = useState('')
  const [featuredJobs, setFeaturedJobs] = useState([])
  const [totalOpenJobs, setTotalOpenJobs] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    fetchJobs({ limit: 3 })
      .then((data) => {
        setFeaturedJobs(data.jobs)
        setTotalOpenJobs(data.pagination?.total ?? data.jobs.length)
      })
      .catch(() => {
        setFeaturedJobs([])
        setTotalOpenJobs(0)
      })
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    navigate(query ? `/jobs?q=${encodeURIComponent(query)}` : '/jobs')
  }

  return (
    <>
      <section className="hero">
        <div className="container hero__grid">
          <div>
            <span className="hero__eyebrow">The centralised job portal for Ghana</span>
            <h1 className="hero__title">
              Find a <em>better way</em> to get hired
            </h1>
            <p className="hero__sub">
              Nextleap connects job seekers with verified employers across Accra, Tema, and remote
              teams — search once, apply in a click, and track every application in one place.
            </p>

            <form className="hero__form" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search by role, company, or keyword…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search jobs"
              />
              <button className="btn btn--coral" type="submit">
                Search jobs
              </button>
            </form>

            <div className="hero__stats">
              <div>
                <div className="hero__stat-num">{totalOpenJobs}+</div>
                <div className="hero__stat-label">Open roles</div>
              </div>
              <div>
                <div className="hero__stat-num">120+</div>
                <div className="hero__stat-label">Employers</div>
              </div>
              <div>
                <div className="hero__stat-num">2,400+</div>
                <div className="hero__stat-label">Applications sent</div>
              </div>
            </div>
          </div>

          <div>
            <DepartureBoard />
          </div>
        </div>
      </section>

      <LogoStrip />

      <section className="section">
        <div className="container">
          <div className="section__head">
            <div>
              <span className="eyebrow">Fresh listings</span>
              <h2 className="section__title">Recently posted roles</h2>
              <p className="section__desc">
                A snapshot of what's open right now. Full search, filters, and applications live
                on the jobs board.
              </p>
            </div>
            <a href="/jobs" className="btn btn--outline-teal">
              View all jobs
            </a>
          </div>

          {featuredJobs.length > 0 ? (
            <div className="listings-grid">
              {featuredJobs.map((job) => (
                <JobCard key={job._id} job={job} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>No roles posted yet</h3>
              <p>Once employers start posting, their listings will show up here.</p>
            </div>
          )}
        </div>
      </section>

      <section className="section" style={{ background: '#fff', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <div className="container">
          <span className="eyebrow">Why NextLeap</span>
          <h2 className="section__title" style={{ marginTop: 8, marginBottom: 36 }}>How Adepa is different</h2>
          <div className="features-grid">
            {FEATURES.map((f) => (
              <div key={f.title}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', background: 'var(--teal-100)',
                  color: 'var(--teal-700)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, marginBottom: 14,
                }}>✓</div>
                <h3 style={{ fontSize: 17, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ color: 'var(--ink-soft)', fontSize: 14.5, lineHeight: 1.6 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <span className="eyebrow">Explore by category</span>
          <h2 className="section__title" style={{ marginTop: 8 }}>
            Open roles across {categories.length - 1} categories
          </h2>
          <div className="category-pills">
            {categories.filter((c) => c !== 'All categories').map((c) => (
              <a key={c} href={`/jobs?category=${encodeURIComponent(c)}`} className="category-pill">{c}</a>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <span className="eyebrow">What people are saying</span>
          <h2 className="section__title" style={{ marginTop: 8, marginBottom: 32 }}>Trusted by job seekers and employers</h2>
          <Testimonials />
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="panel panel--pine" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <h2 style={{ fontSize: 24, marginBottom: 8, color: '#fff' }}>Hiring? List your vacancy today.</h2>
              <p style={{ color: 'rgba(255,255,255,0.8)', maxWidth: '48ch' }}>
                Post a role, manage applicants in one dashboard, and reach job seekers across
                Ghana — no paperwork, no scattered inboxes.
              </p>
            </div>
            <a href="/register" className="btn btn--coral">Post a job</a>
          </div>
        </div>
      </section>
    </>
  )
}