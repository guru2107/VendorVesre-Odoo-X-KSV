import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function ApprovalQueue() {
  const [status, setStatus] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['approvals', status],
    queryFn: () => {
      const params = status ? `?status=${status}` : ''
      return api.get(`/approvals${params}`).then(r => r.data)
    },
  })

  const statusBadge = (s) => {
    const map = { pending: 'bg-amber-100 text-amber-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700' }
    return map[s] || 'bg-gray-100 text-gray-600'
  }

  if (isLoading) return <Skeleton className="h-64" />

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Approval Queue</h2>
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3 mb-4">
            <select className="border rounded-md px-3 py-2 text-sm" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-gray-500">
              <th className="pb-2">RFQ</th><th className="pb-2">Vendor</th><th className="pb-2">Total</th>
              <th className="pb-2">Requested By</th><th className="pb-2">Date</th><th className="pb-2">Status</th><th className="pb-2">Actions</th>
            </tr></thead>
            <tbody>
              {(data || []).map(a => (
                <tr key={a.id} className={`border-b border-gray-50 ${a.status === 'pending' ? 'bg-amber-50' : ''} hover:bg-gray-50`}>
                  <td className="py-3 font-medium">{a.rfq_title || `RFQ #${a.rfq_id}`}</td>
                  <td className="py-3">{a.vendor_name || '-'}</td>
                  <td className="py-3">Rs {a.quotation_subtotal?.toLocaleString() || '-'}</td>
                  <td className="py-3">{a.requested_by_name || '-'}</td>
                  <td className="py-3">{a.requested_at ? new Date(a.requested_at).toLocaleDateString() : '-'}</td>
                  <td className="py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${statusBadge(a.status)}`}>{a.status}</span></td>
                  <td className="py-3"><Link to={`/approvals/${a.id}`} className="text-blue-600 hover:underline">Review</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
          {data?.length === 0 && <div className="text-center py-8 text-gray-400">No approvals found</div>}
        </CardContent>
      </Card>
    </div>
  )
}
