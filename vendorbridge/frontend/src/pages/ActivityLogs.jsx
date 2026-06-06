import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../api/axios'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { FileText, Users, CheckSquare, Receipt, ShoppingCart, Activity as ActivityIcon } from 'lucide-react'

const entityColors = {
  vendor: 'text-blue-600 bg-blue-100', rfq: 'text-purple-600 bg-purple-100',
  approval: 'text-amber-600 bg-amber-100', invoice: 'text-green-600 bg-green-100',
  purchase_order: 'text-emerald-600 bg-emerald-100', quotation: 'text-indigo-600 bg-indigo-100',
}
const entityIcons = {
  vendor: Users, rfq: FileText, approval: CheckSquare, invoice: Receipt,
  purchase_order: ShoppingCart, quotation: FileText,
}

export default function ActivityLogs() {
  const [entityType, setEntityType] = useState('')
  const [action, setAction] = useState('')
  const [page, setPage] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['activity-logs', entityType, action, page],
    queryFn: () => {
      const params = new URLSearchParams({ skip: page * 50, limit: '50' })
      if (entityType) params.append('entity_type', entityType)
      if (action) params.append('action', action)
      return api.get(`/activity-logs?${params}`).then(r => r.data)
    },
  })

  const timeAgo = (dateStr) => {
    if (!dateStr) return ''
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  if (isLoading) return <Skeleton className="h-64" />

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Activity Logs</h2>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <select className="border rounded-md px-3 py-2 text-sm" value={entityType} onChange={e => { setEntityType(e.target.value); setPage(0) }}>
              <option value="">All Entities</option>
              {['vendor', 'rfq', 'quotation', 'approval', 'purchase_order', 'invoice'].map(e =>
                <option key={e} value={e}>{e.replace('_', ' ')}</option>
              )}
            </select>
            <select className="border rounded-md px-3 py-2 text-sm" value={action} onChange={e => { setAction(e.target.value); setPage(0) }}>
              <option value="">All Actions</option>
              {['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'APPROVE', 'REJECT', 'SEND'].map(a =>
                <option key={a} value={a}>{a}</option>
              )}
            </select>
            <Button variant="outline" onClick={() => { setEntityType(''); setAction(''); setPage(0) }}>Clear</Button>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <div className="space-y-3">
        {(data?.logs || []).map(log => {
          const Icon = entityIcons[log.entity_type] || ActivityIcon
          const colorClass = entityColors[log.entity_type] || 'text-gray-600 bg-gray-100'
          return (
            <div key={log.id} className="flex items-start gap-4 p-4 bg-white rounded-lg border border-gray-100">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-800">
                  <span className="font-medium">{log.action}</span> {log.description}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {log.user_name ? `by ${log.user_name}` : ''} {timeAgo(log.created_at)}
                </p>
              </div>
            </div>
          )
        })}
        {data?.logs?.length === 0 && <div className="text-center py-8 text-gray-400">No activity logs found</div>}
      </div>

      {data?.total > 50 && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setPage(page + 1)}>Load More</Button>
        </div>
      )}
    </div>
  )
}
