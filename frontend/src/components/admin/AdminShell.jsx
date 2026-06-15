import { NavLink, useNavigate } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../Navbar'
import { FiLogOut } from 'react-icons/fi'
import { adminSidebarItems } from './adminNavigation'

const AdminSidebar = () => {
  const navigate = useNavigate()

  const handleLogout = async () => {
    const token = localStorage.getItem('token')
    if (token) {
      await axios.post('http://localhost:4000/api/auth/logout', {}, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {})
    }
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <aside className="glass-card h-fit p-4 lg:sticky lg:top-24">
      <div className="mb-4 px-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Teacher Menu</div>
      <div className="grid gap-1">
        {adminSidebarItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={label}
            to={path}
            end={path === '/admin'}
            className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-semibold transition-all duration-200 ${
              isActive
                ? 'bg-[rgba(79,125,243,0.16)] text-text-primary'
                : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
            }`}
          >
            <Icon size={16} className="shrink-0 text-accent-blue" />
            {label}
          </NavLink>
        ))}

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-semibold text-text-secondary transition-all duration-200 hover:bg-bg-secondary hover:text-text-primary"
        >
          <FiLogOut size={16} className="shrink-0 text-accent-blue" />
          Logout
        </button>
      </div>
    </aside>
  )
}

const AdminShell = ({ children }) => (
  <div className="min-h-screen">
    <Navbar />
    <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-6 px-5 py-6 lg:grid-cols-[230px_1fr]">
      <AdminSidebar />
      <main className="min-w-0">{children}</main>
    </div>
  </div>
)

export default AdminShell
