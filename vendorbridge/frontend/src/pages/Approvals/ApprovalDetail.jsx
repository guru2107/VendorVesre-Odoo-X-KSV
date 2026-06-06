import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import toast from 'react-hot-toast'
import { Check, X, Loader2 } from 'lucide-react'

export default function ApprovalDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [remarks, setRemarks] = useState('')
  const [loading, setLoading] = useState('')

  const { data: approval, isLoading } = useQuery({
    queryKey: ['approval', id],
    queryFn: () => api.get(`/approvals/${id}`).then(r => r.data),
  })

  const handleAction = async (action) => {
    if (action === 'reject' && (!remarks || remarks.length < 10)) {
      return toast.error('Rejection remarks must be at least 10 characters')
    }
    if (!confirm(`${action === 'approve' ? 'Approve' : 'Reject'} this quotation?`)) return

    setLoading(action)
    try {
      await api.post(`/approvals/${id}/${action}`, { remarks })
      queryClient.invalidateQueries(['approval', id])
      toast.success(action === 'approve' ? 'Quotation approved! PO auto-generated' : 'Quotation rejected')
      navigate(action === 'approve' ? '/purchase-orders' : '/approvals')
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.detail || 'Failed')
    } finally {
      setLoading('')
    }
  }

  if (isLoading) return <Skeleton className="h-64" />
  if (!approval) return <p>Approval not found</p>

  const isManager = ['admin', 'manager'].includes(user?.role)
  const isPending = approval.status === 'pending'

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/approvals" className="hover:text-blue-600">Approvals</Link>
        <span>/</span>
        <span className="text-gray-900">#{approval.id}</span>
      </div>

      <div>
        <h2 className="text-2xl font-bold">{approval.rfq_title || `RFQ #${approval.rfq_id}`}</h2>
        <p className="text-sm text-gray-500 mt-1">
          Requested by {approval.requested_by_name} on {approval.requested_at ? new Date(approval.requested_at).toLocaleString() : ''}
        </p>
      </div>

      {/* Quotation Summary */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3">Quotation Summary</h3>
          <div className="grid grid-cols-3 gap-4 text-sm mb-4">
            <div><span className="text-gray-500">Vendor:</span> <span className="font-medium">{approval.vendor_name}</span></div>
            <div><span className="text-gray-500">Subtotal:</span> <span className="font-medium">Rs {approval.quotation_subtotal?.toLocaleString()}</span></div>
            <div><span className="text-gray-500">Status:</span>
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                approval.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                approval.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>{approval.status}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-4">Approval Timeline</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center"><Check className="w-4 h-4 text-green-600" /></div>
              <div>
                <p className="font-medium text-sm">Request Created</p>
                <p className="text-xs text-gray-500">{approval.requested_by_name} at {approval.requested_at ? new Date(approval.requested_at).toLocaleString() : ''}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isPending ? 'bg-amber-100' : approval.status === 'approved' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {isPending ? <Loader2 className="w-4 h-4 text-amber-600 animate-spin" /> :
                 approval.status === 'approved' ? <Check className="w-4 h-4 text-green-600" /> :
                 <X className="w-4 h-4 text-red-600" />}
              </div>
              <div>
                <p className="font-medium text-sm">Decision</p>
                {approval.reviewed_at ? (
                  <p className="text-xs text-gray-500">
                    {approval.reviewed_by_name} - {approval.status} at {new Date(approval.reviewed_at).toLocaleString()}
                    {approval.remarks && <span className="block mt-1">Remarks: {approval.remarks}</span>}
                  </p>
                ) : <p className="text-xs text-gray-400">Pending review</p>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approve/Reject Form */}
      {isManager && isPending && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold">Review Decision</h3>
            <div>
              <Label>Remarks {approval.status === 'rejected' && '(required for rejection)'}</Label>
              <Textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={3} placeholder="Enter remarks..." />
            </div>
            <div className="flex gap-3">
              <Button onClick={() => handleAction('approve')} className="bg-green-600 hover:bg-green-700" disabled={!!loading}>
                {loading === 'approve' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Check className="w-4 h-4 mr-2" />Approve
              </Button>
              <Button onClick={() => handleAction('reject')} variant="destructive" disabled={!!loading}>
                {loading === 'reject' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <X className="w-4 h-4 mr-2" />Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
