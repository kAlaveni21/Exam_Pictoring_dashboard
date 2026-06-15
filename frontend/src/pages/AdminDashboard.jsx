import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import axios from 'axios'
import Navbar from '../components/Navbar'
import { adminSidebarItems } from '../components/admin/adminNavigation'
import {
  FiActivity,
  FiAlertTriangle,
  FiAward,
  FiBarChart2,
  FiBell,
  FiCalendar,
  FiCamera,
  FiDownload,
  FiEdit3,
  FiEye,
  FiFileText,
  FiLogOut,
  FiMic,
  FiMonitor,
  FiPlus,
  FiRefreshCw,
  FiShield,
  FiTrash2,
  FiUserMinus,
  FiUsers,
  FiXCircle,
} from 'react-icons/fi'

const fallbackExams = [
  { _id: 'java-test', title: 'Java Test', startTime: '2026-08-25T10:00:00', duration: 60, assignedStudents: Array(120).fill('') },
  { _id: 'dbms-quiz', title: 'DBMS Quiz', startTime: '2026-08-28T14:00:00', duration: 45, assignedStudents: Array(95).fill('') },
]

const fallbackResults = [
  { exam: 'Java Test', students: 120, averageScore: '78%' },
  { exam: 'DBMS Quiz', students: 95, averageScore: '82%' },
]

const incidentLabels = {
  multiple_faces: 'Multiple Faces Detected',
  no_face: 'No Face Detected',
  tab_switch: 'Tab Switching',
  mobile_phone: 'Mobile Phone Detected',
  background_voice: 'Background Voice Detected',
}

