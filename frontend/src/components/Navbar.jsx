import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { FiShield, FiLogOut, FiUser } from 'react-icons/fi'

const Navbar = () => {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

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
    <nav className="flex items-center justify-between py-4 px-8 bg-bg-glass backdrop-blur-xl border-b border-[rgba(79,125,243,0.15)] sticky top-0 z-50">
      <div 
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => navigate(user.role === 'admin' ? '/admin' : '/student')}
      >
        <div className="w-10 h-10 rounded-xl bg-[linear-gradient(135deg,#4f7df3,#8b5cf6)] flex items-center justify-center">
          <FiShield size={20} color="white" />
        </div>
        <span className="text-xl font-bold bg-[linear-gradient(135deg,#4f7df3,#8b5cf6)] bg-clip-text text-transparent">
          ExamGuard
        </span>
      </div>

      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2 py-2 px-4 bg-bg-secondary rounded-md border border-[rgba(79,125,243,0.15)]">
          <FiUser size={16} className="text-accent-blue" />
          <span className="text-sm text-text-secondary">
            {user.name || 'User'}
          </span>
          <span className={`text-[0.7rem] py-0.5 px-2 rounded-full text-white font-semibold uppercase ${
            user.role === 'admin' ? 'bg-[linear-gradient(135deg,#ef4444,#ec4899)]' : 'bg-[linear-gradient(135deg,#06d6a0,#22d3ee)]'
          }`}>
            {user.role}
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 py-2 px-4 bg-transparent border border-red-500/30 rounded-md text-accent-red cursor-pointer text-sm font-medium font-sans transition-all duration-300 hover:bg-red-500/10 hover:border-accent-red"
        >
          <FiLogOut size={16} />
          Logout
        </button>
      </div>
    </nav>
  )
}

export default Navbar
