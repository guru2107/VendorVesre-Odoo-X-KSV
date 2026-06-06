import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import api from '../api/axios'
import useAuthStore from '../store/authStore'

export default function Layout() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const setUser = useAuthStore(s => s.setUser)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!isAuthenticated) return
    api.get('/auth/me')
      .then(res => {
        setUser(res.data)
        queryClient.invalidateQueries({ queryKey: ['rfqs'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        queryClient.invalidateQueries({ queryKey: ['quotations'] })
      })
      .catch(() => {})
  }, [isAuthenticated, setUser, queryClient])

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
