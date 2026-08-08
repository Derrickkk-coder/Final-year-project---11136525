// Where each role belongs after logging in.
//
// Kept in one place because getting it wrong is silent: sending an admin to
// /dashboard doesn't error, it just hits ProtectedRoute's role check and bounces
// them to the homepage, which reads as a broken login rather than a bad route.
const ROLE_HOME = {
  seeker: '/dashboard',
  employer: '/employer',
  admin: '/admin',
}

export default function roleHome(role) {
  return ROLE_HOME[role] || '/'
}
