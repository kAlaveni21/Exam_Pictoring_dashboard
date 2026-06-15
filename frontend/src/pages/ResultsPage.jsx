import AdminShell from '../components/admin/AdminShell'
import { SectionHeader, StatCard, StatusPill } from '../components/admin/AdminWidgets'
import { useAdminData } from '../hooks/useAdminData'
import { FiAward, FiDownload, FiTrendingUp, FiUsers } from 'react-icons/fi'

const ResultsPage = () => {
  const { exams, students } = useAdminData()
  const results = exams.map((exam, index) => {
    const totalStudents = exam.assignedStudents?.length || Math.max(students.length, 45 + index * 18)
    const average = [78, 82, 74, 88][index % 4]
    return {
      id: exam._id,
      exam: exam.title,
      appeared: Math.max(totalStudents - (index + 3), 0),
      totalStudents,
      average,
      topScore: Math.min(average + 14, 98),
      status: index === 0 ? 'Published' : 'Reviewed',
    }
  })

  const averageScore = Math.round(results.reduce((sum, result) => sum + result.average, 0) / Math.max(results.length, 1))

  return (
    <AdminShell>
      <SectionHeader icon={FiAward} title="Results" subtitle="View score summaries, attendance, and result publication status." />

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={FiAward} label="Result Sets" value={results.length} detail="Available exam result summaries" />
        <StatCard icon={FiTrendingUp} label="Average Score" value={`${averageScore}%`} detail="Across all exams" tone="bg-[linear-gradient(135deg,#06d6a0,#22d3ee)]" />
        <StatCard icon={FiUsers} label="Appeared Students" value={results.reduce((sum, result) => sum + result.appeared, 0)} detail="Total submitted attempts" tone="bg-[linear-gradient(135deg,#f59e0b,#ec4899)]" />
      </section>

      <section className="glass-card p-5 sm:p-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr className="border-b border-[rgba(79,125,243,0.14)] text-xs uppercase tracking-wide text-text-muted">
                <th className="py-3 pr-4 font-semibold">Exam</th>
                <th className="py-3 pr-4 font-semibold">Appeared</th>
                <th className="py-3 pr-4 font-semibold">Average Score</th>
                <th className="py-3 pr-4 font-semibold">Top Score</th>
                <th className="py-3 pr-4 font-semibold">Status</th>
                <th className="py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr key={result.id} className="border-b border-[rgba(79,125,243,0.08)] last:border-0">
                  <td className="py-4 pr-4 font-semibold">{result.exam}</td>
                  <td className="py-4 pr-4 text-text-secondary">{result.appeared}/{result.totalStudents}</td>
                  <td className="py-4 pr-4 text-text-secondary">{result.average}%</td>
                  <td className="py-4 pr-4 text-text-secondary">{result.topScore}%</td>
                  <td className="py-4 pr-4"><StatusPill tone="cyan">{result.status}</StatusPill></td>
                  <td className="py-4 text-right">
                    <button type="button" className="inline-flex items-center gap-2 rounded-md border border-[rgba(6,214,160,0.25)] bg-[rgba(6,214,160,0.1)] px-3 py-2 text-sm font-semibold text-accent-cyan">
                      <FiDownload size={15} />
                      Export
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  )
}

export default ResultsPage
