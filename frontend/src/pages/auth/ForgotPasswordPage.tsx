import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { Mail, ArrowLeft, TrendingUp } from 'lucide-react'
import { authApi } from '../../services/api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import toast from 'react-hot-toast'

interface ForgotPasswordForm {
  email: string
}

export const ForgotPasswordPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ForgotPasswordForm>()

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true)
    try {
      await authApi.forgotPassword(data.email)
      setIsSubmitted(true)
      toast.success('Password reset email sent!')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send reset email')
    } finally {
      setIsLoading(false)
    }
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
            <TrendingUp className="h-8 w-8 text-white" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-3xl font-bold text-neutral-900"
          >
            Forgot password?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-2 text-sm text-neutral-600"
          >
            {isSubmitted 
              ? 'Check your email for reset instructions'
              : 'Enter your email to receive reset instructions'
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
          {!isSubmitted ? (
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <Input
                label="Email address"
                type="email"
                icon={<Mail className="h-4 w-4" />}
                error={errors.email?.message}
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isLoading}
                className="w-full"
              >
                Send reset email
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto">
                <Mail className="h-8 w-8 text-success-600" />
              </div>
              <p className="text-neutral-600">
                We've sent password reset instructions to your email address.
              </p>
            </div>
          )}

          <div className="mt-6">
            <Link
              to="/auth/login"
              className="flex items-center justify-center text-sm text-primary-600 hover:text-primary-500 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to sign in
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}