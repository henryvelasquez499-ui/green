import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className, 
  hover = false,
  onClick 
}) => {
  const Component = onClick ? motion.button : motion.div

  return (
    <Component
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={hover ? { y: -2, shadow: "0 10px 25px -3px rgba(0, 0, 0, 0.1)" } : undefined}
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden',
        hover && 'transition-all duration-200 cursor-pointer',
        onClick && 'text-left w-full',
        className
      )}
    >
      {children}
    </Component>
  )
}

interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className }) => {
  return (
    <div className={cn('px-6 py-4 border-b border-neutral-100', className)}>
      {children}
    </div>
  )
}

interface CardContentProps {
  children: React.ReactNode
  className?: string
}

export const CardContent: React.FC<CardContentProps> = ({ children, className }) => {
  return (
    <div className={cn('px-6 py-4', className)}>
      {children}
    </div>
  )
}

interface CardFooterProps {
  children: React.ReactNode
  className?: string
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className }) => {
  return (
    <div className={cn('px-6 py-4 border-t border-neutral-100 bg-neutral-50', className)}>
      {children}
    </div>
  )
}