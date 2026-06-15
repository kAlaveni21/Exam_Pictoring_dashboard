import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { FiUser, FiMail, FiLock, FiShield, FiEye, FiEyeOff } from 'react-icons/fi'

const RegisterPage = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await axios.post('http://localhost:4000/api/auth/register', form)
      alert('Registration successful! Please login.')
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5">
      <div className="animate-fade-in-up w-full max-w-[440px]">
        {/* Logo */}
        <div className="text-center mb-9">
          <div className="w-[72px] h-[72px] rounded-xl bg-[linear-gradient(135deg,#4f7df3,#8b5cf6)] flex items-center justify-center mx-auto mb-5 shadow-[0_8px_30px_rgba(79,125,243,0.3)]">
            <FiShield size={36} color="white" />
          </div>
          <h1 className="text-3xl font-extrabold mb-2">
            <span className="gradient-text">Create Account</span>
          </h1>
          <p className="text-text-secondary text-[0.95rem]">
            Join the exam proctoring platform
          </p>
        </div>

        {/* Form */}
        <div className="glass-card p-9">
          {error && (
            <div className="py-3 px-4 bg-red-500/10 border border-red-500/30 rounded-md text-accent-red text-[0.85rem] mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-[0.85rem] font-medium text-text-secondary mb-2">Full Name</label>
              <div className="relative">
                <FiUser size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  className="input-field !pl-11"
                  type="text"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-[0.85rem] font-medium text-text-secondary mb-2">Email Address</label>
              <div className="relative">
                <FiMail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  className="input-field !pl-11"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-[0.85rem] font-medium text-text-secondary mb-2">Password</label>
              <div className="relative">
                <FiLock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  className="input-field !pl-11 !pr-11"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-transparent border-none text-text-muted cursor-pointer p-1"
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            <div className="mb-7 mt-2">
              <label className="block text-[0.85rem] font-medium text-text-secondary mb-2">Role</label>
              <div className="flex gap-3">
                {['student', 'admin'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setForm({ ...form, role })}
                    className={`flex-1 py-3 rounded-md border font-semibold text-[0.9rem] capitalize font-sans transition-all duration-300 ${
                      form.role === role 
                        ? 'border-accent-blue bg-[rgba(79,125,243,0.15)] text-accent-blue' 
                        : 'border-[rgba(79,125,243,0.15)] bg-bg-secondary text-text-secondary'
                    }`}
                  >
                    {role === 'student' ? '🎓 ' : '👑 '}{role}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full !py-3.5 !text-base"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center mt-6 text-[0.88rem] text-text-secondary">
            Already have an account?{' '}
            <Link to="/login" className="text-accent-blue font-semibold no-underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
