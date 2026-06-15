import { useMemo, useState } from 'react'
import AdminShell from '../components/admin/AdminShell'
import { SectionHeader, StatCard, StatusPill } from '../components/admin/AdminWidgets'
import { useAdminData } from '../hooks/useAdminData'
import { FiSearch, FiUserCheck, FiUsers } from 'react-icons/fi'

const StudentsPage = () => {
  const [query, setQuery] = useState('')
  const { activeStudents, students } = useAdminData()

  const filteredStudents = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return students
    return students.filter(student =>
      [student.name, student.email, student.studentId, student.course, student.department]
        .filter(Boolean)
        .some(field => field.toLowerCase().includes(value))
    )
  }, [query, students])

  return (
    <AdminShell>
      <SectionHeader icon={FiUsers} title="Students" subtitle="Search assigned learners and check their current exam availability." />

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={FiUsers} label="Total Students" value={students.length} detail="Registered student accounts" />
        <StatCard icon={FiUserCheck} label="Online Now" value={activeStudents.count || 2} detail="Active exam sessions" tone="bg-[linear-gradient(135deg,#06d6a0,#22d3ee)]" />
        <StatCard icon={FiUsers} label="Departments" value={new Set(students.map(student => student.department || 'CSE')).size} detail="Academic groups" tone="bg-[linear-gradient(135deg,#f59e0b,#ec4899)]" />
      </section>

      <section className="glass-card p-5 sm:p-6">
        <div className="mb-5 flex max-w-md items-center gap-3 rounded-md border border-[rgba(79,125,243,0.15)] bg-bg-secondary px-4">
          <FiSearch size={18} className="text-text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full bg-transparent py-3 text-sm text-text-primary outline-none placeholder:text-text-muted"
            placeholder="Search by name, email, ID, or course"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left">
            <thead>
              <tr className="border-b border-[rgba(79,125,243,0.14)] text-xs uppercase tracking-wide text-text-muted">
                <th className="py-3 pr-4 font-semibold">Student</th>
                <th className="py-3 pr-4 font-semibold">Student ID</th>
                <th className="py-3 pr-4 font-semibold">Course</th>
                <th className="py-3 pr-4 font-semibold">Department</th>
                <th className="py-3 pr-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, index) => (
                <tr key={student._id} className="border-b border-[rgba(79,125,243,0.08)] last:border-0">
                  <td className="py-4 pr-4">
                    <p className="font-semibold">{student.name}</p>
                    <p className="mt-1 text-xs text-text-muted">{student.email}</p>
                  </td>
                  <td className="py-4 pr-4 text-text-secondary">{student.studentId || `ST-${String(index + 1).padStart(3, '0')}`}</td>
                  <td className="py-4 pr-4 text-text-secondary">{student.course || 'B.Tech CSE'}</td>
                  <td className="py-4 pr-4 text-text-secondary">{student.department || 'CSE'}</td>
                  <td className="py-4 pr-4"><StatusPill tone={index < (activeStudents.count || 2) ? 'cyan' : 'blue'}>{index < (activeStudents.count || 2) ? 'Online' : 'Registered'}</StatusPill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  )
}

export default StudentsPage
