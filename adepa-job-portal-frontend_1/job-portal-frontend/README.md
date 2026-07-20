# Adepa — Job Portal Frontend

Frontend for the final year project *"Designing and Implementation of a Web-Based Job Portal
Application Using the MERN Stack"* (University of Ghana, Dept. of Computer Science).

This is stage 1 of 2: a fully working React UI running on **mock data**, so every page,
flow, and screen is demoable before the Express/MongoDB backend exists. The design concept:
job listings as boarding-pass tickets, homepage hero as a departure board — a portal for
"boarding" your next opportunity.

## Getting started

You'll need [Node.js](https://nodejs.org) 18+ installed.

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

## What's included

- **Home** (`/`) — hero with live-styled departure board, featured listings
- **Browse jobs** (`/jobs`) — searchable, filterable job listings (ticket-style cards)
- **Job details** (`/jobs/:id`) — boarding-pass header, full description, apply button
- **Login / Register** (`/login`, `/register`) — role toggle (job seeker / employer)
- **Job seeker dashboard** (`/dashboard`) — application tracker with status pills
- **Employer dashboard** (`/employer`) — posted jobs + applicants table
- **Post a job** (`/employer/post`) — job posting form

## Mock data & auth

- `src/data/mockJobs.js` holds sample jobs and applications — shaped exactly like the
  MongoDB documents the backend will return, so swapping to real API calls later is a
  small, mechanical change.
- `src/context/AuthContext.jsx` is a **mock** auth layer: any email/password combination
  logs you in as the selected role (job seeker or employer). No real accounts exist yet.
- `src/api/client.js` is a pre-configured Axios instance pointed at
  `http://localhost:5000/api` (override with a `VITE_API_URL` env var) — ready for the
  Express backend once it's built.

Every place that will need a real API call is marked with a `// TODO:` comment
(see `Login.jsx`, `Register.jsx`, `JobDetails.jsx`, `PostJob.jsx`).

## Tech

React 18 · React Router 6 · Axios · Vite · plain CSS (design tokens in `src/styles/tokens.css`)

## Next stage: backend

The next step is the Express + MongoDB API (users, jobs, applications, JWT auth) so these
pages can be switched from mock data to live data. Ask Claude to continue with the backend
whenever you're ready.
