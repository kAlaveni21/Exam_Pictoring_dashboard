import { useEffect, useState } from 'react'
import axios from 'axios'
import AdminShell from '../components/admin/AdminShell'
import { SectionHeader, StatusPill } from '../components/admin/AdminWidgets'
import { FiEdit3, FiSave, FiUser, FiX } from 'react-icons/fi'

const defaultTeacher = {
  name: 'Prof. Smith',
  email: 'teacher@example.com',
  department: 'CSE',
  designation: 'Assistant Professor',
  phone: '',
  profilePhoto: '',
}

const getInitials = (name = 'Teacher') => name
  .split(' ')
  .filter(Boolean)
  .map(part => part[0])
  .join('')
  .slice(0, 2)
  .toUpperCase()

const ProfilePage = () => {
  const token = localStorage.getItem('token')
  const [teacher, setTeacher] = useState(() => ({ ...defaultTeacher, ...JSON.parse(localStorage.getItem('user') || '{}') }))
  const [form, setForm] = useState(teacher)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get('http://localhost:4000/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const nextTeacher = { ...defaultTeacher, ...res.data }
        setTeacher(nextTeacher)
        setForm(nextTeacher)
        localStorage.setItem('user', JSON.stringify(nextTeacher))
      } catch (err) {
        console.error('Error fetching profile:', err)
      }
    }

    fetchProfile()
  }, [token])

  const handleSave = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const res = await axios.put('http://localhost:4000/api/auth/me', form, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const nextTeacher = { ...defaultTeacher, ...(res.data.user || form) }
      setTeacher(nextTeacher)
      setForm(nextTeacher)
      localStorage.setItem('user', JSON.stringify(nextTeacher))
      setEditing(false)
      setMessage('Profile updated successfully.')
    } catch (err) {
      setMessage(err.response?.data?.message || 'Unable to update profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminShell>
      <SectionHeader
        icon={FiUser}
        title="Profile"
        subtitle="View and update teacher information used across the admin dashboard."
        action={
          <button
            type="button"
            onClick={() => {
              setForm(teacher)
              setEditing(!editing)
              setMessage('')
            }}
            className="inline-flex items-center gap-2 rounded-md border border-[rgba(79,125,243,0.25)] bg-bg-secondary px-4 py-2.5 text-sm font-semibold text-accent-blue"
          >
            {editing ? <FiX size={16} /> : <FiEdit3 size={16} />}
            {editing ? 'Cancel' : 'Edit Profile'}
          </button>
        }
      />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="glass-card p-6">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg bg-[linear-gradient(135deg,#4f7df3,#06d6a0)]">
              {teacher.profilePhoto ? (
                <img src={teacher.profilePhoto} alt={teacher.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-3xl font-extrabold text-white">{getInitials(teacher.name)}</span>
              )}
            </div>
            <h2 className="mt-4 text-xl font-extrabold">{teacher.name}</h2>
            <p className="mt-1 text-sm text-text-secondary">{teacher.email}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <StatusPill tone="cyan">{teacher.department || 'CSE'}</StatusPill>
              <StatusPill>{teacher.designation || 'Teacher'}</StatusPill>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="glass-card p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
              ['name', 'Full Name'],
              ['email', 'Email'],
              ['department', 'Department'],
              ['designation', 'Designation'],
              ['phone', 'Phone'],
              ['profilePhoto', 'Profile Photo URL'],
            ].map(([field, label]) => (
              <div key={field} className={field === 'profilePhoto' ? 'md:col-span-2' : ''}>
                <label className="mb-2 block text-sm text-text-secondary">{label}</label>
                <input
                  type={field === 'email' ? 'email' : 'text'}
                  value={form[field] || ''}
                  disabled={!editing || field === 'email'}
                  onChange={(event) => setForm(prev => ({ ...prev, [field]: event.target.value }))}
                  className="input-field disabled:cursor-not-allowed disabled:opacity-70"
                />
              </div>
            ))}
          </div>

          {message && <p className="mt-4 text-sm text-accent-cyan">{message}</p>}

          {editing && (
            <div className="mt-6 flex justify-end">
              <button type="submit" disabled={saving} className="btn-primary inline-flex items-center gap-2">
                <FiSave size={17} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </form>
      </section>
    </AdminShell>
  )
}

export default ProfilePage
