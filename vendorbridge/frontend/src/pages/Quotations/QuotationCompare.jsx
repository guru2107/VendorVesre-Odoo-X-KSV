import { useQuery, useMutation } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

export default function QuotationCompare() {
  const { rfqId } = useParams()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['compare', rfqId],
    queryFn: () => api.get(`/quotations/compare/${rfqId}`).then(r => r.data),
  })

  const approvalMutation = useMutation({
    mutationFn: (quotationId) => api.post('/approvals', { quotation_id: quotationId }),
    onSuccess: () => { toast.success('Approval requested'); navigate('/approvals') },
    onError: (e) => toast.error(e.response?.data?.error || e.response?.data?.detail || 'Failed'),
  })

  if (isLoading) return <Skeleton className="h-64" />
  if (!data) return <p>No data</p>

  const { rfq, quotations, lowest_prices } = data

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Comparing {quotations.length} quotations for: {rfq?.title}</h2>

      <Card>
        <CardContent className="p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2">Item</th>
                {quotations.map(q => (
                  <th key={q.id} className="pb-2 px-4">
                    <div className="font-medium">{q.vendor_name}</div>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      q.status === 'accepted' ? 'bg-green-100 text-green-700' :
                      q.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                    }`}>{q.status}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(rfq?.items || []).map(item => (
                <tr key={item.id} className="border-b border-gray-50">
                  <td className="py-2">
                    <div className="font-medium">{item.product_name}</div>
                    <div className="text-xs text-gray-400">{item.quantity} {item.unit}</div>
                  </td>
                  {quotations.map(q => {
                    const qi = q.items.find(i => i.rfq_item_id === item.id)
                    const isLowest = qi && lowest_prices[String(item.id)] === qi.unit_price
                    return (
                      <td key={q.id} className={`py-2 px-4 ${isLowest ? 'bg-green-50 font-medium text-green-700' : ''}`}>
                        Rs {qi?.unit_price?.toLocaleString() || '-'}
                      </td>
                    )
                  })}
                </tr>
              ))}
              <tr className="border-t-2 font-medium">
                <td className="py-2">Delivery (days)</td>
                {quotations.map(q => {
                  const minDelivery = Math.min(...quotations.map(x => x.delivery_days))
                  return (
                    <td key={q.id} className={`py-2 px-4 ${q.delivery_days === minDelivery ? 'text-green-700 font-bold' : ''}`}>
                      {q.delivery_days}
                    </td>
                  )
                })}
              </tr>
              <tr className="font-bold">
                <td className="py-2">Subtotal</td>
                {quotations.map(q => {
                  const minSubtotal = Math.min(...quotations.map(x => x.subtotal))
                  return (
                    <td key={q.id} className={`py-2 px-4 ${q.subtotal === minSubtotal ? 'text-green-700' : ''}`}>
                      Rs {q.subtotal?.toLocaleString()}
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        {quotations.map(q => (
          <Button key={q.id} variant="outline" onClick={() => {
            if (confirm(`Request approval for ${q.vendor_name}'s quotation?`)) {
              approvalMutation.mutate(q.id)
            }
          }}>
            Select {q.vendor_name}
          </Button>
        ))}
      </div>
    </div>
  )
}
