// Static dropdown options for filters and the "Post a job" form.
// The backend doesn't expose a "list distinct categories/locations" endpoint,
// so these stay as a fixed, curated list on the frontend. Job and application
// data itself now comes entirely from the API — see src/api/jobs.js and
// src/api/applications.js.

export const categories = ['All categories', 'Engineering', 'Design', 'Product', 'Data']
export const jobTypes = ['All types', 'Full-time', 'Part-time', 'Contract', 'Internship']
export const locations = ['All locations', 'Accra, GH', 'Tema, GH', 'Remote (Ghana)']