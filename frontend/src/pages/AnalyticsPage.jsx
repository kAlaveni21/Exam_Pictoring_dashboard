import AdminShell from '../components/admin/AdminShell'
import { BarChart, SectionHeader, StatCard } from '../components/admin/AdminWidgets'
import { useAdminData } from '../hooks/useAdminData'
import { FiActivity, FiBarChart2, FiPieChart, FiTrendingUp } from 'react-icons/fi'

const AnalyticsPage = () => {
  const { alerts, exams, students } = useAdminData()

  const attendance = exams.slice(0, 4).map((exam, index) => {
    const assigned = exam.assignedStudents?.length || students.length || 100
    const attended = Math.max(assigned - (index + 4) * 3, 0)
    const percent = Math.round((attended / Math.max(assigned, 1)) * 100)
    return { label: exam.title, value: percent, display: `${percent}%` }
  })

  const scores = exams.slice(0, 4).map((exam, index) => {
    const value = [78, 82, 74, 88][index % 4]
    return { label: exam.title, value, display: `${value}%` }
  })

  const performance = [
    { label: 'Excellent', value: 36, display: '36 students' },
    { label: 'Good', value: 58, display: '58 students' },
    { label: 'Average', value: 31, display: '31 students' },
    { label: 'Needs Review', value: Math.max(alerts.length, 8), display: `${Math.max(alerts.length, 8)} students` },
  ]

  return (
    <AdminShell>
      <SectionHeader icon={FiPieChart} title="Analytics" subtitle="Compare attendance, average scores, and exam performance trends." />

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={FiActivity} label="Attendance Rate" value={`${attendance[0]?.value || 94}%`} detail="Latest exam attendance" />
        <StatCard icon={FiTrendingUp} label="Average Scores" value={`${Math.round(scores.reduce((sum, item) => sum + item.value, 0) / Math.max(scores.length, 1))}%`} detail="Across current exams" tone="bg-[linear-gradient(135deg,#06d6a0,#22d3ee)]" />
        <StatCard icon={FiBarChart2} label="Performance Alerts" value={alerts.length} detail="Incidents affecting reports" tone="bg-[linear-gradient(135deg,#f59e0b,#ec4899)]" />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="glass-card p-5 sm:p-6">
          <h2 className="mb-5 text-lg font-bold">Attendance</h2>
          <BarChart data={attendance} />
        </div>
        <div className="glass-card p-5 sm:p-6">
          <h2 className="mb-5 text-lg font-bold">Average Scores</h2>
          <BarChart data={scores} color="bg-[linear-gradient(135deg,#06d6a0,#22d3ee)]" />
        </div>
        <div className="glass-card p-5 sm:p-6">
          <h2 className="mb-5 text-lg font-bold">Exam Performance</h2>
          <BarChart data={performance} color="bg-[linear-gradient(135deg,#f59e0b,#ec4899)]" />
        </div>
      </section>
    </AdminShell>
  )
}

export default AnalyticsPage
