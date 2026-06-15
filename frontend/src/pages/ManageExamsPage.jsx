import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import AdminShell from '../components/admin/AdminShell'
import { IconButton, SectionHeader, StatCard, StatusPill } from '../components/admin/AdminWidgets'
import { formatDate, formatTime, isActiveExam, useAdminData } from '../hooks/useAdminData'
import { FiCalendar, FiEdit3, FiEye, FiFileText, FiPlus, FiTrash2 } from 'react-icons/fi'

const ManageExamsPage = () => {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const { exams, refresh } = useAdminData()
  const activeCount = exams.filter(isActiveExam).length

  const handleDelete = async (examId) => {
    if (examId.includes('-') || !window.confirm('Delete this exam? This action cannot be undone.')) return

    try {
      await axios.delete(`http://localhost:4000/api/exams/${examId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      refresh()
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to delete exam.')
    }
  }

  return (
    <AdminShell>
      <SectionHeader
        icon={FiFileText}
        title="Manage Exams"
        subtitle="Review schedules, edit exam settings, and remove outdated tests."
        action={
          <button type="button" onClick={() => navigate('/admin/create-exam')} className="btn-primary inline-flex items-center gap-2 !px-4 !py-2.5 text-sm">
            <FiPlus size={16} />
            Create Exam
          </button>
        }
      />

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={FiFileText} label="Total Exams" value={exams.length} detail="Published and scheduled exams" />
        <StatCard icon={FiCalendar} label="Active Exams" value={activeCount} detail="Open right now" tone="bg-[linear-gradient(135deg,#06d6a0,#22d3ee)]" />
        <StatCard icon={FiCalendar} label="Completed" value={Math.max(exams.length - activeCount, 0)} detail="Closed exam windows" tone="bg-[linear-gradient(135deg,#f59e0b,#ec4899)]" />
      </section>

      <section className="glass-card p-5 sm:p-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr className="border-b border-[rgba(79,125,243,0.14)] text-xs uppercase tracking-wide text-text-muted">
                <th className="py-3 pr-4 font-semibold">Exam Name</th>
                <th className="py-3 pr-4 font-semibold">Date</th>
                <th className="py-3 pr-4 font-semibold">Time</th>
                <th className="py-3 pr-4 font-semibold">Duration</th>
                <th className="py-3 pr-4 font-semibold">Status</th>
                <th className="py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam) => (
                <tr key={exam._id} className="border-b border-[rgba(79,125,243,0.08)] last:border-0">
                  <td className="py-4 pr-4 font-semibold">{exam.title}</td>
                  <td className="py-4 pr-4 text-text-secondary">{formatDate(exam.startTime || exam.createdAt)}</td>
                  <td className="py-4 pr-4 text-text-secondary">{formatTime(exam.startTime)}</td>
                  <td className="py-4 pr-4 text-text-secondary">{exam.duration || 30} min</td>
                  <td className="py-4 pr-4">
                    <StatusPill tone={isActiveExam(exam) ? 'cyan' : 'blue'}>{isActiveExam(exam) ? 'Active' : 'Scheduled'}</StatusPill>
                  </td>
                  <td className="py-4">
                    <div className="flex justify-end gap-2">
                      <IconButton icon={FiEye} label="View Exam" onClick={() => navigate(`/admin/edit-exam/${exam._id}`)} />
                      <IconButton icon={FiEdit3} label="Edit Exam" onClick={() => navigate(`/admin/edit-exam/${exam._id}`)} tone="cyan" />
                      <IconButton icon={FiTrash2} label="Delete Exam" onClick={() => handleDelete(exam._id)} tone="red" />
                    </div>
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

export default ManageExamsPage
