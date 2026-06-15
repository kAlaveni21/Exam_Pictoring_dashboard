import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import StudentDashboard from './pages/StudentDashboard'
import ExamPage from './pages/ExamPage'
import AdminDashboard from './pages/AdminDashboard'
import CreateExamPage from './pages/CreateExamPage'
import ManageExamsPage from './pages/ManageExamsPage'
import LiveProctoringPage from './pages/LiveProctoringPage'
import StudentsPage from './pages/StudentsPage'
import ResultsPage from './pages/ResultsPage'
import ReportsPage from './pages/ReportsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import NotificationsPage from './pages/NotificationsPage'
import ProfilePage from './pages/ProfilePage'
import ExamCalendarPage from './pages/ExamCalendarPage'
import LeaderboardPage from './pages/LeaderboardPage'
import QuestionAnalysisPage from './pages/QuestionAnalysisPage'
import ActivityLogsPage from './pages/ActivityLogsPage'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Student Routes */}
      <Route path="/student" element={
        <ProtectedRoute role="student">
          <StudentDashboard />
        </ProtectedRoute>
      } />
      <Route path="/exam/:examId" element={
        <ProtectedRoute role="student">
          <ExamPage />
        </ProtectedRoute>
      } />

      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute role="admin">
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/create-exam" element={
        <ProtectedRoute role="admin">
          <CreateExamPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/edit-exam/:examId" element={
        <ProtectedRoute role="admin">
          <CreateExamPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/manage-exams" element={
        <ProtectedRoute role="admin">
          <ManageExamsPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/live-proctoring" element={
        <ProtectedRoute role="admin">
          <LiveProctoringPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/exam-calendar" element={
        <ProtectedRoute role="admin">
          <ExamCalendarPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/students" element={
        <ProtectedRoute role="admin">
          <StudentsPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/results" element={
        <ProtectedRoute role="admin">
          <ResultsPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/reports" element={
        <ProtectedRoute role="admin">
          <ReportsPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/leaderboard" element={
        <ProtectedRoute role="admin">
          <LeaderboardPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/analytics" element={
        <ProtectedRoute role="admin">
          <AnalyticsPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/question-analysis" element={
        <ProtectedRoute role="admin">
          <QuestionAnalysisPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/activity-logs" element={
        <ProtectedRoute role="admin">
          <ActivityLogsPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/notifications" element={
        <ProtectedRoute role="admin">
          <NotificationsPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/profile" element={
        <ProtectedRoute role="admin">
          <ProfilePage />
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
