import { useEffect, useState } from 'react'
import axios from 'axios'
import AdminShell from '../components/admin/AdminShell'
import { SectionHeader, StatCard } from '../components/admin/AdminWidgets'
import { FiAward, FiTrendingUp, FiUsers } from 'react-icons/fi'

const fallbackRows = [
  { rank: 1, studentName: 'Alice George', examCount: 4, averageScore: '8.8', percentage: 92 },
  { rank: 2, studentName: 'Rahul Nair', examCount: 3, averageScore: '8.2', percentage: 88 },
  { rank: 3, studentName: 'John Mathew', examCount: 5, averageScore: '7.9', percentage: 84 },
]

const LeaderboardPage = () => {
  const [rows, setRows] = useState([])
  const token = localStorage.getItem('token')
  const data = rows.length ? rows : fallbackRows

  useEffect(() => {
    axios.get('http://localhost:4000/api/admin/leaderboard', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => setRows(res.data)).catch(() => setRows([]))
  }, [token])

  return (
    <AdminShell>
      <SectionHeader icon={FiAward} title="Leaderboard" subtitle="Top-performing students ranked by average percentage." />

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={FiAward} label="Top Performer" value={data[0]?.studentName || 'No data'} detail={`${data[0]?.percentage || 0}% average`} />
        <StatCard icon={FiUsers} label="Ranked Students" value={data.length} detail="Students with submitted results" tone="bg-[linear-gradient(135deg,#06d6a0,#22d3ee)]" />
        <StatCard icon={FiTrendingUp} label="Best Percentage" value={`${data[0]?.percentage || 0}%`} detail="Highest leaderboard score" tone="bg-[linear-gradient(135deg,#f59e0b,#ec4899)]" />
      </section>

      <section className="glass-card p-5 sm:p-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-[rgba(79,125,243,0.14)] text-xs uppercase tracking-wide text-text-muted">
                <th className="py-3 pr-4 font-semibold">Rank</th>
                <th className="py-3 pr-4 font-semibold">Student Name</th>
                <th className="py-3 pr-4 font-semibold">Exam Count</th>
                <th className="py-3 pr-4 font-semibold">Average Score</th>
                <th className="py-3 pr-4 font-semibold">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {data.map(row => (
                <tr key={`${row.rank}-${row.studentName}`} className="border-b border-[rgba(79,125,243,0.08)] last:border-0">
                  <td className="py-4 pr-4 text-xl font-extrabold text-accent-blue">#{row.rank}</td>
                  <td className="py-4 pr-4 font-semibold">{row.studentName}</td>
                  <td className="py-4 pr-4 text-text-secondary">{row.examCount}</td>
                  <td className="py-4 pr-4 text-text-secondary">{row.averageScore}</td>
                  <td className="py-4 pr-4 font-bold text-accent-cyan">{row.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  )
}

export default LeaderboardPage
