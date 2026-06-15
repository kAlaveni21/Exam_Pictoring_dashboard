import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { FiMail, FiLock, FiShield, FiEye, FiEyeOff } from 'react-icons/fi'

const LoginPage = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await axios.post('http://localhost:4000/api/auth/login', form)
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))

      if (res.data.user.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/student')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5">
      <div className="animate-fade-in-up w-full max-w-[440px]">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-[72px] h-[72px] rounded-xl bg-[linear-gradient(135deg,#4f7df3,#8b5cf6)] flex items-center justify-center mx-auto mb-5 shadow-[0_8px_30px_rgba(79,125,243,0.3)]">
            <FiShield size={36} color="white" />
          </div>
          <h1 className="text-3xl font-extrabold mb-2">
            <span className="gradient-text">ExamGuard</span>
          </h1>
          <p className="text-text-secondary text-[0.95rem]">
            Secure exam proctoring system
          </p>
        </div>

        {/* Form Card */}
        <div className="glass-card p-9">
          <h2 className="text-[1.4rem] font-bold mb-2">Welcome back</h2>
          <p className="text-text-secondary text-[0.88rem] mb-7">
            Sign in to continue to your dashboard
          </p>

          {error && (
            <div className="py-3 px-4 bg-red-500/10 border border-red-500/30 rounded-md text-accent-red text-[0.85rem] mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-5">
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

            <div className="mb-7">
              <label className="block text-[0.85rem] font-medium text-text-secondary mb-2">Password</label>
              <div className="relative">
                <FiLock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  className="input-field !pl-11 !pr-11"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
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

            <button
              type="submit"
              className="btn-primary w-full !py-3.5 !text-base"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center mt-6 text-[0.88rem] text-text-secondary">
            Don't have an account?{' '}
            <Link to="/register" className="text-accent-blue font-semibold no-underline">
              Sign Up
            </Link>
          </p>
        </div>

        {/* Demo Credentials */}
        <div className="mt-5 py-4 px-5 bg-accent-cyan/5 border border-accent-cyan/20 rounded-md text-[0.82rem] text-text-secondary">
          <p className="font-semibold text-accent-cyan mb-2">
            🧪 Demo Credentials
          </p>
          <p>Admin: <code className="text-text-primary">admin@exam.com</code> / <code className="text-text-primary">admin123</code></p>
          <p>Student: <code className="text-text-primary">student@exam.com</code> / <code className="text-text-primary">student123</code></p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
