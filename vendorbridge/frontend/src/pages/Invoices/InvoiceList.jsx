import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function InvoiceList() {
  const [status, setStatus] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', status],
    queryFn: () => {
      const params = new URLSearchParams({ limit: '50' })
      if (status) params.append('status', status)
      return api.get(`/invoices?${params}`).then(r => r.data)
    },
  })

  const statusBadge = (s) => {
    const map = { generated: 'bg-gray-100 text-gray-700', sent: 'bg-blue-100 text-blue-700', paid: 'bg-green-100 text-green-700' }
    return map[s] || 'bg-gray-100 text-gray-600'
  }

  if (isLoading) return <Skeleton className="h-64" />

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Invoices</h2>
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3 mb-4">
            <select className="border rounded-md px-3 py-2 text-sm" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="generated">Generated</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-gray-500">
              <th className="pb-2">Invoice #</th><th className="pb-2">PO</th><th className="pb-2">Total</th>
              <th className="pb-2">Status</th><th className="pb-2">Generated</th>
            </tr></thead>
            <tbody>
              {(data?.invoices || []).map(inv => (
                <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3"><Link to={`/invoices/${inv.id}`} className="text-blue-600 hover:underline font-medium">{inv.invoice_number}</Link></td>
                  <td className="py-3">PO #{inv.po_id}</td>
                  <td className="py-3 font-medium">Rs {inv.total?.toLocaleString()}</td>
                  <td className="py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${statusBadge(inv.status)}`}>{inv.status}</span></td>
                  <td className="py-3">{inv.generated_at ? new Date(inv.generated_at).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data?.invoices?.length === 0 && <div className="text-center py-8 text-gray-400">No invoices found</div>}
        </CardContent>
      </Card>
    </div>
  )
}
