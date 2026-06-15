import AdminShell from '../components/admin/AdminShell'
import { SectionHeader, StatusPill } from '../components/admin/AdminWidgets'
import { useAdminData } from '../hooks/useAdminData'
import { FiAlertTriangle, FiBell, FiCheckCircle, FiClock, FiFileText } from 'react-icons/fi'

const NotificationsPage = () => {
  const { alerts, exams, activeStudents } = useAdminData()
  const notifications = [
    { id: 'active-exams', icon: FiClock, title: 'Exam monitoring status updated', detail: `${exams.length} exam records are available for review.`, tone: 'blue', time: 'Just now' },
    { id: 'online-students', icon: FiCheckCircle, title: 'Student sessions synchronized', detail: `${activeStudents.count || 2} students are currently visible in live monitoring.`, tone: 'cyan', time: '5 min ago' },
    { id: 'warning-count', icon: FiAlertTriangle, title: 'Proctoring warning generated', detail: `${alerts.length} incident records are waiting in reports.`, tone: 'orange', time: '12 min ago' },
    { id: 'results', icon: FiFileText, title: 'Result summaries prepared', detail: 'Latest score summaries are ready on the Results page.', tone: 'blue', time: 'Today' },
  ]

  return (
    <AdminShell>
      <SectionHeader icon={FiBell} title="Notifications" subtitle="Recent system messages, monitoring updates, and proctoring alerts." />

      <section className="glass-card p-5 sm:p-6">
        <div className="grid gap-3">
          {notifications.map(({ id, icon: Icon, title, detail, tone, time }) => (
            <div key={id} className="flex flex-col gap-3 rounded-lg border border-[rgba(79,125,243,0.12)] bg-bg-secondary px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[rgba(79,125,243,0.14)]">
                  <Icon size={18} className="text-accent-blue" />
                </div>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="mt-1 text-sm text-text-muted">{detail}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 self-start sm:self-center">
                <StatusPill tone={tone}>{time}</StatusPill>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AdminShell>
  )
}

export default NotificationsPage
