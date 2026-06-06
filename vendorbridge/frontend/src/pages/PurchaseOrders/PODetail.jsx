import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import toast from 'react-hot-toast'

export default function PODetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: po, isLoading } = useQuery({
    queryKey: ['po', id],
    queryFn: () => api.get(`/purchase-orders/${id}`).then(r => r.data),
  })

  const statusMutation = useMutation({
    mutationFn: (status) => api.patch(`/purchase-orders/${id}/status`, { status }),
    onSuccess: () => { queryClient.invalidateQueries(['po', id]); toast.success('Status updated') },
    onError: () => toast.error('Failed to update'),
  })

  const invoiceMutation = useMutation({
    mutationFn: () => api.post(`/invoices/${id}`),
    onSuccess: (res) => { toast.success('Invoice generated'); navigate(`/invoices/${res.data.id}`) },
    onError: (e) => toast.error(e.response?.data?.detail || e.response?.data?.error || 'Failed'),
  })

  if (isLoading) return <Skeleton className="h-64" />
  if (!po) return <p>PO not found</p>

  const subtotal = po.subtotal || 0
  const tax = subtotal * 0.18
  const grandTotal = subtotal + tax
  const isProcurement = ['admin', 'procurement_officer'].includes(user?.role)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/purchase-orders" className="hover:text-blue-600">Purchase Orders</Link>
        <span>/</span>
        <span className="text-gray-900">{po.po_number}</span>
      </div>

      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">{po.po_number}</h2>
          <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-xs ${
            po.status === 'issued' ? 'bg-blue-100 text-blue-700' :
            po.status === 'fulfilled' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>{po.status}</span>
        </div>
        {isProcurement && po.status === 'issued' && (
          <div className="flex gap-2">
            <Button onClick={() => invoiceMutation.mutate()}>Generate Invoice</Button>
            <Button variant="outline" onClick={() => statusMutation.mutate('fulfilled')}>Mark Fulfilled</Button>
            <Button variant="destructive" onClick={() => statusMutation.mutate('cancelled')}>Cancel</Button>
          </div>
        )}
      </div>

      {/* Line Items */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3">Line Items</h3>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-gray-500">
              <th className="pb-2">Product</th><th className="pb-2">Qty</th><th className="pb-2">Unit</th>
              <th className="pb-2">Unit Price</th><th className="pb-2 text-right">Total</th>
            </tr></thead>
            <tbody>
              {(po.items || []).map((item, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-2 font-medium">{item.product_name}</td>
                  <td className="py-2">{item.quantity}</td>
                  <td className="py-2">{item.unit || '-'}</td>
                  <td className="py-2">Rs {item.unit_price?.toLocaleString()}</td>
                  <td className="py-2 text-right">Rs {item.total_price?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mt-4">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal:</span><span>Rs {subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Tax (18% GST):</span><span>Rs {tax.toLocaleString()}</span></div>
              <div className="flex justify-between font-bold text-base border-t pt-2"><span>Grand Total:</span><span>Rs {grandTotal.toLocaleString()}</span></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approval Info */}
      {po.approval && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Approval Info</h3>
            <div className="text-sm space-y-1">
              <p>Approved by: {po.approval.approved_by || '-'}</p>
              <p>Approved at: {po.approval.approved_at ? new Date(po.approval.approved_at).toLocaleString() : '-'}</p>
              {po.approval.remarks && <p>Remarks: {po.approval.remarks}</p>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
