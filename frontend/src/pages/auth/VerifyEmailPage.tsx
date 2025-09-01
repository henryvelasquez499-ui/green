import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, TrendingUp } from 'lucide-react'
import { authApi } from '../../services/api'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error')
        setMessage('Invalid verification token')
        return
      }

      try {
        await authApi.verifyEmail(token)
        setStatus('success')
        setMessage('Email verified successfully!')
      } catch (error: any) {
        setStatus('error')
        setMessage(error.response?.data?.error || 'Email verification failed')
      }
    }

    verifyEmail()
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8"
      >
        {/* Logo and Header */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto h-16 w-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg"
          >
            <TrendingUp className="h-8 w-8 text-white" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-3xl font-bold text-neutral-900"
          >
            Email Verification
          </motion.h2>
        </div>

        {/* Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-xl shadow-lg p-8 border border-neutral-200"
        >
          <div className="text-center space-y-4">
            {status === 'loading' && (
              <>
                <LoadingSpinner size="lg" className="mx-auto" />
                <p className="text-neutral-600">Verifying your email...</p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8 text-success-600" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900">Email Verified!</h3>
                <p className="text-neutral-600">{message}</p>
                <Link
                  to="/auth/login"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                >
                  Continue to sign in
                </Link>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto">
                  <XCircle className="h-8 w-8 text-error-600" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900">Verification Failed</h3>
                <p className="text-neutral-600">{message}</p>
                <div className="space-y-2">
                  <Link
                    to="/auth/register"
                    className="block w-full text-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                  >
                    Create new account
                  </Link>
                  <Link
                    to="/auth/login"
                    className="block w-full text-center px-4 py-2 border border-neutral-300 text-sm font-medium rounded-lg text-neutral-700 bg-white hover:bg-neutral-50 transition-colors"
                  >
                    Back to sign in
                  </Link>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}