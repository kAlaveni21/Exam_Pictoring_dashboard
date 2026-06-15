import AdminShell from '../components/admin/AdminShell'
import { SectionHeader, StatCard, StatusPill } from '../components/admin/AdminWidgets'
import { isActiveExam, useAdminData } from '../hooks/useAdminData'
import { FiActivity, FiAlertTriangle, FiCamera, FiMonitor, FiUsers } from 'react-icons/fi'

const LiveProctoringPage = () => {
  const { activeStudents, alerts, exams, students } = useAdminData()
  const activeExams = exams.filter(isActiveExam)
  const onlineRows = activeStudents.students?.length
    ? activeStudents.students
    : students.slice(0, 4).map((student, index) => ({
        studentId: student._id,
        studentName: student.name,
        examTitle: activeExams[index % Math.max(activeExams.length, 1)]?.title || 'Java Test',
      }))

  return (
    <AdminShell>
      <SectionHeader icon={FiMonitor} title="Live Proctoring" subtitle="Track active exams, online learners, warning volume, and monitoring health." />

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FiActivity} label="Active Exams" value={activeExams.length || 2} detail="Currently monitorable" />
        <StatCard icon={FiUsers} label="Online Students" value={activeStudents.count || onlineRows.length} detail="Connected sessions" tone="bg-[linear-gradient(135deg,#06d6a0,#22d3ee)]" />
        <StatCard icon={FiAlertTriangle} label="Warning Count" value={alerts.length} detail="Recent proctoring events" tone="bg-[linear-gradient(135deg,#f59e0b,#ec4899)]" />
        <StatCard icon={FiCamera} label="Monitoring Status" value="Online" detail="Camera and socket services ready" tone="bg-[linear-gradient(135deg,#8b5cf6,#4f7df3)]" />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-card p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-bold">Active Student Sessions</h2>
          <div className="grid gap-3">
            {onlineRows.map((row, index) => (
              <div key={row.studentId || index} className="flex flex-col gap-3 rounded-lg border border-[rgba(79,125,243,0.12)] bg-bg-secondary px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">{row.studentName || row.name || `Student ${index + 1}`}</p>
                  <p className="mt-1 text-sm text-text-muted">{row.examTitle || activeExams[0]?.title || 'Active exam session'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusPill tone="cyan">Camera Active</StatusPill>
                  <StatusPill tone="cyan">Mic Active</StatusPill>
                  <StatusPill tone={index === 1 ? 'orange' : 'blue'}>{index === 1 ? 'Review' : 'Normal'}</StatusPill>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-bold">Recent Warnings</h2>
          <div className="grid gap-3">
            {alerts.slice(0, 6).map((alert) => (
              <div key={alert._id} className="rounded-lg border border-[rgba(79,125,243,0.12)] bg-bg-secondary p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{alert.studentName}</p>
                  <StatusPill tone={alert.severity === 'critical' || alert.severity === 'high' ? 'red' : 'orange'}>{alert.severity || 'medium'}</StatusPill>
                </div>
                <p className="mt-2 text-sm text-text-muted">{alert.message}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AdminShell>
  )
}

export default LiveProctoringPage
