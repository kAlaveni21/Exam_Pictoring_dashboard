import { useState } from 'react'
import axios from 'axios'
import * as faceapi from 'face-api.js'
import { FiCamera, FiCheckCircle } from 'react-icons/fi'

const FaceVerification = ({ videoRef, examId, examTitle, token, modelsLoaded, cameraReady, onVerified }) => {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('Verify your face before starting the exam.')

  const verifyFace = async () => {
    setLoading(true)
    try {
      const video = videoRef.current
      if (!cameraReady || !video || video.readyState < 2 || !video.videoWidth) {
        setStatus('Camera preview is not ready yet. Keep your face visible and try again.')
        onVerified(false)
        return
      }

      if (!modelsLoaded || !faceapi.nets.tinyFaceDetector.isLoaded) {
        setStatus('Face verification model is still loading. Try again in a moment.')
        onVerified(false)
        return
      }

      const detection = await faceapi.detectSingleFace(
        video,
        new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.3 })
      )
      const confidence = detection?.score || 0

      const res = await axios.post('http://localhost:4000/api/admin/face-verification', {
        examId,
        examTitle,
        faceDetected: Boolean(detection),
        confidence,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setStatus(res.data.message)
      onVerified(Boolean(res.data.verified))
    } catch (err) {
      setStatus(err.response?.data?.message || 'Face verification failed.')
      onVerified(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-[rgba(79,125,243,0.15)] bg-bg-secondary p-4 text-left">
      <div className="mb-3 flex items-center gap-2 font-semibold">
        <FiCamera className="text-accent-blue" />
        Face Verification
      </div>
      <p className="mb-3 text-sm text-text-secondary">{status}</p>
      <button
        type="button"
        onClick={verifyFace}
        disabled={loading || !cameraReady || !modelsLoaded}
        className="btn-primary inline-flex items-center gap-2 !px-4 !py-2.5 text-sm"
      >
        <FiCheckCircle size={15} />
        {loading ? 'Verifying...' : 'Verify Face'}
      </button>
    </div>
  )
}

export default FaceVerification
