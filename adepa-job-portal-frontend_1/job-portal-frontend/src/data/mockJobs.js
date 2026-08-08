// Static dropdown options for filters and the "Post a job" form.
// The backend doesn't expose a "list distinct categories/locations" endpoint,
// so these stay as a fixed, curated list on the frontend. Job and application
// data itself comes entirely from the API — see src/api/jobs.js and
// src/api/applications.js.

export const categories = [
  'All categories',
  'Engineering',
  'IT & Software',
  'Design',
  'Product',
  'Data & Analytics',
  'Marketing',
  'Sales & Business Development',
  'Customer Support',
  'Finance & Accounting',
  'Human Resources',
  'Operations',
  'Legal',
  'Administrative',
  'Healthcare',
  'Education & Training',
  'Manufacturing & Engineering Trades',
  'Construction',
  'Hospitality & Tourism',
  'Retail',
  'Logistics & Supply Chain',
  'Media & Communications',
  'Agriculture',
  'Consulting',
  'Non-profit & NGO',
  'Government & Public Sector',
  'Real Estate',
  'Security',
]

export const jobTypes = [
  'All types',
  'Full-time',
  'Part-time',
  'Contract',
  'Internship',
  'National Service',
  'Graduate trainee',
]

// Optional on a posting. Blank means the employer hasn't classified it, which is
// different from "Mid level" — see the Job schema.
export const experienceLevels = ['Entry level', 'Mid level', 'Senior level']

// Ghanaian university levels, plus the two stages either side of graduating
export const studentLevels = [
  'Level 100',
  'Level 200',
  'Level 300',
  'Level 400',
  'Postgraduate',
  'Recent graduate',
  'National Service',
]
export const locations = ['All locations', 'Accra, GH', 'Tema, GH', 'Kumasi, GH', 'Takoradi, GH', 'Remote (Ghana)']