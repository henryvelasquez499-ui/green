import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { Lock, TrendingUp, CheckCircle } from 'lucide-react'
import { authApi } from '../../services/api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import toast from 'react-hot-toast'

interface ResetPasswordForm {
  password: string
  confirmPassword: string
}

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<ResetPasswordForm>()

  const password = watch('password')

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      toast.error('Invalid reset token')
      return
    }

    setIsLoading(true)
    try {
      await authApi.resetPassword({
        token,
        password: data.password
      })
      setIsSuccess(true)
      toast.success('Password reset successfully!')
      setTimeout(() => navigate('/auth/login'), 2000)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Password reset failed')
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-neutral-900">Invalid Reset Link</h2>
          <p className="mt-2 text-neutral-600">This password reset link is invalid or has expired.</p>
          <Link to="/auth/forgot-password" className="mt-4 text-primary-600 hover:text-primary-500">
            Request a new reset link
          </Link>
        </div>
      </div>
    )
  }

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
            {isSuccess ? (
              <CheckCircle className="h-8 w-8 text-white" />
            ) : (
              <TrendingUp className="h-8 w-8 text-white" />
            )}
          </motion.div>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-3xl font-bold text-neutral-900"
          >
            {isSuccess ? 'Password Reset!' : 'Reset password'}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-2 text-sm text-neutral-600"
          >
            {isSuccess 
              ? 'Your password has been successfully reset'
              : 'Enter your new password below'
            }
          </motion.p>
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-xl shadow-lg p-8 border border-neutral-200"
        >
          {!isSuccess ? (
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <Input
                label="New password"
                type="password"
                icon={<Lock className="h-4 w-4" />}
                error={errors.password?.message}
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters'
                  },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: 'Password must contain uppercase, lowercase, and number'
                  }
                })}
              />

              <Input
                label="Confirm new password"
                type="password"
                icon={<Lock className="h-4 w-4" />}
                error={errors.confirmPassword?.message}
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) => value === password || 'Passwords do not match'
                })}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isLoading}
                className="w-full"
              >
                Reset password
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-success-600" />
              </div>
              <p className="text-neutral-600">
                Redirecting you to sign in...
              </p>
            </div>
          )}

          <div className="mt-6">
            <Link
              to="/auth/login"
              className="flex items-center justify-center text-sm text-primary-600 hover:text-primary-500 transition-colors"
            >
              Back to sign in
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}