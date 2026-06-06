import { useQuery } from '@tanstack/react-query'
import api from '../../api/axios'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function MyQuotations() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-quotations'],
    queryFn: () => api.get('/quotations/my').then(r => r.data),
  })

  const statusBadge = (s) => {
    const map = { submitted: 'bg-blue-100 text-blue-700', under_review: 'bg-amber-100 text-amber-700',
      accepted: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700' }
    return map[s] || 'bg-gray-100 text-gray-600'
  }

  if (isLoading) return <Skeleton className="h-64" />

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">My Quotations</h2>
      <Card>
        <CardContent className="p-4">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-gray-500">
              <th className="pb-2">RFQ ID</th><th className="pb-2">Submitted</th>
              <th className="pb-2">Delivery Days</th><th className="pb-2">Subtotal</th><th className="pb-2">Status</th>
            </tr></thead>
            <tbody>
              {(data || []).map(q => (
                <tr key={q.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3">RFQ #{q.rfq_id}</td>
                  <td className="py-3">{q.submitted_at ? new Date(q.submitted_at).toLocaleDateString() : '-'}</td>
                  <td className="py-3">{q.delivery_days}</td>
                  <td className="py-3 font-medium">Rs {q.subtotal?.toLocaleString()}</td>
                  <td className="py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${statusBadge(q.status)}`}>{q.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {data?.length === 0 && <div className="text-center py-8 text-gray-400">No quotations yet</div>}
        </CardContent>
      </Card>
    </div>
  )
}
