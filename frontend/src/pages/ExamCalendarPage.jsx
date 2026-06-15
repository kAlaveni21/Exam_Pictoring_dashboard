import { useMemo, useState } from 'react'
import AdminShell from '../components/admin/AdminShell'
import { SectionHeader, StatusPill } from '../components/admin/AdminWidgets'
import { formatDate, formatTime, useAdminData } from '../hooks/useAdminData'
import { FiCalendar } from 'react-icons/fi'

const dateKey = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

const ExamCalendarPage = () => {
  const { exams } = useAdminData()
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()))
  const monthStart = new Date()
  monthStart.setDate(1)
  const firstDay = monthStart.getDay()
  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate()

  const examsByDate = useMemo(() => exams.reduce((acc, exam) => {
    const key = dateKey(exam.startTime || exam.createdAt)
    if (!key) return acc
    acc[key] = [...(acc[key] || []), exam]
    return acc
  }, {}), [exams])

  const cells = [
    ...Array.from({ length: firstDay }, (_, index) => ({ empty: true, key: `empty-${index}` })),
    ...Array.from({ length: daysInMonth }, (_, index) => {
      const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), index + 1)
      const key = dateKey(date)
      return { key, day: index + 1, exams: examsByDate[key] || [] }
    }),
  ]

  return (
    <AdminShell>
      <SectionHeader icon={FiCalendar} title="Exam Calendar" subtitle="Click highlighted dates to view scheduled exams." />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <div className="glass-card p-5 sm:p-6">
          <div className="mb-5 text-lg font-bold">{monthStart.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</div>
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-wide text-text-muted">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day}>{day}</div>)}
          </div>
          <div className="mt-3 grid grid-cols-7 gap-2">
            {cells.map(cell => cell.empty ? (
              <div key={cell.key} className="aspect-square rounded-md bg-bg-secondary/40" />
            ) : (
              <button
                key={cell.key}
                type="button"
                onClick={() => setSelectedDate(cell.key)}
                className={`aspect-square rounded-md border p-2 text-left transition-all ${
                  selectedDate === cell.key
                    ? 'border-accent-blue bg-[rgba(79,125,243,0.18)]'
                    : cell.exams.length
                      ? 'border-[rgba(6,214,160,0.35)] bg-[rgba(6,214,160,0.1)]'
                      : 'border-[rgba(79,125,243,0.12)] bg-bg-secondary'
                }`}
              >
                <span className="font-bold">{cell.day}</span>
                {cell.exams.length > 0 && <div className="mt-2 h-2 w-2 rounded-full bg-accent-cyan" />}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-bold">{selectedDate ? formatDate(selectedDate) : 'Selected Date'}</h2>
          <div className="grid gap-3">
            {(examsByDate[selectedDate] || []).length === 0 ? (
              <p className="rounded-lg bg-bg-secondary p-4 text-sm text-text-muted">No exams scheduled on this date.</p>
            ) : examsByDate[selectedDate].map(exam => (
              <div key={exam._id} className="rounded-lg border border-[rgba(79,125,243,0.12)] bg-bg-secondary p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{exam.title}</p>
                  <StatusPill tone="cyan">{exam.duration || 30} min</StatusPill>
                </div>
                <p className="mt-2 text-sm text-text-muted">{formatTime(exam.startTime)} · {exam.assignedStudents?.length || 0} assigned</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AdminShell>
  )
}

export default ExamCalendarPage
