import { useState } from 'react'
import axios from 'axios'
import { FiCheckCircle, FiKey, FiRefreshCw } from 'react-icons/fi'

const OtpVerification = ({ examId, token, onVerified }) => {
  const [otp, setOtp] = useState('')
  const [devOtp, setDevOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('Request an OTP to unlock exam access.')

  const requestOtp = async () => {
    setLoading(true)
    try {
      const res = await axios.post('http://localhost:4000/api/admin/otp/request', { examId }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setDevOtp(res.data.otp || '')
      setMessage('OTP generated. Use the development code shown below.')
    } catch (err) {
      setMessage(err.response?.data?.message || 'Unable to generate OTP.')
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async () => {
    setLoading(true)
    try {
      const res = await axios.post('http://localhost:4000/api/admin/otp/verify', { examId, code: otp }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setMessage(res.data.message)
      onVerified(true)
    } catch (err) {
      setMessage(err.response?.data?.message || 'Invalid OTP.')
      onVerified(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-[rgba(79,125,243,0.15)] bg-bg-secondary p-4 text-left">
      <div className="mb-3 flex items-center gap-2 font-semibold">
        <FiKey className="text-accent-blue" />
        OTP Verification
      </div>
      <p className="mb-3 text-sm text-text-secondary">{message}</p>
      {devOtp && <p className="mb-3 rounded-md bg-bg-card px-3 py-2 text-sm text-accent-cyan">Development OTP: {devOtp}</p>}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={requestOtp} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-md border border-[rgba(79,125,243,0.25)] bg-bg-card px-4 py-2.5 text-sm font-semibold text-accent-blue">
          <FiRefreshCw size={15} />
          Send OTP
        </button>
        <input
          value={otp}
          onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
          className="input-field !py-2.5"
          placeholder="Enter 6-digit OTP"
        />
        <button type="button" onClick={verifyOtp} disabled={loading || otp.length !== 6} className="btn-primary inline-flex items-center justify-center gap-2 !px-4 !py-2.5 text-sm">
          <FiCheckCircle size={15} />
          Verify
        </button>
      </div>
    </div>
  )
}

export default OtpVerification
