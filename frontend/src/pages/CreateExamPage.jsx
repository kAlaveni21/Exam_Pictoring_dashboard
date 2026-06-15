import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../components/Navbar'
import { FiPlus, FiTrash2, FiSave, FiArrowLeft, FiCheckCircle, FiCopy, FiUpload } from 'react-icons/fi'

const CreateExamPage = () => {
  const navigate = useNavigate()
  const { examId } = useParams()
  const token = localStorage.getItem('token')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [students, setStudents] = useState([])
  const [templates, setTemplates] = useState([])
  const [templateName, setTemplateName] = useState('')

  const [exam, setExam] = useState({
    title: '',
    description: '',
    duration: 30,
    startTime: '',
    endTime: '',
    assignedStudents: [],
    questions: [
      {
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0
      }
    ]
  })

  const isEditMode = Boolean(examId)

  const parseBulkQuestionFile = (text) => {
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
    const [, ...rows] = lines[0]?.toLowerCase().includes('question') ? lines : ['', ...lines]

    return rows.map((line) => {
      const columns = line.split(',').map(value => value.trim().replace(/^"|"$/g, ''))
      const correctValue = columns[5] || '0'
      const correctAnswer = /^[a-d]$/i.test(correctValue)
        ? correctValue.toUpperCase().charCodeAt(0) - 65
        : Number(correctValue)

      return {
        question: columns[0] || '',
        options: [columns[1], columns[2], columns[3], columns[4]].filter(Boolean),
        correctAnswer: Number.isNaN(correctAnswer) ? 0 : correctAnswer,
        topic: columns[6] || 'General',
        difficulty: ['easy', 'medium', 'hard'].includes((columns[7] || '').toLowerCase())
          ? columns[7].toLowerCase()
          : 'medium',
      }
    }).filter(question =>
      question.question &&
      question.options.length >= 2 &&
      question.correctAnswer >= 0 &&
      question.correctAnswer < question.options.length
    )
  }

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.get('http://localhost:4000/api/auth/students', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setStudents(res.data)
      } catch (err) {
        console.error('Error fetching students:', err)
      }
    }

    fetchStudents()
  }, [token])

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await axios.get('http://localhost:4000/api/templates', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setTemplates(res.data)
      } catch (err) {
        console.error('Error fetching templates:', err)
      }
    }

    fetchTemplates()
  }, [token])

  useEffect(() => {
    if (!examId) return

    const formatDateTimeLocal = (value) => {
      if (!value) return ''
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return ''
      const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      return offsetDate.toISOString().slice(0, 16)
    }

    const fetchExam = async () => {
      try {
        const res = await axios.get(`http://localhost:4000/api/exams/${examId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setExam({
          title: res.data.title || '',
          description: res.data.description || '',
          duration: res.data.duration || 30,
          startTime: formatDateTimeLocal(res.data.startTime),
          endTime: formatDateTimeLocal(res.data.endTime),
          assignedStudents: (res.data.assignedStudents || []).map(student => student._id || student),
          questions: res.data.questions?.length
            ? res.data.questions.map(question => ({
                question: question.question || '',
                options: question.options?.length ? question.options : ['', '', '', ''],
                correctAnswer: question.correctAnswer || 0,
                topic: question.topic || 'General',
                difficulty: question.difficulty || 'medium',
              }))
            : [{ question: '', options: ['', '', '', ''], correctAnswer: 0 }],
        })
      } catch (err) {
        console.error('Error fetching exam:', err)
        setError(err.response?.data?.message || 'Unable to load exam for editing.')
      }
    }

    fetchExam()
  }, [examId, token])

  const handleAddQuestion = () => {
    setExam({
      ...exam,
      questions: [
        ...exam.questions,
        { question: '', options: ['', '', '', ''], correctAnswer: 0 }
      ]
    })
  }

  const handleRemoveQuestion = (index) => {
    const newQuestions = [...exam.questions]
    newQuestions.splice(index, 1)
    setExam({ ...exam, questions: newQuestions })
  }

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...exam.questions]
    newQuestions[index][field] = value
    setExam({ ...exam, questions: newQuestions })
  }

  const handleOptionChange = (qIndex, oIndex, value) => {
    const newQuestions = [...exam.questions]
    newQuestions[qIndex].options[oIndex] = value
    setExam({ ...exam, questions: newQuestions })
  }

  const handleStudentToggle = (studentId) => {
    const assignedStudents = exam.assignedStudents.includes(studentId)
      ? exam.assignedStudents.filter(id => id !== studentId)
      : [...exam.assignedStudents, studentId]

    setExam({ ...exam, assignedStudents })
  }

  const handleBulkUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!['csv', 'xls'].includes(extension)) {
      setError('Please upload a CSV or Excel-compatible .xls file.')
      return
    }

    try {
      const text = await file.text()
      const questions = parseBulkQuestionFile(text)
      if (!questions.length) {
        setError('No valid questions found. Use columns: question, optionA, optionB, optionC, optionD, correctAnswer, topic, difficulty.')
        return
      }

      setExam(prev => ({
        ...prev,
        questions: [
          ...prev.questions.filter(question => question.question.trim()),
          ...questions,
        ],
      }))
      setError('')
    } catch (err) {
      console.error('Bulk upload error:', err)
      setError('Unable to parse uploaded question file.')
    } finally {
      event.target.value = ''
    }
  }

  const handleSaveTemplate = async () => {
    const name = templateName.trim() || exam.title.trim()
    if (!name) {
      setError('Enter an exam title or template name before saving a template.')
      return
    }

    try {
      const res = await axios.post('http://localhost:4000/api/templates', {
        name,
        description: exam.description,
        duration: exam.duration,
        questions: exam.questions,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setTemplates(prev => [res.data, ...prev])
      setTemplateName('')
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save template.')
    }
  }

  const handleApplyTemplate = (templateId) => {
    const template = templates.find(item => item._id === templateId)
    if (!template) return

    setExam(prev => ({
      ...prev,
      title: prev.title || template.name,
      description: template.description || prev.description,
      duration: template.duration || prev.duration,
      questions: template.questions?.length ? template.questions : prev.questions,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate
    if (!exam.title.trim()) {
      setError('Exam title is required')
      setLoading(false)
      return
    }
    
    for (let i = 0; i < exam.questions.length; i++) {
      const q = exam.questions[i];
      if (!q.question.trim()) {
        setError(`Question ${i + 1} text is required`)
        setLoading(false)
        return
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) {
          setError(`Option ${j + 1} for Question ${i + 1} is required`)
          setLoading(false)
          return
        }
      }
    }

    try {
      const request = isEditMode
        ? axios.put(`http://localhost:4000/api/exams/${examId}`, exam, {
            headers: { Authorization: `Bearer ${token}` }
          })
        : axios.post('http://localhost:4000/api/exams', exam, {
            headers: { Authorization: `Bearer ${token}` }
          })

      await request
      navigate('/admin')
    } catch (err) {
      console.error('Error saving exam:', err)
      setError(err.response?.data?.message || 'Error saving exam')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />
      
      <div className="max-w-4xl mx-auto py-10 px-6">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate('/admin')}
            className="p-2 rounded-full hover:bg-bg-secondary text-text-secondary transition-colors"
          >
            <FiArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold gradient-text">{isEditMode ? 'Edit Exam' : 'Create New Exam'}</h1>
            <p className="text-text-secondary text-sm mt-1">
              {isEditMode ? 'Update exam details, schedule, assigned students, and questions.' : 'Configure exam details and add multiple-choice questions.'}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in-up">
          {/* Exam Details Section */}
          <div className="glass-card p-8">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <FiCheckCircle className="text-accent-blue" />
              Exam Configuration
            </h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm text-text-secondary mb-2">Exam Title</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g., Advanced React Patterns"
                  value={exam.title}
                  onChange={(e) => setExam({...exam, title: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-2">Description</label>
                <textarea
                  className="input-field min-h-[100px] resize-y"
                  placeholder="Describe the topics covered in this exam..."
                  value={exam.description}
                  onChange={(e) => setExam({...exam, description: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  required
                  min="1"
                  className="input-field max-w-[200px]"
                  value={exam.duration}
                  onChange={(e) => setExam({...exam, duration: parseInt(e.target.value) || 30})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-text-secondary mb-2">Start Time</label>
                  <input
                    type="datetime-local"
                    className="input-field"
                    value={exam.startTime}
                    onChange={(e) => setExam({...exam, startTime: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-2">End Time</label>
                  <input
                    type="datetime-local"
                    className="input-field"
                    value={exam.endTime}
                    onChange={(e) => setExam({...exam, endTime: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm text-text-secondary">Assign Students</label>
                  <button
                    type="button"
                    onClick={() => setExam({...exam, assignedStudents: students.map(student => student._id)})}
                    className="text-sm text-accent-blue font-semibold"
                  >
                    Select All
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-52 overflow-y-auto rounded-md border border-[rgba(79,125,243,0.15)] bg-bg-secondary p-3">
                  {students.length === 0 ? (
                    <p className="text-sm text-text-muted">No students found.</p>
                  ) : (
                    students.map((student) => (
                      <label key={student._id} className="flex items-center gap-3 rounded-md border border-[rgba(79,125,243,0.12)] bg-bg-card px-3 py-2 text-sm text-text-secondary">
                        <input
                          type="checkbox"
                          checked={exam.assignedStudents.includes(student._id)}
                          onChange={() => handleStudentToggle(student._id)}
                        />
                        <span>{student.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold mb-5 flex items-center gap-2">
              <FiCopy className="text-accent-blue" />
              Templates & Bulk Upload
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-[rgba(79,125,243,0.14)] bg-bg-secondary p-4">
                <label className="block text-sm text-text-secondary mb-2">Reuse Exam Template</label>
                <select className="input-field" defaultValue="" onChange={(event) => handleApplyTemplate(event.target.value)}>
                  <option value="">Select template</option>
                  {templates.map(template => (
                    <option key={template._id} value={template._id}>{template.name}</option>
                  ))}
                </select>
                <div className="mt-4 flex gap-3">
                  <input
                    value={templateName}
                    onChange={(event) => setTemplateName(event.target.value)}
                    className="input-field !py-2.5"
                    placeholder="Template name"
                  />
                  <button type="button" onClick={handleSaveTemplate} className="btn-primary inline-flex items-center gap-2 !px-4 !py-2.5 text-sm">
                    <FiSave size={15} />
                    Save
                  </button>
                </div>
              </div>
              <div className="rounded-lg border border-[rgba(79,125,243,0.14)] bg-bg-secondary p-4">
                <label className="block text-sm text-text-secondary mb-2">Bulk Question Upload</label>
                <p className="mb-3 text-xs text-text-muted">CSV/.xls columns: question, optionA, optionB, optionC, optionD, correctAnswer, topic, difficulty.</p>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-[rgba(79,125,243,0.25)] bg-bg-card px-4 py-2.5 text-sm font-semibold text-accent-blue">
                  <FiUpload size={15} />
                  Upload CSV or Excel
                  <input type="file" accept=".csv,.xls" onChange={handleBulkUpload} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          {/* Questions Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Questions ({exam.questions.length})</h2>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="flex items-center gap-2 px-4 py-2 bg-accent-blue/10 text-accent-blue border border-accent-blue/30 rounded-md hover:bg-accent-blue/20 transition-colors text-sm font-semibold"
              >
                <FiPlus size={16} />
                Add Question
              </button>
            </div>

            <div className="space-y-6">
              {exam.questions.map((q, qIndex) => (
                <div key={qIndex} className="glass-card p-6 relative group">
                  {exam.questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIndex)}
                      className="absolute top-6 right-6 text-text-muted hover:text-accent-red transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove Question"
                    >
                      <FiTrash2 size={20} />
                    </button>
                  )}
                  
                  <div className="mb-6 pr-8">
                    <label className="block text-sm font-semibold mb-2">
                      <span className="text-accent-blue mr-2">Q{qIndex + 1}.</span>
                      Question Text
                    </label>
                    <input
                      type="text"
                      required
                      className="input-field"
                      placeholder="Enter question here..."
                      value={q.question}
                      onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {q.options.map((opt, oIndex) => (
                      <div key={oIndex} className="relative">
                        <label className="block text-xs text-text-secondary mb-1">
                          Option {String.fromCharCode(65 + oIndex)}
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name={`correct-${qIndex}`}
                            checked={q.correctAnswer === oIndex}
                            onChange={() => handleQuestionChange(qIndex, 'correctAnswer', oIndex)}
                            className="w-4 h-4 text-accent-blue cursor-pointer"
                            title="Mark as correct answer"
                          />
                          <input
                            type="text"
                            required
                            className={`input-field !py-2.5 ${q.correctAnswer === oIndex ? '!border-accent-blue/50 bg-accent-blue/5' : ''}`}
                            placeholder={`Option ${oIndex + 1}`}
                            value={opt}
                            onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-xs text-text-secondary mb-1">Topic</label>
                      <input
                        type="text"
                        className="input-field !py-2.5"
                        placeholder="e.g., JavaScript Basics"
                        value={q.topic || ''}
                        onChange={(e) => handleQuestionChange(qIndex, 'topic', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-text-secondary mb-1">Difficulty</label>
                      <select
                        className="input-field !py-2.5"
                        value={q.difficulty || 'medium'}
                        onChange={(e) => handleQuestionChange(qIndex, 'difficulty', e.target.value)}
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-xs text-text-secondary flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent-blue"></span>
                    Select the radio button next to the correct answer.
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[rgba(255,255,255,0.1)] flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              <FiSave size={18} />
              {loading ? 'Saving Exam...' : isEditMode ? 'Update Exam' : 'Save & Publish Exam'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateExamPage
