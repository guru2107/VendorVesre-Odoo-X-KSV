import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { LogOut, Bell } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '../api/axios'
import { useState } from 'react'

export default function Topbar() {
  const { user, clearAuth } = useAuth()
  const navigate = useNavigate()
  const [showNotifs, setShowNotifs] = useState(false)

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/activity-logs/notifications').then(r => r.data),
    enabled: !!user,
  })

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 no-print">
      <div className="text-sm text-gray-500">
        Welcome, <span className="font-medium text-gray-900">{user?.name}</span>
        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
          {user?.role?.replace('_', ' ')}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 text-gray-500 hover:text-gray-700"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>
          {showNotifs && (
            <div className="absolute right-0 top-10 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
              <div className="p-3 border-b border-gray-100 font-medium text-sm">Notifications</div>
              {notifications.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">No notifications</div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className="p-3 border-b border-gray-50 text-sm hover:bg-gray-50">
                    <p className="text-gray-700">{n.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {n.created_at ? new Date(n.created_at).toLocaleString() : ''}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </header>
  )
}
