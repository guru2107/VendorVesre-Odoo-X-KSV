import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../api/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2 } from 'lucide-react'

export default function QuotationSubmit() {
  const { rfqId } = useParams()
  const navigate = useNavigate()
  const [prices, setPrices] = useState({})
  const [deliveryDays, setDeliveryDays] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const { data: rfq, isLoading } = useQuery({
    queryKey: ['rfq', rfqId],
    queryFn: () => api.get(`/rfqs/${rfqId}`).then(r => r.data),
  })

  const subtotal = (rfq?.items || []).reduce((sum, item) => {
    const price = parseFloat(prices[item.id] || 0)
    return sum + price * parseFloat(item.quantity)
  }, 0)

  const handleSubmit = async () => {
    if (!deliveryDays || deliveryDays < 1) return toast.error('Enter delivery days')
    const missingItems = (rfq?.items || []).filter(i => !prices[i.id] || prices[i.id] <= 0)
    if (missingItems.length > 0) return toast.error('Enter prices for all items')

    setLoading(true)
    try {
      await api.post('/quotations', {
        rfq_id: parseInt(rfqId),
        delivery_days: parseInt(deliveryDays),
        notes,
        items: (rfq.items || []).map(i => ({ rfq_item_id: i.id, unit_price: parseFloat(prices[i.id]) })),
      })
      toast.success('Quotation submitted!')
      navigate('/quotations/my')
    } catch (err) {
      toast.error(err.response?.data?.detail || err.response?.data?.error || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) return <Skeleton className="h-64" />

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">Submit Quotation</h2>
      <p className="text-sm text-gray-500">For RFQ: {rfq?.title}</p>

      <Card>
        <CardHeader><CardTitle className="text-lg">Line Items</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-gray-500 text-left">
              <th className="pb-2">Product</th><th className="pb-2">Qty</th><th className="pb-2">Unit</th>
              <th className="pb-2">Unit Price</th><th className="pb-2 text-right">Total</th>
            </tr></thead>
            <tbody>
              {(rfq?.items || []).map(item => (
                <tr key={item.id} className="border-b border-gray-50">
                  <td className="py-3 font-medium">{item.product_name}</td>
                  <td className="py-3">{item.quantity}</td>
                  <td className="py-3">{item.unit || '-'}</td>
                  <td className="py-3">
                    <Input type="number" min="0" step="0.01" className="w-28"
                      value={prices[item.id] || ''} onChange={e => setPrices({ ...prices, [item.id]: e.target.value })} />
                  </td>
                  <td className="py-3 text-right font-medium">
                    Rs {((parseFloat(prices[item.id] || 0)) * parseFloat(item.quantity)).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-right mt-4 text-lg font-bold">Subtotal: Rs {subtotal.toLocaleString()}</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div>
            <Label>Delivery Days *</Label>
            <Input type="number" min="1" value={deliveryDays} onChange={e => setDeliveryDays(e.target.value)} className="w-32" />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
          </div>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Submit Quotation
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
