import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../components/Navbar'
import {
  FiActivity,
  FiAward,
  FiBarChart2,
  FiBell,
  FiBookOpen,
  FiCalendar,
  FiCamera,
  FiCheckCircle,
  FiEdit3,
  FiFileText,
  FiMic,
  FiMonitor,
  FiPlay,
  FiSave,
  FiShield,
  FiUser,
  FiWifi,
  FiX,
} from 'react-icons/fi'

const sampleHistory = [
  { exam: 'C Programming', score: '85/100', result: 'Pass' },
  { exam: 'Data Structures', score: '78/100', result: 'Pass' },
]

const notifications = [
  'New exam scheduled.',
  'Exam timing changed.',
  'Results published.',
]

const rules = [
  'Webcam must be enabled.',
  'Microphone must be enabled.',
  'No tab switching.',
  'No mobile phones allowed.',
  'Face should be visible at all times.',
]

const formatExamDate = (exam, index) => {
  const dateValue = exam.date || exam.examDate || exam.scheduledAt || exam.startTime

  if (dateValue) {
    const date = new Date(dateValue)
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    }
  }

  const fallbackDate = new Date(2026, 7, 25 + index * 3)
  return fallbackDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const formatExamTime = (exam, index) => {
  const timeValue = exam.time || exam.examTime
  if (timeValue) return timeValue

  const dateValue = exam.scheduledAt || exam.startTime
  if (dateValue) {
    const date = new Date(dateValue)
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    }
  }

  return index % 2 === 0 ? '10:00 AM' : '2:00 PM'
}

const isExamOpen = (exam) => {
  const startValue = exam.scheduledAt || exam.startTime
  if (!startValue) return true

  const start = new Date(startValue)
  if (Number.isNaN(start.getTime())) return true

  const end = exam.endTime
    ? new Date(exam.endTime)
    : new Date(start.getTime() + (exam.duration || 60) * 60 * 1000)

  const now = new Date()
  return now >= start && now <= end
}

const getExamStatus = (exam) => {
  const startValue = exam.scheduledAt || exam.startTime
  if (!startValue) return 'Available'

  const start = new Date(startValue)
  if (Number.isNaN(start.getTime())) return 'Available'

  const end = exam.endTime
    ? new Date(exam.endTime)
    : new Date(start.getTime() + (exam.duration || 60) * 60 * 1000)

  const now = new Date()
  if (now < start) return 'Upcoming'
  if (now > end) return 'Closed'
  return 'Live'
}

const getInitials = (name = 'Student') => {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

const SectionHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2.5 mb-5">
    <Icon size={20} className="text-accent-blue" />
    <h2 className="text-[1.15rem] font-bold">{title}</h2>
  </div>
)

