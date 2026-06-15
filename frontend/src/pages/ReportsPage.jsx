import AdminShell from '../components/admin/AdminShell'
import { SectionHeader, StatCard, StatusPill } from '../components/admin/AdminWidgets'
import { formatDate, formatTime, useAdminData } from '../hooks/useAdminData'
import { downloadAdminReport } from '../utils/reportExport'
import { FiAlertTriangle, FiCamera, FiDownload, FiFileText, FiShield } from 'react-icons/fi'

const labels = {
  no_face: 'No Face Detected',
  multiple_faces: 'Multiple Faces Detected',
  looking_away: 'Looking Away',
  tab_switch: 'Tab Switch',
  mobile_phone: 'Mobile Phone Detected',
  background_voice: 'Background Voice',
}

const ReportsPage = () => {
  const { alerts } = useAdminData()
  const token = localStorage.getItem('token')
  const criticalCount = alerts.filter(alert => alert.severity === 'critical' || alert.severity === 'high').length
  const reportTypes = ['results', 'violations', 'attendance', 'student-performance']
  const formats = ['csv', 'excel', 'pdf']

  return (
    <AdminShell>
      <SectionHeader icon={FiShield} title="Reports" subtitle="Review proctoring incidents, violations, severity, and evidence status." />

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={FiFileText} label="Total Incidents" value={alerts.length} detail="Captured violations" />
        <StatCard icon={FiAlertTriangle} label="High Severity" value={criticalCount} detail="Needs proctor review" tone="bg-[linear-gradient(135deg,#ef4444,#ec4899)]" />
        <StatCard icon={FiCamera} label="Evidence Files" value={alerts.filter(alert => alert.screenshot).length || alerts.length} detail="Screenshots or logs attached" tone="bg-[linear-gradient(135deg,#06d6a0,#22d3ee)]" />
      </section>

      <section className="glass-card mb-6 p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2 font-bold">
          <FiDownload className="text-accent-blue" />
          Download Reports
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {reportTypes.map(type => (
            <div key={type} className="flex flex-col gap-3 rounded-lg border border-[rgba(79,125,243,0.14)] bg-bg-secondary p-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-semibold capitalize">{type.replace(/-/g, ' ')}</span>
              <div className="flex flex-wrap gap-2">
                {formats.map(format => (
                  <button
                    key={`${type}-${format}`}
                    type="button"
                    onClick={() => downloadAdminReport(type, token, format)}
                    className="rounded-md border border-[rgba(79,125,243,0.25)] bg-bg-card px-3 py-2 text-xs font-semibold uppercase text-accent-blue"
                  >
                    {format === 'excel' ? 'Excel' : format}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-card p-5 sm:p-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-[rgba(79,125,243,0.14)] text-xs uppercase tracking-wide text-text-muted">
                <th className="py-3 pr-4 font-semibold">Student</th>
                <th className="py-3 pr-4 font-semibold">Exam</th>
                <th className="py-3 pr-4 font-semibold">Violation</th>
                <th className="py-3 pr-4 font-semibold">Severity</th>
                <th className="py-3 pr-4 font-semibold">Date</th>
                <th className="py-3 pr-4 font-semibold">Evidence</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={alert._id} className="border-b border-[rgba(79,125,243,0.08)] last:border-0">
                  <td className="py-4 pr-4 font-semibold">{alert.studentName}</td>
                  <td className="py-4 pr-4 text-text-secondary">{alert.examTitle || 'Exam Session'}</td>
                  <td className="py-4 pr-4 text-text-secondary">{labels[alert.type] || alert.type}</td>
                  <td className="py-4 pr-4"><StatusPill tone={alert.severity === 'critical' || alert.severity === 'high' ? 'red' : 'orange'}>{alert.severity || 'medium'}</StatusPill></td>
                  <td className="py-4 pr-4 text-text-secondary">{formatDate(alert.createdAt)} {formatTime(alert.createdAt)}</td>
                  <td className="py-4 pr-4"><StatusPill tone={alert.screenshot ? 'cyan' : 'blue'}>{alert.screenshot ? 'Attached' : 'Log Only'}</StatusPill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  )
}

export default ReportsPage
