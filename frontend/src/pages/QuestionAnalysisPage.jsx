import { useEffect, useState } from 'react'
import axios from 'axios'
import AdminShell from '../components/admin/AdminShell'
import { BarChart, SectionHeader, StatCard, StatusPill } from '../components/admin/AdminWidgets'
import { FiBarChart2, FiCheckCircle, FiHelpCircle, FiXCircle } from 'react-icons/fi'

const fallback = {
  mostCorrect: [
    { question: 'Which keyword declares a constant?', correct: 22, incorrect: 3, accuracy: 88, difficulty: 'easy' },
    { question: 'What does === check?', correct: 18, incorrect: 5, accuracy: 78, difficulty: 'medium' },
  ],
  mostIncorrect: [
    { question: 'What is a closure?', correct: 8, incorrect: 17, accuracy: 32, difficulty: 'hard' },
    { question: 'What is typeof null?', correct: 10, incorrect: 14, accuracy: 42, difficulty: 'medium' },
  ],
  difficulty: [
    { level: 'easy', count: 8, accuracy: 86 },
    { level: 'medium', count: 12, accuracy: 68 },
    { level: 'hard', count: 5, accuracy: 41 },
  ],
  questions: [],
}

const QuestionAnalysisPage = () => {
  const [analysis, setAnalysis] = useState(fallback)
  const token = localStorage.getItem('token')

  useEffect(() => {
    axios.get('http://localhost:4000/api/admin/question-analysis', {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      if (res.data.questions?.length) setAnalysis(res.data)
    }).catch(() => setAnalysis(fallback))
  }, [token])

  const allQuestions = [...analysis.mostCorrect, ...analysis.mostIncorrect]
  const avgAccuracy = Math.round(allQuestions.reduce((sum, item) => sum + (item.accuracy || 0), 0) / Math.max(allQuestions.length, 1))

  return (
    <AdminShell>
      <SectionHeader icon={FiHelpCircle} title="Question Analysis" subtitle="Identify accurate, difficult, and frequently missed questions." />

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard icon={FiHelpCircle} label="Analysed Questions" value={analysis.questions?.length || allQuestions.length} detail="Questions with attempts" />
        <StatCard icon={FiCheckCircle} label="Most Correct" value={analysis.mostCorrect[0]?.correct || 0} detail="Highest correct count" tone="bg-[linear-gradient(135deg,#06d6a0,#22d3ee)]" />
        <StatCard icon={FiXCircle} label="Most Incorrect" value={analysis.mostIncorrect[0]?.incorrect || 0} detail="Highest miss count" tone="bg-[linear-gradient(135deg,#ef4444,#ec4899)]" />
        <StatCard icon={FiBarChart2} label="Avg Accuracy" value={`${avgAccuracy}%`} detail="Across analysed rows" tone="bg-[linear-gradient(135deg,#f59e0b,#ec4899)]" />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="glass-card p-5 sm:p-6">
          <h2 className="mb-5 text-lg font-bold">Difficulty Accuracy</h2>
          <BarChart data={analysis.difficulty.map(item => ({ label: item.level, value: item.accuracy || 0, display: `${item.accuracy || 0}%` }))} />
        </div>
        <div className="glass-card p-5 sm:p-6 xl:col-span-2">
          <h2 className="mb-5 text-lg font-bold">Most Correctly Answered</h2>
          <div className="grid gap-3">
            {analysis.mostCorrect.map((item, index) => (
              <div key={`${item.question}-${index}`} className="rounded-lg border border-[rgba(79,125,243,0.12)] bg-bg-secondary p-4">
                <div className="flex items-start justify-between gap-4">
                  <p className="font-semibold">{item.question}</p>
                  <StatusPill tone="cyan">{item.accuracy}%</StatusPill>
                </div>
                <p className="mt-2 text-sm text-text-muted">Correct: {item.correct} · Incorrect: {item.incorrect} · Difficulty: {item.difficulty}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-card p-5 sm:p-6 xl:col-span-3">
          <h2 className="mb-5 text-lg font-bold">Most Incorrectly Answered</h2>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {analysis.mostIncorrect.map((item, index) => (
              <div key={`${item.question}-${index}`} className="rounded-lg border border-[rgba(239,68,68,0.16)] bg-bg-secondary p-4">
                <div className="flex items-start justify-between gap-4">
                  <p className="font-semibold">{item.question}</p>
                  <StatusPill tone="orange">{item.accuracy}% accuracy</StatusPill>
                </div>
                <p className="mt-2 text-sm text-text-muted">Correct: {item.correct} · Incorrect: {item.incorrect} · Difficulty: {item.difficulty}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AdminShell>
  )
}

export default QuestionAnalysisPage