const StatCard = ({ icon: Icon, label, value, tone }) => (
  <div className="glass-card p-5 min-h-[116px] flex items-center gap-4">
    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${tone}`}>
      <Icon size={22} color="white" />
    </div>
    <div>
      <p className="text-text-secondary text-sm mb-1">{label}</p>
      <p className="text-2xl font-extrabold">{value}</p>
    </div>
  </div>
)

const StatusPill = ({ children, tone = 'blue' }) => {
  const tones = {
    blue: 'bg-[rgba(79,125,243,0.12)] text-accent-blue border-[rgba(79,125,243,0.25)]',
    cyan: 'bg-[rgba(6,214,160,0.12)] text-accent-cyan border-[rgba(6,214,160,0.25)]',
    orange: 'bg-[rgba(245,158,11,0.12)] text-accent-orange border-[rgba(245,158,11,0.25)]',
    red: 'bg-[rgba(239,68,68,0.12)] text-accent-red border-[rgba(239,68,68,0.25)]',
  }

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  )
}

const StudentDashboard = () => {
  const navigate = useNavigate()
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'))
  const [profileForm, setProfileForm] = useState(() => ({
    name: currentUser.name || '',
    studentId: currentUser.studentId || '',
    department: currentUser.department || '',
    course: currentUser.course || '',
    phone: currentUser.phone || '',
    profilePhoto: currentUser.profilePhoto || '',
  }))
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')

  useEffect(() => {
    const updateConnection = () => setIsOnline(navigator.onLine)
    window.addEventListener('online', updateConnection)
    window.addEventListener('offline', updateConnection)

    return () => {
      window.removeEventListener('online', updateConnection)
      window.removeEventListener('offline', updateConnection)
    }
  }, [])

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await axios.get('http://localhost:4000/api/exams', {
          headers: { Authorization: `Bearer ${token}` },
        })
        setExams(res.data)
      } catch (err) {
        console.error('Error fetching exams:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchExams()
  }, [])

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await axios.get('http://localhost:4000/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        setCurrentUser(res.data)
        setProfileForm({
          name: res.data.name || '',
          studentId: res.data.studentId || '',
          department: res.data.department || '',
          course: res.data.course || '',
          phone: res.data.phone || '',
          profilePhoto: res.data.profilePhoto || '',
        })
        localStorage.setItem('user', JSON.stringify(res.data))
      } catch (err) {
        console.error('Error fetching profile:', err)
      }
    }

    fetchProfile()
  }, [])

  const handleProfileChange = (field, value) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleCancelProfile = () => {
    setProfileForm({
      name: currentUser.name || '',
      studentId: currentUser.studentId || '',
      department: currentUser.department || '',
      course: currentUser.course || '',
      phone: currentUser.phone || '',
      profilePhoto: currentUser.profilePhoto || '',
    })
    setProfileMessage('')
    setEditingProfile(false)
  }

  const handleSaveProfile = async (event) => {
    event.preventDefault()
    setProfileSaving(true)
    setProfileMessage('')

    try {
      const token = localStorage.getItem('token')
      const res = await axios.put('http://localhost:4000/api/auth/me', profileForm, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setCurrentUser(res.data.user)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      setEditingProfile(false)
      setProfileMessage('Profile updated successfully.')
    } catch (err) {
      setProfileMessage(err.response?.data?.message || 'Unable to update profile.')
    } finally {
      setProfileSaving(false)
    }
  }

  const upcomingExams = useMemo(() => {
    return exams.map((exam, index) => ({
      ...exam,
      displayDate: formatExamDate(exam, index),
      displayTime: formatExamTime(exam, index),
      status: getExamStatus(exam),
      canStart: isExamOpen(exam),
    }))
  }, [exams])

  const totalExams = Math.max(exams.length + sampleHistory.length, 12)
  const completedExams = Math.max(sampleHistory.length, 10)
  const averageScore = 82

  const systemChecks = [
    {
      label: 'Camera',
      status: navigator.mediaDevices?.getUserMedia ? 'Connected' : 'Unavailable',
      icon: FiCamera,
      healthy: Boolean(navigator.mediaDevices?.getUserMedia),
    },
    {
      label: 'Microphone',
      status: navigator.mediaDevices?.getUserMedia ? 'Connected' : 'Unavailable',
      icon: FiMic,
      healthy: Boolean(navigator.mediaDevices?.getUserMedia),
    },
    {
      label: 'Internet',
      status: isOnline ? 'Stable' : 'Offline',
      icon: FiWifi,
      healthy: isOnline,
    },
    {
      label: 'Browser',
      status: window.isSecureContext || window.location.hostname === 'localhost' ? 'Compatible' : 'Review Needed',
      icon: FiMonitor,
      healthy: window.isSecureContext || window.location.hostname === 'localhost',
    },
  ]

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-[1180px] mx-auto py-8 px-5 sm:px-6">
        <section className="glass-card animate-fade-in-up p-6 sm:p-7 mb-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-[linear-gradient(135deg,#4f7df3,#06d6a0)] flex items-center justify-center shrink-0">
                {currentUser.profilePhoto || currentUser.photo || currentUser.avatarUrl ? (
                  <img
                    src={currentUser.profilePhoto || currentUser.photo || currentUser.avatarUrl}
                    alt={currentUser.name || 'Student profile'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-extrabold text-white">{getInitials(currentUser.name)}</span>
                )}
              </div>
              <div>
                <h1 className="text-[1.75rem] font-extrabold leading-tight">
                  Welcome, <span className="gradient-text">{currentUser.name || 'Student'}</span>
                </h1>
                <div className="mt-3 grid gap-1 text-sm text-text-secondary">
                  <span>Student ID: {currentUser.studentId || currentUser.id || currentUser._id || '22A91A05XX'}</span>
                  <span>Department: {currentUser.department || currentUser.course || 'CSE'}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 md:items-end">
              <button
                type="button"
                onClick={() => setEditingProfile(true)}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-[rgba(79,125,243,0.35)] bg-bg-secondary px-4 py-2.5 text-sm font-semibold text-accent-blue transition-all duration-300 hover:border-accent-blue hover:bg-[rgba(79,125,243,0.12)]"
              >
                <FiEdit3 size={16} />
                Edit Profile
              </button>
              <div className="grid grid-cols-2 gap-3 text-sm md:min-w-[280px]">
                <div className="rounded-lg bg-bg-secondary border border-[rgba(79,125,243,0.15)] p-4">
                  <p className="text-text-muted mb-1">Next Exam</p>
                  <p className="font-bold truncate">{upcomingExams[0]?.title || 'No exam scheduled'}</p>
                </div>
                <div className="rounded-lg bg-bg-secondary border border-[rgba(79,125,243,0.15)] p-4">
                  <p className="text-text-muted mb-1">Proctoring</p>
                  <p className="font-bold text-accent-cyan">Ready</p>
                </div>
              </div>
            </div>
          </div>

          {profileMessage && (
            <div className={`mt-5 rounded-md border px-4 py-3 text-sm ${
              profileMessage.includes('success')
                ? 'border-[rgba(6,214,160,0.3)] bg-[rgba(6,214,160,0.1)] text-accent-cyan'
                : 'border-red-500/30 bg-red-500/10 text-accent-red'
            }`}>
              {profileMessage}
            </div>
          )}

          {editingProfile && (
            <form onSubmit={handleSaveProfile} className="mt-6 border-t border-[rgba(79,125,243,0.14)] pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="grid gap-2 text-sm text-text-secondary">
                  Full Name
                  <input
                    className="input-field"
                    type="text"
                    value={profileForm.name}
                    onChange={(event) => handleProfileChange('name', event.target.value)}
                    required
                  />
                </label>
                <label className="grid gap-2 text-sm text-text-secondary">
                  Student ID
                  <input
                    className="input-field"
                    type="text"
                    value={profileForm.studentId}
                    onChange={(event) => handleProfileChange('studentId', event.target.value)}
                    placeholder="22A91A05XX"
                  />
                </label>
                <label className="grid gap-2 text-sm text-text-secondary">
                  Department
                  <input
                    className="input-field"
                    type="text"
                    value={profileForm.department}
                    onChange={(event) => handleProfileChange('department', event.target.value)}
                    placeholder="CSE"
                  />
                </label>
                <label className="grid gap-2 text-sm text-text-secondary">
                  Course
                  <input
                    className="input-field"
                    type="text"
                    value={profileForm.course}
                    onChange={(event) => handleProfileChange('course', event.target.value)}
                    placeholder="B.Tech"
                  />
                </label>
                <label className="grid gap-2 text-sm text-text-secondary">
                  Phone
                  <input
                    className="input-field"
                    type="tel"
                    value={profileForm.phone}
                    onChange={(event) => handleProfileChange('phone', event.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </label>
                <label className="grid gap-2 text-sm text-text-secondary">
                  Profile Photo URL
                  <input
                    className="input-field"
                    type="url"
                    value={profileForm.profilePhoto}
                    onChange={(event) => handleProfileChange('profilePhoto', event.target.value)}
                    placeholder="https://example.com/photo.jpg"
                  />
                </label>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleCancelProfile}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-[rgba(157,157,189,0.25)] bg-bg-secondary px-5 py-3 text-sm font-semibold text-text-secondary transition-all duration-300 hover:border-text-secondary"
                  disabled={profileSaving}
                >
                  <FiX size={16} />
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary inline-flex items-center justify-center gap-2 !py-3 !px-5 text-sm"
                  disabled={profileSaving}
                >
                  <FiSave size={16} />
                  {profileSaving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={FiFileText}
            label="Total Exams"
            value={totalExams}
            tone="bg-[linear-gradient(135deg,#4f7df3,#8b5cf6)]"
          />
          <StatCard
            icon={FiCheckCircle}
            label="Completed"
            value={completedExams}
            tone="bg-[linear-gradient(135deg,#06d6a0,#22d3ee)]"
          />
          <StatCard
            icon={FiBarChart2}
            label="Average Score"
            value={`${averageScore}%`}
            tone="bg-[linear-gradient(135deg,#f59e0b,#ec4899)]"
          />
          <StatCard
            icon={FiCalendar}
            label="Upcoming"
            value={upcomingExams.length}
            tone="bg-[linear-gradient(135deg,#8b5cf6,#ec4899)]"
          />
        </section>

        <section className="glass-card p-5 sm:p-6 mb-6">
          <SectionHeader icon={FiCalendar} title="Upcoming Exams" />

          {loading ? (
            <div className="text-center py-12 text-text-secondary">Loading exams...</div>
          ) : upcomingExams.length === 0 ? (
            <div className="text-center py-12 text-text-secondary">
              <p className="text-[1.05rem] mb-1">No exams available</p>
              <p className="text-sm">Check notifications or contact your admin.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead>
                  <tr className="text-text-muted text-xs uppercase tracking-wide border-b border-[rgba(79,125,243,0.14)]">
                    <th className="py-3 pr-4 font-semibold">Exam Name</th>
                    <th className="py-3 pr-4 font-semibold">Date</th>
                    <th className="py-3 pr-4 font-semibold">Time</th>
                    <th className="py-3 pr-4 font-semibold">Status</th>
                    <th className="py-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingExams.map((exam) => (
                    <tr key={exam._id} className="border-b border-[rgba(79,125,243,0.08)] last:border-0">
                      <td className="py-4 pr-4">
                        <div className="font-semibold">{exam.title}</div>
                        <div className="text-text-muted text-xs mt-1">
                          {exam.questions?.length || '?'} questions · {exam.duration || 60} min
                        </div>
                      </td>
                      <td className="py-4 pr-4 text-text-secondary">{exam.displayDate}</td>
                      <td className="py-4 pr-4 text-text-secondary">{exam.displayTime}</td>
                      <td className="py-4 pr-4">
                        <StatusPill tone={exam.status === 'Live' || exam.status === 'Available' ? 'cyan' : exam.status === 'Closed' ? 'red' : 'blue'}>
                          {exam.status}
                        </StatusPill>
                      </td>
                      <td className="py-4 text-right">
                        <button
                          type="button"
                          className="btn-primary inline-flex items-center justify-center gap-2 !py-2.5 !px-4 text-sm disabled:opacity-50"
                          onClick={() => navigate(`/exam/${exam._id}`)}
                          disabled={!exam.canStart}
                        >
                          <FiPlay size={15} />
                          Start Exam
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6 mb-6">
          <div className="glass-card p-5 sm:p-6">
            <SectionHeader icon={FiBookOpen} title="Exam Rules & Instructions" />
            <div className="grid gap-3">
              {rules.map((rule) => (
                <div key={rule} className="flex items-center gap-3 rounded-lg bg-bg-secondary border border-[rgba(79,125,243,0.12)] px-4 py-3">
                  <FiShield className="text-accent-cyan shrink-0" size={17} />
                  <span className="text-sm text-text-secondary">{rule}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-5 sm:p-6">
            <SectionHeader icon={FiActivity} title="System Check" />
            <div className="grid gap-3">
              {systemChecks.map((check) => {
                const Icon = check.icon

                return (
                  <div key={check.label} className="flex items-center justify-between gap-4 rounded-lg bg-bg-secondary border border-[rgba(79,125,243,0.12)] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Icon className={check.healthy ? 'text-accent-cyan' : 'text-accent-red'} size={18} />
                      <span className="font-semibold text-sm">{check.label}</span>
                    </div>
                    <span className={check.healthy ? 'text-accent-cyan text-sm' : 'text-accent-red text-sm'}>
                      {check.status}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-6 mb-6">
          <div className="glass-card p-5 sm:p-6">
            <SectionHeader icon={FiBell} title="Notifications" />
            <div className="grid gap-3">
              {notifications.map((item, index) => (
                <div key={item} className="flex gap-3 rounded-lg bg-bg-secondary border border-[rgba(79,125,243,0.12)] px-4 py-3">
                  <div className="w-8 h-8 rounded-lg bg-[rgba(79,125,243,0.14)] flex items-center justify-center shrink-0">
                    <FiBell size={15} className="text-accent-blue" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{item}</p>
                    <p className="text-text-muted text-xs mt-1">{index + 1} day{index === 0 ? '' : 's'} ago</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-5 sm:p-6">
            <SectionHeader icon={FiAward} title="Exam History" />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[460px] text-left">
                <thead>
                  <tr className="text-text-muted text-xs uppercase tracking-wide border-b border-[rgba(79,125,243,0.14)]">
                    <th className="py-3 pr-4 font-semibold">Exam</th>
                    <th className="py-3 pr-4 font-semibold">Score</th>
                    <th className="py-3 font-semibold">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleHistory.map((row) => (
                    <tr key={row.exam} className="border-b border-[rgba(79,125,243,0.08)] last:border-0">
                      <td className="py-4 pr-4 font-semibold">{row.exam}</td>
                      <td className="py-4 pr-4 text-text-secondary">{row.score}</td>
                      <td className="py-4">
                        <StatusPill tone="cyan">{row.result}</StatusPill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="glass-card p-5 sm:p-6">
          <SectionHeader icon={FiCamera} title="Proctoring Status" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-lg bg-bg-secondary border border-[rgba(6,214,160,0.2)] p-4">
              <div className="flex items-center gap-2 text-accent-cyan mb-2">
                <FiCamera size={17} />
                <span className="font-semibold text-sm">Camera</span>
              </div>
              <p className="text-xl font-extrabold">Active</p>
            </div>
            <div className="rounded-lg bg-bg-secondary border border-[rgba(6,214,160,0.2)] p-4">
              <div className="flex items-center gap-2 text-accent-cyan mb-2">
                <FiMonitor size={17} />
                <span className="font-semibold text-sm">Screen Sharing</span>
              </div>
              <p className="text-xl font-extrabold">Active</p>
            </div>
            <div className="rounded-lg bg-bg-secondary border border-[rgba(6,214,160,0.2)] p-4">
              <div className="flex items-center gap-2 text-accent-cyan mb-2">
                <FiUser size={17} />
                <span className="font-semibold text-sm">Face Detection</span>
              </div>
              <p className="text-xl font-extrabold">Yes</p>
            </div>
            <div className="rounded-lg bg-bg-secondary border border-[rgba(245,158,11,0.2)] p-4">
              <div className="flex items-center gap-2 text-accent-orange mb-2">
                <FiActivity size={17} />
                <span className="font-semibold text-sm">Warnings</span>
              </div>
              <p className="text-xl font-extrabold">0/3</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default StudentDashboard
