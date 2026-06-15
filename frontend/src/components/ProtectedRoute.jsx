import { Navigate } from 'react-router-dom'

const ProtectedRoute = ({ children, role }) => {
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (role && user.role !== role) {
    // Redirect to appropriate dashboard
    if (user.role === 'admin') return <Navigate to="/admin" replace />
    if (user.role === 'student') return <Navigate to="/student" replace />
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
