import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import * as faceapi from 'face-api.js'
import { io } from 'socket.io-client'
import Navbar from '../components/Navbar'
import FaceVerification from '../components/FaceVerification'
import OtpVerification from '../components/OtpVerification'
import { getDeviceInfo } from '../utils/deviceInfo'
import { FiCamera, FiAlertTriangle, FiClock, FiSend, FiCheck, FiX, FiEye } from 'react-icons/fi'

const ExamPage = () => {
  const { examId } = useParams()
  const navigate = useNavigate()
  const previewVideoRef = useRef(null)
  const proctorVideoRef = useRef(null)
  const canvasRef = useRef(null)
  const cameraStreamRef = useRef(null)
  const socketRef = useRef(null)
  const detectionIntervalRef = useRef(null)
  const timerRef = useRef(null)

  const [exam, setExam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const [cameraRequested, setCameraRequested] = useState(false)
  const [examStarted, setExamStarted] = useState(false)
  const [answers, setAnswers] = useState({})
  const [currentQ, setCurrentQ] = useState(0)
  const [alerts, setAlerts] = useState([])
  const [timeLeft, setTimeLeft] = useState(0)
  const [result, setResult] = useState(null)
  const [faceStatus, setFaceStatus] = useState('waiting') // waiting, ok, no_face, multiple_faces
  const [otpVerified, setOtpVerified] = useState(false)
  const [faceVerified, setFaceVerified] = useState(false)
  const [examStartedAt, setExamStartedAt] = useState(null)

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const token = localStorage.getItem('token')

  const getCameraErrorMessage = (err) => {
    const errorName = err?.name || ''
    const errorMessage = err?.message || String(err || '')
    const errorText = `${errorName} ${errorMessage}`.toLowerCase()

    if (!navigator.mediaDevices?.getUserMedia) {
      return 'Camera access is not available in this browser.'
    }

    if (window.isSecureContext === false) {
      return 'Camera access requires HTTPS or localhost. Open this app from localhost or serve it over HTTPS.'
    }

    if (
      errorText.includes('notallowed') ||
      errorText.includes('security') ||
      errorText.includes('permission') ||
      errorText.includes('denied')
    ) {
      return 'Camera permission denied. Allow camera access in the browser address bar or site settings, then click Retry.'
    }

    if (errorText.includes('notfound') || errorText.includes('device') || errorText.includes('devices')) {
      return 'No webcam detected. Connect a camera, then click Retry.'
    }

    if (errorText.includes('notreadable') || errorText.includes('trackstart') || errorText.includes('use')) {
      return 'Camera is in use by another app or browser tab. Close it, then click Retry.'
    }

    if (errorText.includes('overconstrained') || errorText.includes('constraint')) {
      return 'The selected camera does not support the requested settings. Try another camera or click Retry.'
    }

    return errorMessage || 'Unable to start the camera.'
  }

  // Handle attaching stream to preview video
  useEffect(() => {
    const video = previewVideoRef.current
    if (video && cameraStreamRef.current) {
      video.srcObject = cameraStreamRef.current
      video.play().catch((err) => {
        console.warn('Preview video play deferred/failed:', err)
      })
    }
  }, [cameraRequested, cameraReady])

  // Handle attaching stream to proctor video
  useEffect(() => {
    const video = proctorVideoRef.current
    if (video && cameraStreamRef.current) {
      video.srcObject = cameraStreamRef.current
      video.play().catch((err) => {
        console.warn('Proctor video play deferred/failed:', err)
      })
    }
  }, [examStarted])

  const stopCameraStream = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop())
      cameraStreamRef.current = null
    }

    if (previewVideoRef.current) {
      previewVideoRef.current.srcObject = null
    }
    if (proctorVideoRef.current) {
      proctorVideoRef.current.srcObject = null
    }

    setCameraReady(false)
  }, [])

  const startCamera = useCallback(async () => {
    setCameraRequested(true)
    setCameraError(null)
    setCameraReady(false)
    stopCameraStream()

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      })

      cameraStreamRef.current = stream

      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = stream
        previewVideoRef.current.play().catch(err => {
          console.warn('Preview video play deferred:', err)
        })
      }

      setCameraReady(true)
    } catch (err) {
      console.warn('Camera initialization error:', err)
      setCameraError(getCameraErrorMessage(err))
    }
  }, [stopCameraStream])

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models'
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
        ])
        setModelsLoaded(true)
        console.log('✅ Face detection models loaded')
      } catch (err) {
        console.error('Error loading face models:', err)
        setModelsLoaded(false)
      }
    }
    loadModels()
  }, [])

  // Fetch exam
  useEffect(() => {
    const fetchExam = async () => {
      try {
        const res = await axios.get(`http://localhost:4000/api/exams/${examId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setExam(res.data)
        setTimeLeft(res.data.duration * 60) // convert minutes to seconds
      } catch (err) {
        console.error('Error fetching exam:', err)
        alert('Exam not found!')
        navigate('/student')
      } finally {
        setLoading(false)
      }
    }
    fetchExam()
  }, [examId])

  // Socket connection
  useEffect(() => {
    socketRef.current = io('http://localhost:4000')

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('student-leave-exam')
        socketRef.current.disconnect()
      }
    }
  }, [])

  useEffect(() => {
    return () => {
      stopCameraStream()
    }
  }, [stopCameraStream])

  // Timer
  useEffect(() => {
    if (!examStarted || timeLeft <= 0) return

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          handleSubmitExam()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [examStarted])

  // Tab switch detection
  useEffect(() => {
    if (!examStarted) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        sendAlert('tab_switch', 'Student switched to another tab', 'high')
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [examStarted])

  // Send alert helper
  const sendAlert = useCallback((type, message, severity = 'medium') => {
    const alertData = {
      studentId: user.id,
      studentName: user.name,
      examId,
      examTitle: exam?.title,
      type,
      message,
      severity,
      deviceInfo: getDeviceInfo(),
    }

    // Add to local alerts
    setAlerts(prev => [{
      ...alertData,
      timestamp: new Date().toISOString()
    }, ...prev].slice(0, 20))

    // Send via socket (real-time)
    if (socketRef.current) {
      socketRef.current.emit('proctor-alert', alertData)
    }

    // Also save to DB
    axios.post('http://localhost:4000/api/alerts', alertData, {
      headers: { Authorization: `Bearer ${token}` }
    }).catch(err => console.error('Error saving alert:', err))
  }, [user, examId, exam, token])

  // Face detection loop
  const startFaceDetection = useCallback(() => {
    if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current)

    let noFaceCount = 0
    let multiFaceCount = 0

    detectionIntervalRef.current = setInterval(async () => {
      const video = proctorVideoRef.current
      if (!video || !faceapi.nets.tinyFaceDetector.isLoaded) return
      if (video.readyState !== 4) return

      try {
        const detections = await faceapi.detectAllFaces(
          video,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
        )

        if (detections.length === 0) {
          noFaceCount++
          multiFaceCount = 0
          setFaceStatus('no_face')

          // Alert after 3 consecutive no-face detections (~3 seconds)
          if (noFaceCount >= 3) {
            sendAlert('no_face', 'No face detected in camera frame', 'high')
            noFaceCount = 0
          }
        } else if (detections.length > 1) {
          multiFaceCount++
          noFaceCount = 0
          setFaceStatus('multiple_faces')

          if (multiFaceCount >= 2) {
            sendAlert('multiple_faces', `${detections.length} faces detected in frame`, 'critical')
            multiFaceCount = 0
          }
        } else {
          noFaceCount = 0
          multiFaceCount = 0
          setFaceStatus('ok')
        }

        // Draw detections on canvas
        if (canvasRef.current) {
          const displaySize = { width: video.videoWidth, height: video.videoHeight }
          faceapi.matchDimensions(canvasRef.current, displaySize)
          const resized = faceapi.resizeResults(detections, displaySize)
          const ctx = canvasRef.current.getContext('2d')
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

          resized.forEach(det => {
            const box = det.box
            ctx.strokeStyle = detections.length === 1 ? '#06d6a0' : '#ef4444'
            ctx.lineWidth = 2
            ctx.strokeRect(box.x, box.y, box.width, box.height)
          })
        }
      } catch (err) {
        console.error('Face detection loop error:', err)
      }
    }, 1000)
  }, [sendAlert])

  // Start exam
  const handleStartExam = () => {
    if (!otpVerified || !faceVerified) {
      alert('Please complete OTP and face verification before starting the exam.')
      return
    }

    const startedAt = new Date()
    setExamStartedAt(startedAt)
    setExamStarted(true)

    axios.post('http://localhost:4000/api/admin/activity-logs', {
      examId,
      examTitle: exam?.title,
      type: 'exam_start',
      message: `Started ${exam?.title || 'exam'}.`,
      metadata: { deviceInfo: getDeviceInfo() },
    }, {
      headers: { Authorization: `Bearer ${token}` },
    }).catch(err => console.error('Error writing exam start log:', err))

    // Notify server
    if (socketRef.current) {
      socketRef.current.emit('student-join-exam', {
        studentId: user.id,
        studentName: user.name,
        examId,
        examTitle: exam?.title,
      })
    }

    // Start face detection
    startFaceDetection()
  }

  // Submit exam
  const handleSubmitExam = async () => {
    clearInterval(detectionIntervalRef.current)
    clearInterval(timerRef.current)
    stopCameraStream()

    try {
      const res = await axios.post(
        `http://localhost:4000/api/exams/${examId}/submit`,
        {
          answers,
          deviceInfo: getDeviceInfo(),
          durationSeconds: examStartedAt ? Math.floor((Date.now() - new Date(examStartedAt).getTime()) / 1000) : 0,
          startedAt: examStartedAt,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setResult(res.data)

      if (socketRef.current) {
        socketRef.current.emit('student-submit-exam', {
          studentId: user.id,
          studentName: user.name,
          examId,
          examTitle: exam?.title,
        })
        socketRef.current.emit('student-leave-exam')
      }
    } catch (err) {
      console.error('Submit error:', err)
      alert('Error submitting exam')
    }
  }

  // Format time
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const faceStatusConfig = {
    waiting: { color: 'var(--text-muted)', label: 'Waiting...', icon: '⏳' },
    ok: { color: 'var(--accent-cyan)', label: 'Face Detected', icon: '✅' },
    no_face: { color: 'var(--accent-red)', label: 'No Face!', icon: '🚫' },
    multiple_faces: { color: 'var(--accent-orange)', label: 'Multiple Faces!', icon: '👥' },
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>
          Loading exam...
        </div>
      </div>
    )
  }

  // Result screen
  if (result) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <Navbar />
        <div style={{
          maxWidth: '500px',
          margin: '80px auto',
          padding: '0 24px',
        }}>
          <div className="glass-card animate-fade-in-up" style={{
            padding: '48px',
            textAlign: 'center',
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: result.percentage >= 50 ? 'var(--gradient-success)' : 'var(--gradient-danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              {result.percentage >= 50 ? <FiCheck size={40} color="white" /> : <FiX size={40} color="white" />}
            </div>

            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '8px' }}>
              Exam Completed!
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
              Here are your results
            </p>

            <div style={{
              fontSize: '3.5rem',
              fontWeight: 900,
              marginBottom: '8px',
            }}>
              <span className="gradient-text">{result.percentage}%</span>
            </div>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '1.1rem',
              marginBottom: '32px',
            }}>
              {result.score} / {result.total} correct
            </p>

            <div style={{
              padding: '16px',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '28px',
              fontSize: '0.88rem',
              color: 'var(--text-secondary)',
            }}>
              ⚠️ Total alerts generated: <strong style={{ color: 'var(--accent-orange)' }}>{alerts.length}</strong>
            </div>

            <button
              className="btn-primary"
              onClick={() => navigate('/student')}
              style={{ width: '100%', padding: '14px' }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  const currentQuestion = exam?.questions?.[currentQ]

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '24px',
        display: 'grid',
        gridTemplateColumns: examStarted ? '1fr 340px' : '1fr',
        gap: '24px',
      }}>
        {/* Main Content */}
        <div>
          {/* Exam Header */}
          <div className="glass-card animate-fade-in-up" style={{
            padding: '24px 28px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '4px' }}>
                {exam?.title}
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                {exam?.questions?.length} questions · {exam?.duration} minutes
              </p>
            </div>

            {examStarted && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}>
                {/* Face Status */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-secondary)',
                  border: `1px solid ${faceStatusConfig[faceStatus].color}`,
                  fontSize: '0.82rem',
                  color: faceStatusConfig[faceStatus].color,
                  fontWeight: 600,
                }}>
                  {faceStatusConfig[faceStatus].icon} {faceStatusConfig[faceStatus].label}
                </div>

                {/* Timer */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-md)',
                  background: timeLeft < 60 ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-secondary)',
                  border: `1px solid ${timeLeft < 60 ? 'var(--accent-red)' : 'var(--border-color)'}`,
                  color: timeLeft < 60 ? 'var(--accent-red)' : 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  fontFamily: 'monospace',
                }}>
                  <FiClock size={18} />
                  {formatTime(timeLeft)}
                </div>
              </div>
            )}
          </div>

          {/* Pre-exam: Camera Setup */}
          {!examStarted && (
            <div className="glass-card animate-fade-in-up" style={{
              padding: '48px',
              textAlign: 'center',
            }}>
              <div style={{
                width: '480px',
                maxWidth: '100%',
                margin: '0 auto 24px',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                border: '2px solid var(--border-color)',
                position: 'relative',
                background: '#000',
              }}>
                {cameraRequested && (
                  <video
                    ref={previewVideoRef}
                    autoPlay
                    muted
                    playsInline
                    style={{ width: '100%', minHeight: '360px', display: 'block', objectFit: 'cover' }}
                  />
                )}
                {!cameraRequested && !cameraError && (
                  <div style={{
                    minHeight: '360px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-secondary)',
                    padding: '24px',
                  }}>
                    <FiCamera size={40} style={{ marginBottom: '14px' }} />
                    <button
                      className="btn-primary"
                      onClick={startCamera}
                      style={{ padding: '10px 24px', fontSize: '0.9rem' }}
                    >
                      Enable Camera
                    </button>
                  </div>
                )}
                {cameraRequested && !cameraReady && !cameraError && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-secondary)',
                  }}>
                    <FiCamera size={32} style={{ marginRight: '12px' }} />
                    Initializing camera...
                  </div>
                )}
                {cameraError && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(15, 15, 15, 0.95)',
                    color: 'var(--accent-red)',
                    padding: '24px',
                    textAlign: 'center'
                  }}>
                    <FiAlertTriangle size={36} style={{ marginBottom: '12px' }} />
                    <h4 style={{ fontWeight: 700, marginBottom: '6px', color: '#fff' }}>Camera Access Failed</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '16px', maxWidth: '380px', lineHeight: 1.4 }}>
                      {cameraError}
                    </p>
                    <button
                      className="btn-primary"
                      onClick={startCamera}
                      style={{ padding: '8px 20px', fontSize: '0.85rem' }}
                    >
                      Retry Camera Connection
                    </button>
                  </div>
                )}
              </div>

              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '8px' }}>
                Camera Check
              </h2>
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '0.92rem',
                marginBottom: '28px',
                maxWidth: '400px',
                margin: '0 auto 28px',
              }}>
                Make sure your face is clearly visible. Face detection will monitor you during the exam.
              </p>

              <div style={{
                display: 'grid',
                gap: '16px',
                maxWidth: '720px',
                margin: '0 auto 24px',
              }}>
                <OtpVerification
                  examId={examId}
                  token={token}
                  onVerified={setOtpVerified}
                />
                <FaceVerification
                  videoRef={previewVideoRef}
                  examId={examId}
                  examTitle={exam?.title}
                  token={token}
                  modelsLoaded={modelsLoaded}
                  cameraReady={cameraReady}
                  onVerified={setFaceVerified}
                />
              </div>

              <button
                className="btn-primary"
                onClick={handleStartExam}
                disabled={!cameraReady || !modelsLoaded || !otpVerified || !faceVerified}
                style={{ padding: '14px 48px', fontSize: '1.05rem' }}
              >
                {!modelsLoaded ? 'Loading AI Models...' : !cameraReady ? (cameraError ? 'Camera Error!' : 'Waiting for Camera...') : !otpVerified ? 'Verify OTP to Continue' : !faceVerified ? 'Verify Face to Continue' : 'Start Exam'}
              </button>
            </div>
          )}

          {/* Question Area */}
          {examStarted && currentQuestion && (
            <div className="glass-card animate-fade-in" style={{ padding: '36px' }}>
              {/* Progress */}
              <div style={{ marginBottom: '28px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                }}>
                  <span>Question {currentQ + 1} of {exam.questions.length}</span>
                  <span>{Math.round(((currentQ + 1) / exam.questions.length) * 100)}%</span>
                </div>
                <div style={{
                  height: '4px',
                  borderRadius: '4px',
                  background: 'var(--bg-secondary)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${((currentQ + 1) / exam.questions.length) * 100}%`,
                    background: 'var(--gradient-primary)',
                    borderRadius: '4px',
                    transition: 'width 0.4s ease',
                  }} />
                </div>
              </div>

              {/* Question */}
              <h3 style={{
                fontSize: '1.2rem',
                fontWeight: 600,
                marginBottom: '24px',
                lineHeight: 1.6,
              }}>
                {currentQuestion.question}
              </h3>

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                {currentQuestion.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => setAnswers({ ...answers, [currentQuestion._id]: idx })}
                    style={{
                      padding: '16px 20px',
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${answers[currentQuestion._id] === idx ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                      background: answers[currentQuestion._id] === idx ? 'rgba(79, 125, 243, 0.12)' : 'var(--bg-secondary)',
                      color: answers[currentQuestion._id] === idx ? 'var(--accent-blue)' : 'var(--text-primary)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      fontFamily: 'var(--font-sans)',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <span style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      border: `2px solid ${answers[currentQuestion._id] === idx ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      flexShrink: 0,
                      background: answers[currentQuestion._id] === idx ? 'var(--accent-blue)' : 'transparent',
                      color: answers[currentQuestion._id] === idx ? 'white' : 'var(--text-muted)',
                    }}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    {option}
                  </button>
                ))}
              </div>

              {/* Navigation */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '12px',
              }}>
                <button
                  onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
                  disabled={currentQ === 0}
                  style={{
                    padding: '12px 28px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    cursor: currentQ === 0 ? 'not-allowed' : 'pointer',
                    opacity: currentQ === 0 ? 0.4 : 1,
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 500,
                  }}
                >
                  ← Previous
                </button>

                {currentQ === exam.questions.length - 1 ? (
                  <button
                    className="btn-primary"
                    onClick={handleSubmitExam}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <FiSend size={18} />
                    Submit Exam
                  </button>
                ) : (
                  <button
                    className="btn-primary"
                    onClick={() => setCurrentQ(Math.min(exam.questions.length - 1, currentQ + 1))}
                  >
                    Next →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Camera + Alerts (shown during exam) */}
        {examStarted && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Camera Feed */}
            <div className="glass-card" style={{ padding: '16px', position: 'relative' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}>
                <FiEye size={16} color="var(--accent-cyan)" />
                Proctoring Camera
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--accent-red)',
                  animation: 'pulse-ring 1.5s infinite',
                  marginLeft: 'auto',
                }} />
              </div>
              <div style={{
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                position: 'relative',
                border: `2px solid ${faceStatusConfig[faceStatus].color}`,
                transition: 'border-color 0.3s',
              }}>
                <video
                  ref={proctorVideoRef}
                  autoPlay
                  muted
                  playsInline
                  style={{ width: '100%', display: 'block', objectFit: 'cover' }}
                />
                <canvas
                  ref={canvasRef}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                  }}
                />
              </div>
            </div>

            {/* Alerts Feed */}
            <div className="glass-card" style={{
              padding: '16px',
              flex: 1,
              maxHeight: '400px',
              overflow: 'hidden',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}>
                <FiAlertTriangle size={16} color="var(--accent-orange)" />
                Alerts ({alerts.length})
              </div>

              <div style={{
                overflowY: 'auto',
                maxHeight: '340px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}>
                {alerts.length === 0 ? (
                  <p style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.82rem',
                    textAlign: 'center',
                    padding: '20px',
                  }}>
                    No alerts yet ✓
                  </p>
                ) : (
                  alerts.map((alert, idx) => (
                    <div key={idx} className="animate-slide-in" style={{
                      padding: '10px 14px',
                      background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-sm)',
                      borderLeft: `3px solid ${
                        alert.severity === 'critical' ? 'var(--accent-red)' :
                        alert.severity === 'high' ? 'var(--accent-orange)' :
                        'var(--accent-blue)'
                      }`,
                      fontSize: '0.78rem',
                    }}>
                      <p style={{ fontWeight: 600, marginBottom: '2px' }}>
                        {alert.type === 'no_face' ? '🚫' :
                         alert.type === 'multiple_faces' ? '👥' :
                         alert.type === 'tab_switch' ? '⚠️' : '👀'}{' '}
                        {alert.message}
                      </p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ExamPage
