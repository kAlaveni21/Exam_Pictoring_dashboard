import { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'

export const fallbackExams = [
  { _id: 'java-test', title: 'Java Test', startTime: '2026-08-25T10:00:00', duration: 60, assignedStudents: Array(120).fill(''), isActive: true },
  { _id: 'dbms-quiz', title: 'DBMS Quiz', startTime: '2026-08-28T14:00:00', duration: 45, assignedStudents: Array(95).fill(''), isActive: true },
  { _id: 'os-midterm', title: 'Operating Systems Midterm', startTime: '2026-06-03T09:30:00', duration: 90, assignedStudents: Array(135).fill(''), isActive: false },
]

export const fallbackStudents = [
  { _id: 'st-101', name: 'John Mathew', email: 'john@example.com', studentId: 'CSE101', course: 'B.Tech CSE', department: 'CSE' },
  { _id: 'st-102', name: 'Alice George', email: 'alice@example.com', studentId: 'CSE102', course: 'B.Tech CSE', department: 'CSE' },
  { _id: 'st-103', name: 'Rahul Nair', email: 'rahul@example.com', studentId: 'CSE103', course: 'B.Tech CSE', department: 'CSE' },
  { _id: 'st-104', name: 'Meera Iyer', email: 'meera@example.com', studentId: 'CSE104', course: 'B.Tech CSE', department: 'CSE' },
]

export const fallbackAlerts = [
  { _id: 'al-1', studentName: 'Alice George', examTitle: 'Java Test', type: 'tab_switch', severity: 'high', message: 'Student switched tabs during exam.', createdAt: '2026-06-14T09:15:00' },
  { _id: 'al-2', studentName: 'John Mathew', examTitle: 'DBMS Quiz', type: 'no_face', severity: 'medium', message: 'Face was not detected for 18 seconds.', createdAt: '2026-06-14T09:22:00' },
  { _id: 'al-3', studentName: 'Rahul Nair', examTitle: 'Java Test', type: 'multiple_faces', severity: 'critical', message: 'Multiple faces detected in camera frame.', createdAt: '2026-06-14T09:31:00' },
]

const API_BASE = 'http://localhost:4000/api'

export const isActiveExam = (exam) => {
  if (exam.isActive === false) return false
  if (!exam.startTime) return true

  const start = new Date(exam.startTime)
  const end = exam.endTime
    ? new Date(exam.endTime)
    : new Date(start.getTime() + (exam.duration || 60) * 60 * 1000)
  const now = new Date()

  return now >= start && now <= end
}

export const formatDate = (value) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Not scheduled'
    : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const formatTime = (value) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '--'
    : date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

export const useAdminData = () => {
  const token = localStorage.getItem('token')
  const [exams, setExams] = useState([])
  const [students, setStudents] = useState([])
  const [alerts, setAlerts] = useState([])
  const [activeStudents, setActiveStudents] = useState({ count: 0, students: [], submitted: [] })
  const [loading, setLoading] = useState(true)

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token])

  const refresh = useCallback(async () => {
    setLoading(true)
    const requests = await Promise.allSettled([
      axios.get(`${API_BASE}/exams`, { headers: authHeaders }),
      axios.get(`${API_BASE}/auth/students`, { headers: authHeaders }),
      axios.get(`${API_BASE}/alerts`, { headers: authHeaders }),
      axios.get(`${API_BASE}/active-students`),
    ])

    if (requests[0].status === 'fulfilled') setExams(requests[0].value.data || [])
    if (requests[1].status === 'fulfilled') setStudents(requests[1].value.data || [])
    if (requests[2].status === 'fulfilled') setAlerts(requests[2].value.data || [])
    if (requests[3].status === 'fulfilled') setActiveStudents(requests[3].value.data || { count: 0, students: [], submitted: [] })
    setLoading(false)
  }, [authHeaders])

  useEffect(() => {
    const timer = setTimeout(refresh, 0)
    return () => clearTimeout(timer)
  }, [refresh])

  const displayExams = exams.length ? exams : fallbackExams
  const displayStudents = students.length ? students : fallbackStudents
  const displayAlerts = alerts.length ? alerts : fallbackAlerts

  return {
    activeStudents,
    alerts: displayAlerts,
    exams: displayExams,
    loading,
    rawAlerts: alerts,
    rawExams: exams,
    rawStudents: students,
    refresh,
    students: displayStudents,
  }
}
