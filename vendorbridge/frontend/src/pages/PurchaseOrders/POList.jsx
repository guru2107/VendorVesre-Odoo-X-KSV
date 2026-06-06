import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function POList() {
  const [status, setStatus] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['pos', status],
    queryFn: () => {
      const params = new URLSearchParams({ limit: '50' })
      if (status) params.append('status', status)
      return api.get(`/purchase-orders?${params}`).then(r => r.data)
    },
  })

  const statusBadge = (s) => {
    const map = { issued: 'bg-blue-100 text-blue-700', fulfilled: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' }
    return map[s] || 'bg-gray-100 text-gray-600'
  }

  if (isLoading) return <Skeleton className="h-64" />

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Purchase Orders</h2>
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3 mb-4">
            <select className="border rounded-md px-3 py-2 text-sm" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="issued">Issued</option>
              <option value="fulfilled">Fulfilled</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-gray-500">
              <th className="pb-2">PO Number</th><th className="pb-2">Vendor</th><th className="pb-2">Status</th><th className="pb-2">Issued At</th>
            </tr></thead>
            <tbody>
              {(data?.pos || []).map(po => (
                <tr key={po.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3"><Link to={`/purchase-orders/${po.id}`} className="text-blue-600 hover:underline font-medium">{po.po_number}</Link></td>
                  <td className="py-3">{po.vendor_name || '-'}</td>
                  <td className="py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${statusBadge(po.status)}`}>{po.status}</span></td>
                  <td className="py-3">{po.issued_at ? new Date(po.issued_at).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data?.pos?.length === 0 && <div className="text-center py-8 text-gray-400">No purchase orders found</div>}
        </CardContent>
      </Card>
    </div>
  )
}
