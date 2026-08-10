import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import DepartureBoard from '../components/DepartureBoard.jsx'
import JobCard from '../components/JobCard.jsx'
import LogoStrip from '../components/LogoStrip.jsx'
import Testimonials from '../components/Testimonials.jsx'
import TestimonialForm from '../components/TestimonialForm.jsx'
import Reveal from '../components/Reveal.jsx'
import CountUp from '../components/CountUp.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { SkeletonJobList } from '../components/Skeleton.jsx'
import { fetchJobs } from '../api/jobs.js'
import { fetchPublicStats } from '../api/stats.js'
import { categories } from '../data/mockJobs.js' // static filter option list only, not job data

const HOW_IT_WORKS = [
  {
    title: 'Register',
    body: 'Create a free account as a job seeker or an employer. Employers are reviewed by an admin before they can post, which is why every listing here comes from a real company.',
  },
  {
    title: 'Find or post a job',
    body: 'Seekers search, filter, and get roles matched against the skills on their profile. Employers publish a vacancy in one form, tagging the skills the role actually needs.',
  },
  {
    title: 'Apply',
    body: 'Apply with your saved CV in a couple of clicks — no re-uploading for every role. See how well you fit before you commit, and what you are missing.',
  },
  {
    title: 'Manage applications',
    body: 'Track every application and its status in one dashboard. Employers get applicants ranked by skill fit, and can shortlist and schedule interviews from the same place.',
  },
]

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
  // Open-job count now comes from /api/stats along with the other three, so the
  // featured-jobs request no longer needs to report a total.
  const [jobsLoading, setJobsLoading] = useState(true)
  const [studentJobs, setStudentJobs] = useState([])
  const [stats, setStats] = useState({
    openJobs: 0,
    seekers: 0,
    employers: 0,
    successfulApplications: 0,
  })
  const navigate = useNavigate()
  const { user } = useAuth()

  // Send an employer straight to the form; anyone else needs an account first
  const employerCtaTarget = user?.role === 'employer' ? '/employer/post' : '/register'

  useEffect(() => {
    fetchPublicStats()
      .then((data) => setStats(data.stats))
      // Counters stay at zero rather than the page failing — they're
      // decoration, not the reason anyone is here
      .catch(() => {})

    fetchJobs({ limit: 3 })
      .then((data) => setFeaturedJobs(data.jobs))
      .catch(() => setFeaturedJobs([]))
      .finally(() => setJobsLoading(false))

    // Public — no login needed, so a student landing here sees relevant
    // opportunities before deciding whether to sign up. The section hides itself
    // when there are none rather than showing an empty shelf.
    fetchJobs({ studentFriendly: true, limit: 3 })
      .then((data) => setStudentJobs(data.jobs))
      .catch(() => setStudentJobs([]))
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    navigate(query ? `/jobs?q=${encodeURIComponent(query)}` : '/jobs')
  }

  return (
    <>
      {/* Hero content animates in on load in a staggered cascade (anim-d1…d4);
          everything further down the page waits until it's scrolled to. */}
      <section className="hero">
        <div className="container hero__grid">
          <div>
            <span className="hero__eyebrow anim-rise">The centralised job portal for Ghana</span>
            {/* Names what the platform actually does — verified employers and
                skill matching are real features, not slogan. */}
            <h1 className="hero__title anim-rise anim-d1">
              Verified jobs across Ghana, <em>matched to your skills</em>
            </h1>
            <p className="hero__sub anim-rise anim-d2">
              Every employer on NextLeap is approved before they can post. Build a profile once,
              see how well you fit each role, and track every application in one place.
            </p>

            <form className="hero__form anim-rise anim-d3" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search by role, company, or keyword…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search jobs"
              />
              {/* "Search" not "Search jobs" — "Find jobs" sits directly below and
                  two near-identical labels would compete */}
              <button className="btn btn--coral btn--shine" type="submit">
                Search
              </button>
            </form>

            <div className="hero__cta anim-rise anim-d4">
              <Link to="/jobs" className="btn btn--pine btn--lg">Find jobs</Link>
              <Link to={employerCtaTarget} className="btn btn--outline-pine btn--lg">Post a job</Link>
            </div>

            {/* Real counts from /api/stats. The two figures here that used to be
                hardcoded ("120+ employers", "2,400+ applications sent") were
                invented, and are now measured. */}
            <div className="hero__stats anim-rise anim-d5">
              <div>
                <div className="hero__stat-num"><CountUp end={stats.openJobs} /></div>
                <div className="hero__stat-label">Jobs available</div>
              </div>
              <div>
                <div className="hero__stat-num"><CountUp end={stats.seekers} /></div>
                <div className="hero__stat-label">Job seekers</div>
              </div>
              <div>
                <div className="hero__stat-num"><CountUp end={stats.employers} /></div>
                <div className="hero__stat-label">Employers</div>
              </div>
              <div>
                <div className="hero__stat-num"><CountUp end={stats.successfulApplications} /></div>
                <div className="hero__stat-label">Successful applications</div>
              </div>
            </div>
          </div>

          <div className="anim-slide-right anim-d3">
            <DepartureBoard />
          </div>
        </div>
      </section>

      <LogoStrip />

      {/* Was the how-it-works slot. Both sections are position-styled - a tinted
          band here, a white bordered one further down - so swapping the two moved
          the content and left each band where the page's rhythm wants it. */}
      <section className="section section--band">
        <div className="container">
          <Reveal>
            <span className="eyebrow">Why NextLeap</span>
            <h2 className="section__title" style={{ marginTop: 8, marginBottom: 36 }}>How NextLeap is different</h2>
          </Reveal>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <Reveal className="feature-card" key={f.title} delay={i * 110}>
                <div className="feature-badge" style={{
                  width: 36, height: 36, borderRadius: '50%', background: 'var(--teal-100)',
                  color: 'var(--teal-700)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, marginBottom: 14,
                }}>✓</div>
                <h3 style={{ fontSize: 17, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ color: 'var(--ink-soft)', fontSize: 14.5, lineHeight: 1.6 }}>{f.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal className="section__head">
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
          </Reveal>

          {jobsLoading ? (
            <SkeletonJobList count={3} />
          ) : featuredJobs.length > 0 ? (
            <div className="listings-grid">
              {featuredJobs.map((job, i) => (
                <Reveal key={job._id} delay={i * 90}>
                  <JobCard job={job} />
                </Reveal>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="📭"
              title="No roles posted yet"
              description="Once employers start posting, their listings will show up here."
              action={<a href="/register" className="btn btn--coral">Post the first job</a>}
            />
          )}
        </div>
      </section>

      {studentJobs.length > 0 && (
        <section className="section student-section">
          <div className="container">
            <Reveal className="section__head">
              <div>
                <span className="eyebrow">Just starting out</span>
                <h2 className="section__title">Opportunities for students &amp; graduates</h2>
                <p className="section__desc">
                  Internships, national service placements, graduate trainee programmes and
                  entry-level roles — the openings that don't ask for five years' experience.
                </p>
              </div>
              <a href="/jobs?studentFriendly=true" className="btn btn--outline-teal">
                See all
              </a>
            </Reveal>

            <div className="listings-grid">
              {studentJobs.map((job, i) => (
                <Reveal key={job._id} delay={i * 90}>
                  <JobCard job={job} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Four steps, each covering both audiences rather than splitting into two
          tracks — the flow is genuinely the same shape from either side. */}
      <section className="section" style={{ background: '#fff', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <div className="container">
          <Reveal>
            <span className="eyebrow">How it works</span>
            <h2 className="section__title" style={{ marginTop: 8, marginBottom: 'var(--space-10)' }}>
              From sign-up to hired, in four steps
            </h2>
          </Reveal>

          <div className="how-grid">
            {HOW_IT_WORKS.map((step, i) => (
              <Reveal className="how-step" key={step.title} delay={i * 110}>
                <div className="how-step__num" aria-hidden="true">{i + 1}</div>
                <h3 className="how-step__title">{step.title}</h3>
                <p className="how-step__body">{step.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal>
            <span className="eyebrow">Explore by category</span>
            <h2 className="section__title" style={{ marginTop: 8 }}>
              Open roles across {categories.length - 1} categories
            </h2>
          </Reveal>
          {/* --i drives each pill's stagger delay; see .stagger-children */}
          <Reveal className="category-pills stagger-children">
            {categories.filter((c) => c !== 'All categories').map((c, i) => (
              <a
                key={c}
                href={`/jobs?category=${encodeURIComponent(c)}`}
                className="category-pill"
                style={{ '--i': i }}
              >
                {c}
              </a>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal>
            <span className="eyebrow">What people are saying</span>
            <h2 className="section__title" style={{ marginTop: 8, marginBottom: 32 }}>Trusted by job seekers and employers</h2>
          </Reveal>
          <Testimonials />
          <Reveal>
            <TestimonialForm />
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal className="panel panel--pine" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <h2 style={{ fontSize: 24, marginBottom: 8, color: '#fff' }}>Hiring? List your vacancy today.</h2>
              <p style={{ color: 'rgba(255,255,255,0.8)', maxWidth: '48ch' }}>
                Post a role, manage applicants in one dashboard, and reach job seekers across
                Ghana — no paperwork, no scattered inboxes.
              </p>
            </div>
            <a href="/register" className="btn btn--coral btn--shine">Post a job</a>
          </Reveal>
        </div>
      </section>
    </>
  )
}
