import { useEffect, useState } from 'react'
import axios from 'axios'
import AdminShell from '../components/admin/AdminShell'
import { SectionHeader, StatCard, StatusPill } from '../components/admin/AdminWidgets'
import { formatDate, formatTime } from '../hooks/useAdminData'
import { FiActivity, FiAlertTriangle, FiClock, FiLogIn } from 'react-icons/fi'

const fallbackLogs = [
  { _id: 'log-1', studentName: 'Alice George', examTitle: 'Java Test', type: 'login', message: 'Student logged in.', createdAt: '2026-06-14T09:00:00' },
  { _id: 'log-2', studentName: 'Alice George', examTitle: 'Java Test', type: 'exam_start', message: 'Started Java Test.', createdAt: '2026-06-14T09:05:00' },
  { _id: 'log-3', studentName: 'Alice George', examTitle: 'Java Test', type: 'violation', message: 'Tab switching detected.', createdAt: '2026-06-14T09:20:00' },
]

const toneFor = (type) => {
  if (type === 'violation') return 'red'
  if (type.includes('verified')) return 'cyan'
  if (type.includes('exam')) return 'orange'
  return 'blue'
}

const ActivityLogsPage = () => {
  const [logs, setLogs] = useState([])
  const token = localStorage.getItem('token')
  const data = logs.length ? logs : fallbackLogs

  useEffect(() => {
    axios.get('http://localhost:4000/api/admin/activity-logs', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => setLogs(res.data)).catch(() => setLogs([]))
  }, [token])

  return (
    <AdminShell>
      <SectionHeader icon={FiActivity} title="Activity Logs" subtitle="Track login, logout, exam lifecycle, OTP, face checks, and violations." />

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard icon={FiActivity} label="Total Events" value={data.length} detail="Recent tracked events" />
        <StatCard icon={FiLogIn} label="Logins" value={data.filter(log => log.type === 'login').length} detail="Student login events" tone="bg-[linear-gradient(135deg,#06d6a0,#22d3ee)]" />
        <StatCard icon={FiClock} label="Exam Events" value={data.filter(log => log.type?.includes('exam')).length} detail="Start and end records" tone="bg-[linear-gradient(135deg,#f59e0b,#ec4899)]" />
        <StatCard icon={FiAlertTriangle} label="Violations" value={data.filter(log => log.type === 'violation').length} detail="Incident logs" tone="bg-[linear-gradient(135deg,#ef4444,#ec4899)]" />
      </section>

      <section className="glass-card p-5 sm:p-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead>
              <tr className="border-b border-[rgba(79,125,243,0.14)] text-xs uppercase tracking-wide text-text-muted">
                <th className="py-3 pr-4 font-semibold">Student</th>
                <th className="py-3 pr-4 font-semibold">Event</th>
                <th className="py-3 pr-4 font-semibold">Exam</th>
                <th className="py-3 pr-4 font-semibold">Time</th>
                <th className="py-3 pr-4 font-semibold">Message</th>
              </tr>
            </thead>
            <tbody>
              {data.map(log => (
                <tr key={log._id} className="border-b border-[rgba(79,125,243,0.08)] last:border-0">
                  <td className="py-4 pr-4 font-semibold">{log.studentName}</td>
                  <td className="py-4 pr-4"><StatusPill tone={toneFor(log.type)}>{log.type?.replace('_', ' ')}</StatusPill></td>
                  <td className="py-4 pr-4 text-text-secondary">{log.examTitle || '-'}</td>
                  <td className="py-4 pr-4 text-text-secondary">{formatDate(log.createdAt)} {formatTime(log.createdAt)}</td>
                  <td className="py-4 pr-4 text-text-secondary">{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  )
}

export default ActivityLogsPage
