import React from 'react'
import { motion } from 'framer-motion'
import { Bell, Search, Menu } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { UserMenu } from './UserMenu'

export const Header: React.FC = () => {
  const { user } = useAuthStore()

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-neutral-200 bg-white/80 backdrop-blur-sm px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile menu button */}
      <button
        type="button"
        className="-m-2.5 p-2.5 text-neutral-700 lg:hidden"
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-6 w-6" />
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-neutral-200 lg:hidden" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        {/* Search */}
        <div className="relative flex flex-1 items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="relative w-full max-w-md"
          >
            <Search className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-neutral-400 pl-3" />
            <input
              type="search"
              placeholder="Search actions, challenges..."
              className="block h-full w-full border-0 py-0 pl-10 pr-0 text-neutral-900 placeholder:text-neutral-400 focus:ring-0 sm:text-sm bg-transparent"
            />
          </motion.div>
        </div>

        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Notifications */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            className="-m-2.5 p-2.5 text-neutral-400 hover:text-neutral-500 relative"
          >
            <span className="sr-only">View notifications</span>
            <Bell className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-error-500 rounded-full text-xs text-white flex items-center justify-center">
              3
            </span>
          </motion.button>

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-neutral-200" />

          {/* Profile dropdown */}
          <UserMenu user={user} />
        </div>
      </div>
    </div>
  )
}