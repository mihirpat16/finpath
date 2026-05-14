import { Navigate } from 'react-router-dom'

// Auth is now name-only (anonymous). There is no separate login page.
// Send any /auth/login visits to the start page.
export default function LoginPage() {
  return <Navigate to="/auth/register" replace />
}
