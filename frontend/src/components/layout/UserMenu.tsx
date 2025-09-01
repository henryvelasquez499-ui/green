import React, { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { motion } from 'framer-motion'
import { ChevronDown, User, Settings, LogOut } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { cn } from '../../utils/cn'

interface UserMenuProps {
  user: any
}

export const UserMenu: React.FC<UserMenuProps> = ({ user }) => {
  const { logout } = useAuthStore()

  const handleLogout = () => {
    logout()
  }

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="flex items-center gap-x-2 rounded-lg p-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center"
        >
          <span className="text-sm font-medium text-white">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </span>
        </motion.div>
        <span className="hidden lg:flex lg:items-center">
          <span className="ml-2 text-sm font-medium text-neutral-700">
            {user?.firstName} {user?.lastName}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 text-neutral-400" />
        </span>
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2.5 w-56 origin-top-right rounded-lg bg-white py-2 shadow-lg ring-1 ring-neutral-900/5 focus:outline-none">
          <div className="px-4 py-3 border-b border-neutral-100">
            <p className="text-sm font-medium text-neutral-900">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-sm text-neutral-500">{user?.email}</p>
            {user?.department && (
              <p className="text-xs text-neutral-400 mt-1">{user.department}</p>
            )}
          </div>

          <Menu.Item>
            {({ active }) => (
              <a
                href="/profile"
                className={cn(
                  'flex items-center gap-x-3 px-4 py-2 text-sm transition-colors',
                  active ? 'bg-neutral-50 text-neutral-900' : 'text-neutral-700'
                )}
              >
                <User className="h-4 w-4" />
                Your Profile
              </a>
            )}
          </Menu.Item>

          <Menu.Item>
            {({ active }) => (
              <a
                href="/profile"
                className={cn(
                  'flex items-center gap-x-3 px-4 py-2 text-sm transition-colors',
                  active ? 'bg-neutral-50 text-neutral-900' : 'text-neutral-700'
                )}
              >
                <Settings className="h-4 w-4" />
                Settings
              </a>
            )}
          </Menu.Item>

          <div className="border-t border-neutral-100 my-1" />

          <Menu.Item>
            {({ active }) => (
              <button
                onClick={handleLogout}
                className={cn(
                  'flex w-full items-center gap-x-3 px-4 py-2 text-sm transition-colors',
                  active ? 'bg-neutral-50 text-neutral-900' : 'text-neutral-700'
                )}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            )}
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}