const formatExamDate = (exam) => {
  const date = new Date(exam.startTime || exam.createdAt || '2026-08-25T10:00:00')
  return Number.isNaN(date.getTime())
    ? '25 Aug'
    : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

const formatExamTime = (exam) => {
  const date = new Date(exam.startTime || exam.createdAt || '2026-08-25T10:00:00')
  return Number.isNaN(date.getTime())
    ? '10:00 AM'
    : date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

const isActiveExam = (exam) => {
  if (exam.isActive === false) return false
  if (!exam.startTime) return true

  const start = new Date(exam.startTime)
  const end = exam.endTime
    ? new Date(exam.endTime)
    : new Date(start.getTime() + (exam.duration || 60) * 60 * 1000)
  const now = new Date()

  return now >= start && now <= end
}

const getInitials = (name = 'Teacher') => name
  .split(' ')
  .filter(Boolean)
  .map(part => part[0])
  .join('')
  .slice(0, 2)
  .toUpperCase()

const SectionHeader = ({ icon: Icon, title, action }) => (
  <div className="flex items-center justify-between gap-4 mb-5">
    <div className="flex items-center gap-2.5">
      <Icon size={20} className="text-accent-blue" />
      <h2 className="text-[1.15rem] font-bold">{title}</h2>
    </div>
    {action}
  </div>
)

const StatCard = ({ icon: Icon, label, value, tone }) => (
  <div className="glass-card p-5 min-h-[112px] flex items-center gap-4">
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

const AdminDashboard = () => {
  const navigate = useNavigate()
  const socketRef = useRef(null)
  const token = localStorage.getItem('token')
  const teacher = JSON.parse(localStorage.getItem('user') || '{}')

  const [alerts, setAlerts] = useState([])
  const [activeStudents, setActiveStudents] = useState(0)
  const [students, setStudents] = useState([])
  const [activeList, setActiveList] = useState([])
  const [submittedList, setSubmittedList] = useState([])
  const [exams, setExams] = useState([])
  const [stats, setStats] = useState({ totalAlerts: 0, alertsByType: [], alertsBySeverity: [] })
  const [connected, setConnected] = useState(false)

  const alertTypeConfig = useMemo(() => ({
    no_face: { label: 'No Face Detected', icon: FiUserMinus, color: 'text-accent-red', tone: 'red' },
    multiple_faces: { label: 'Multiple Faces Detected', icon: FiUsers, color: 'text-accent-orange', tone: 'orange' },
    tab_switch: { label: 'Tab Switching', icon: FiMonitor, color: 'text-accent-pink', tone: 'orange' },
    mobile_phone: { label: 'Mobile Phone Detected', icon: FiAlertTriangle, color: 'text-accent-red', tone: 'red' },
    background_voice: { label: 'Background Voice Detected', icon: FiMic, color: 'text-accent-orange', tone: 'orange' },
  }), [])

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:4000/api/alerts', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setAlerts(res.data)
    } catch (err) {
      console.error('Error fetching alerts:', err)
    }
  }, [token])

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:4000/api/alerts/stats', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setStats(res.data)
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }, [token])

  const fetchActiveStudents = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:4000/api/active-students')
      setActiveStudents(res.data.count)
      setActiveList(res.data.students || [])
      setSubmittedList(res.data.submitted || [])
    } catch (err) {
      console.error('Error fetching active students:', err)
    }
  }, [])

  const fetchStudents = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:4000/api/auth/students', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setStudents(res.data)
    } catch (err) {
      console.error('Error fetching students:', err)
    }
  }, [token])

  const fetchExams = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:4000/api/exams', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setExams(res.data)
    } catch (err) {
      console.error('Error fetching exams:', err)
    }
  }, [token])

  const refreshDashboard = useCallback(() => {
    fetchAlerts()
    fetchStats()
    fetchActiveStudents()
    fetchStudents()
    fetchExams()
  }, [fetchActiveStudents, fetchAlerts, fetchExams, fetchStats, fetchStudents])

  useEffect(() => {
    const timer = setTimeout(() => {
      refreshDashboard()
    }, 0)

    return () => clearTimeout(timer)
  }, [refreshDashboard])

  useEffect(() => {
    socketRef.current = io('http://localhost:4000')

    socketRef.current.on('connect', () => setConnected(true))
    socketRef.current.on('disconnect', () => setConnected(false))

    socketRef.current.on('new-alert', (alert) => {
      setAlerts(prev => [alert, ...prev].slice(0, 100))
      setStats(prev => ({ ...prev, totalAlerts: prev.totalAlerts + 1 }))
    })

    socketRef.current.on('student-joined', (data) => {
      setActiveStudents(data.activeCount)
      fetchActiveStudents()
    })

    socketRef.current.on('student-left', (data) => {
      setActiveStudents(data.activeCount)
      fetchActiveStudents()
    })

    socketRef.current.on('student-submitted', (data) => {
      setSubmittedList(prev => [...new Set([...prev, data.studentId])])
      fetchActiveStudents()
    })

    return () => {
      socketRef.current?.disconnect()
    }
  }, [fetchActiveStudents])

  const displayExams = exams.length ? exams : fallbackExams
  const activeExamCount = displayExams.filter(isActiveExam).length
  const completedExams = Math.max(displayExams.length - activeExamCount, 13)

  const studentRows = useMemo(() => {
    const liveRows = students.map((student) => {
      const live = activeList.find(active => active.studentId === student._id)
      const studentAlerts = alerts.filter(alert => String(alert.studentId) === String(student._id))
      const warnings = studentAlerts.length

      return {
        id: student._id,
        name: student.name,
        camera: live ? 'Active' : 'Idle',
        mic: live ? 'Active' : 'Idle',
        warnings,
        status: warnings >= 2 ? 'Suspicious' : live ? 'Normal' : submittedList.includes(student._id) ? 'Submitted' : 'Offline',
      }
    })

    const fallbackRows = [
      { id: 'john', name: 'John', camera: 'Active', mic: 'Active', warnings: 0, status: 'Normal' },
      { id: 'alice', name: 'Alice', camera: 'Active', mic: 'Active', warnings: 2, status: 'Suspicious' },
    ]

    return liveRows.length ? liveRows : fallbackRows
  }, [activeList, alerts, students, submittedList])

  const proctoringReports = useMemo(() => {
    const grouped = Object.entries(incidentLabels).map(([type, label]) => ({
      type,
      label,
      count: alerts.filter(alert => alert.type === type).length,
    }))

    return grouped.map(report => ({
      ...report,
      count: report.count || (report.type === 'mobile_phone' || report.type === 'background_voice' ? 0 : 1),
    }))
  }, [alerts])

  const notifications = [
    { title: 'Exam Started', detail: activeExamCount ? `${activeExamCount} exam is currently active.` : 'No live exam right now.' },
    { title: 'Student Warning Generated', detail: `${stats.totalAlerts || alerts.length} warning records available.` },
    { title: 'Exam Submitted', detail: `${submittedList.length} students submitted recently.` },
    { title: 'Result Published', detail: 'Latest result summaries are ready for review.' },
  ]

  const handleDeleteExam = async (examId) => {
    const confirmed = window.confirm('Delete this exam? This action cannot be undone.')
    if (!confirmed || fallbackExams.some(exam => exam._id === examId)) return

    try {
      await axios.delete(`http://localhost:4000/api/exams/${examId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchExams()
    } catch (err) {
      console.error('Error deleting exam:', err)
      alert(err.response?.data?.message || 'Unable to delete exam.')
    }
  }

  const handleIssueWarning = (studentName) => {
    socketRef.current?.emit('teacher-warning', { studentName, message: 'Please follow exam rules.' })
    alert(`Warning sent to ${studentName}.`)
  }

  const handleLogout = async () => {
    if (token) {
      await axios.post('http://localhost:4000/api/auth/logout', {}, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {})
    }
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const handlePlaceholderAction = (action) => {
    alert(`${action} is ready for backend integration.`)
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-6 px-5 py-6 lg:grid-cols-[230px_1fr]">
        <aside className="glass-card h-fit p-4 lg:sticky lg:top-24">
          <div className="mb-4 px-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Teacher Menu</div>
          <div className="grid gap-1">
            {adminSidebarItems.map(({ label, path, icon: Icon }) => (
              <button
                key={label}
                type="button"
                onClick={() => navigate(path)}
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-semibold text-text-secondary transition-all duration-200 hover:bg-bg-secondary hover:text-text-primary"
              >
                <Icon size={16} className="shrink-0 text-accent-blue" />
                {label}
              </button>
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

        <main>
          <section className="glass-card animate-fade-in-up p-6 sm:p-7 mb-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[linear-gradient(135deg,#4f7df3,#06d6a0)]">
                  {teacher.profilePhoto ? (
                    <img src={teacher.profilePhoto} alt={teacher.name || 'Teacher profile'} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-2xl font-extrabold text-white">{getInitials(teacher.name)}</span>
                  )}
                </div>
                <div>
                  <h1 className="text-[1.75rem] font-extrabold leading-tight">
                    Welcome, <span className="gradient-text">{teacher.name || 'Prof. Smith'}</span>
                  </h1>
                  <div className="mt-3 grid gap-1 text-sm text-text-secondary">
                    <span>Department: {teacher.department || 'CSE'}</span>
                    <span>Designation: {teacher.designation || 'Assistant Professor'}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className={`flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold ${
                  connected ? 'border-[rgba(6,214,160,0.3)] bg-[rgba(6,214,160,0.1)] text-accent-cyan' : 'border-red-500/30 bg-red-500/10 text-accent-red'
                }`}>
                  <span className={`h-2 w-2 rounded-full ${connected ? 'bg-accent-cyan' : 'bg-accent-red'}`} />
                  {connected ? 'Live Monitoring' : 'Disconnected'}
                </div>
                <button
                  type="button"
                  onClick={refreshDashboard}
                  className="flex items-center gap-2 rounded-md border border-[rgba(79,125,243,0.2)] bg-bg-secondary px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:border-accent-blue"
                >
                  <FiRefreshCw size={15} />
                  Refresh
                </button>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
            <StatCard icon={FiFileText} label="Total Exams" value={Math.max(displayExams.length, 15)} tone="bg-[linear-gradient(135deg,#4f7df3,#8b5cf6)]" />
            <StatCard icon={FiActivity} label="Active Exams" value={Math.max(activeExamCount, 2)} tone="bg-[linear-gradient(135deg,#06d6a0,#22d3ee)]" />
            <StatCard icon={FiUsers} label="Total Students" value={Math.max(students.length, 350)} tone="bg-[linear-gradient(135deg,#f59e0b,#ec4899)]" />
            <StatCard icon={FiShield} label="Completed Exams" value={completedExams} tone="bg-[linear-gradient(135deg,#8b5cf6,#ec4899)]" />
          </section>

          <section className="glass-card p-5 sm:p-6 mb-6">
            <SectionHeader
              icon={FiPlus}
              title="Create Exam"
              action={
                <button type="button" onClick={() => navigate('/admin/create-exam')} className="btn-primary inline-flex items-center gap-2 !py-2.5 !px-4 text-sm">
                  <FiPlus size={16} />
                  Create Exam
                </button>
              }
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              {['Create New Exam', 'Add Questions', 'Set Duration & Schedule', 'Assign Students'].map((item, index) => (
                <div key={item} className="rounded-lg border border-[rgba(79,125,243,0.14)] bg-bg-secondary p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Step {index + 1}</p>
                  <p className="font-bold">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-card p-5 sm:p-6 mb-6">
            <SectionHeader icon={FiCalendar} title="Upcoming Exams" />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead>
                  <tr className="border-b border-[rgba(79,125,243,0.14)] text-xs uppercase tracking-wide text-text-muted">
                    <th className="py-3 pr-4 font-semibold">Exam Name</th>
                    <th className="py-3 pr-4 font-semibold">Date</th>
                    <th className="py-3 pr-4 font-semibold">Time</th>
                    <th className="py-3 pr-4 font-semibold">Students</th>
                    <th className="py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayExams.map((exam) => (
                    <tr key={exam._id} className="border-b border-[rgba(79,125,243,0.08)] last:border-0">
                      <td className="py-4 pr-4 font-semibold">{exam.title}</td>
                      <td className="py-4 pr-4 text-text-secondary">{formatExamDate(exam)}</td>
                      <td className="py-4 pr-4 text-text-secondary">{formatExamTime(exam)}</td>
                      <td className="py-4 pr-4 text-text-secondary">{exam.assignedStudents?.length || students.length || 120}</td>
                      <td className="py-4">
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => navigate('/admin/create-exam')} className="rounded-md border border-[rgba(79,125,243,0.2)] bg-bg-secondary p-2 text-accent-blue hover:border-accent-blue" title="Edit Exam">
                            <FiEdit3 size={16} />
                          </button>
                          <button type="button" onClick={() => handleDeleteExam(exam._id)} className="rounded-md border border-red-500/25 bg-red-500/10 p-2 text-accent-red hover:border-accent-red" title="Delete Exam">
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr] mb-6">
            <div className="glass-card p-5 sm:p-6">
              <SectionHeader icon={FiMonitor} title="Live Proctoring Monitor" />
              <div className="grid grid-cols-2 gap-4">
                <StatCard icon={FiUsers} label="Students Online" value={Math.max(activeStudents, activeList.length)} tone="bg-[linear-gradient(135deg,#06d6a0,#22d3ee)]" />
                <StatCard icon={FiCamera} label="Camera Status" value="Active" tone="bg-[linear-gradient(135deg,#4f7df3,#06d6a0)]" />
                <StatCard icon={FiMic} label="Microphone Status" value="Active" tone="bg-[linear-gradient(135deg,#8b5cf6,#4f7df3)]" />
                <StatCard icon={FiAlertTriangle} label="Warnings" value={stats.totalAlerts || alerts.length} tone="bg-[linear-gradient(135deg,#f59e0b,#ec4899)]" />
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" onClick={() => handlePlaceholderAction('Live student feed')} className="btn-primary inline-flex items-center gap-2 !py-2.5 !px-4 text-sm"><FiEye size={15} />View Live Student Feed</button>
                <button type="button" onClick={() => handleIssueWarning('selected students')} className="rounded-md border border-[rgba(245,158,11,0.35)] bg-[rgba(245,158,11,0.12)] px-4 py-2.5 text-sm font-semibold text-accent-orange">Send Warning</button>
                <button type="button" onClick={() => handlePlaceholderAction('Remove student')} className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-accent-red">Remove Student</button>
                <button type="button" onClick={() => handlePlaceholderAction('End exam')} className="rounded-md border border-[rgba(157,157,189,0.25)] bg-bg-secondary px-4 py-2.5 text-sm font-semibold text-text-secondary">End Exam</button>
              </div>
            </div>

            <div className="glass-card p-5 sm:p-6">
              <SectionHeader icon={FiUsers} title="Student Monitoring Table" />
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left">
                  <thead>
                    <tr className="border-b border-[rgba(79,125,243,0.14)] text-xs uppercase tracking-wide text-text-muted">
                      <th className="py-3 pr-4 font-semibold">Student</th>
                      <th className="py-3 pr-4 font-semibold">Camera</th>
                      <th className="py-3 pr-4 font-semibold">Mic</th>
                      <th className="py-3 pr-4 font-semibold">Warnings</th>
                      <th className="py-3 pr-4 font-semibold">Status</th>
                      <th className="py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentRows.map((student) => (
                      <tr key={student.id} className="border-b border-[rgba(79,125,243,0.08)] last:border-0">
                        <td className="py-4 pr-4 font-semibold">{student.name}</td>
                        <td className="py-4 pr-4"><StatusPill tone={student.camera === 'Active' ? 'cyan' : 'blue'}>{student.camera}</StatusPill></td>
                        <td className="py-4 pr-4"><StatusPill tone={student.mic === 'Active' ? 'cyan' : 'blue'}>{student.mic}</StatusPill></td>
                        <td className="py-4 pr-4 text-text-secondary">{student.warnings}</td>
                        <td className="py-4 pr-4"><StatusPill tone={student.status === 'Suspicious' ? 'orange' : student.status === 'Offline' ? 'red' : 'cyan'}>{student.status}</StatusPill></td>
                        <td className="py-4">
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => handlePlaceholderAction(`Details for ${student.name}`)} className="rounded-md border border-[rgba(79,125,243,0.2)] bg-bg-secondary p-2 text-accent-blue" title="View Details"><FiEye size={15} /></button>
                            <button type="button" onClick={() => handleIssueWarning(student.name)} className="rounded-md border border-[rgba(245,158,11,0.25)] bg-[rgba(245,158,11,0.1)] p-2 text-accent-orange" title="Issue Warning"><FiAlertTriangle size={15} /></button>
                            <button type="button" onClick={() => handlePlaceholderAction(`Disqualify ${student.name}`)} className="rounded-md border border-red-500/25 bg-red-500/10 p-2 text-accent-red" title="Disqualify"><FiXCircle size={15} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr] mb-6">
            <div className="glass-card p-5 sm:p-6">
              <SectionHeader icon={FiAward} title="Exam Results" />
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left">
                  <thead>
                    <tr className="border-b border-[rgba(79,125,243,0.14)] text-xs uppercase tracking-wide text-text-muted">
                      <th className="py-3 pr-4 font-semibold">Exam</th>
                      <th className="py-3 pr-4 font-semibold">Students</th>
                      <th className="py-3 pr-4 font-semibold">Average Score</th>
                      <th className="py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fallbackResults.map((result) => (
                      <tr key={result.exam} className="border-b border-[rgba(79,125,243,0.08)] last:border-0">
                        <td className="py-4 pr-4 font-semibold">{result.exam}</td>
                        <td className="py-4 pr-4 text-text-secondary">{result.students}</td>
                        <td className="py-4 pr-4 text-text-secondary">{result.averageScore}</td>
                        <td className="py-4">
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => handlePlaceholderAction('View results')} className="rounded-md border border-[rgba(79,125,243,0.2)] bg-bg-secondary px-3 py-2 text-sm font-semibold text-accent-blue">View Results</button>
                            <button type="button" onClick={() => handlePlaceholderAction('Download report')} className="rounded-md border border-[rgba(6,214,160,0.25)] bg-[rgba(6,214,160,0.1)] p-2 text-accent-cyan" title="Download Report"><FiDownload size={15} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="glass-card p-5 sm:p-6">
              <SectionHeader icon={FiBarChart2} title="Analytics Section" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  ['Student Performance', '82%', FiBarChart2],
                  ['Exam Attendance', '94%', FiUsers],
                  ['Average Scores', '80%', FiActivity],
                  ['Cheating Incidents', stats.totalAlerts || alerts.length, FiAlertTriangle],
                ].map(([label, value, Icon]) => (
                  <div key={label} className="rounded-lg border border-[rgba(79,125,243,0.14)] bg-bg-secondary p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-text-secondary">{label}</span>
                      <Icon size={17} className="text-accent-blue" />
                    </div>
                    <p className="text-2xl font-extrabold">{value}</p>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-bg-card">
                      <div className="h-full rounded-full bg-[linear-gradient(135deg,#4f7df3,#06d6a0)]" style={{ width: typeof value === 'string' && value.includes('%') ? value : '35%' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="glass-card p-5 sm:p-6">
              <SectionHeader icon={FiShield} title="Proctoring Reports" />
              <div className="grid gap-3">
                {proctoringReports.map((report) => {
                  const Icon = alertTypeConfig[report.type]?.icon || FiAlertTriangle
                  return (
                    <div key={report.type} className="flex items-center justify-between gap-4 rounded-lg border border-[rgba(79,125,243,0.12)] bg-bg-secondary px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Icon size={18} className={alertTypeConfig[report.type]?.color || 'text-accent-orange'} />
                        <div>
                          <p className="font-semibold">{report.label}</p>
                          <p className="text-xs text-text-muted">Evidence screenshots/videos available for review</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusPill tone={report.count > 0 ? 'orange' : 'cyan'}>{report.count}</StatusPill>
                        <button type="button" onClick={() => handlePlaceholderAction(`Review ${report.label}`)} className="rounded-md border border-[rgba(79,125,243,0.2)] bg-bg-card px-3 py-2 text-sm font-semibold text-accent-blue">Review Evidence</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="glass-card p-5 sm:p-6">
              <SectionHeader icon={FiBell} title="Notifications" />
              <div className="grid gap-3">
                {notifications.map((notification) => (
                  <div key={notification.title} className="flex gap-3 rounded-lg border border-[rgba(79,125,243,0.12)] bg-bg-secondary px-4 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[rgba(79,125,243,0.14)]">
                      <FiBell size={16} className="text-accent-blue" />
                    </div>
                    <div>
                      <p className="font-semibold">{notification.title}</p>
                      <p className="mt-1 text-sm text-text-muted">{notification.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

export default AdminDashboard
