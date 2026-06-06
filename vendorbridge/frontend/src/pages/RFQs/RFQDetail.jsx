import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import toast from 'react-hot-toast'

export default function RFQDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: rfq, isLoading } = useQuery({
    queryKey: ['rfq', id],
    queryFn: () => api.get(`/rfqs/${id}`).then(r => r.data),
  })

  const { data: quotations = [] } = useQuery({
    queryKey: ['quotations', 'rfq', id],
    queryFn: () => api.get(`/quotations/rfq/${id}`).then(r => r.data),
    enabled: !!id && ['admin', 'procurement_officer', 'manager'].includes(user?.role),
  })

  const approvalMutation = useMutation({
    mutationFn: (quotationId) => api.post('/approvals', { quotation_id: quotationId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfq', id] })
      queryClient.invalidateQueries({ queryKey: ['quotations', 'rfq', id] })
      queryClient.invalidateQueries({ queryKey: ['approvals'] })
      toast.success('Approval requested — awaiting manager review')
    },
    onError: (e) => toast.error(e.response?.data?.error || e.response?.data?.detail || 'Failed to request approval'),
  })

  const publishMutation = useMutation({
    mutationFn: () => api.patch(`/rfqs/${id}/publish`),
    onSuccess: () => { queryClient.invalidateQueries(['rfq', id]); toast.success('RFQ published') },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed'),
  })

  const closeMutation = useMutation({
    mutationFn: () => api.patch(`/rfqs/${id}/close`),
    onSuccess: () => { queryClient.invalidateQueries(['rfq', id]); toast.success('RFQ closed') },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed'),
  })

  if (isLoading) return <Skeleton className="h-64" />
  if (!rfq) return <p>RFQ not found</p>

  const isProcurement = ['admin', 'procurement_officer'].includes(user?.role)
  const canCompare = ['admin', 'procurement_officer', 'manager'].includes(user?.role)
  const isVendor = user?.role === 'vendor'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/rfqs" className="hover:text-blue-600">RFQs</Link>
        <span>/</span>
        <span className="text-gray-900">{rfq.title}</span>
      </div>

      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">{rfq.title}</h2>
          <div className="flex gap-3 mt-2">
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              rfq.status === 'published' ? 'bg-blue-100 text-blue-700' :
              rfq.status === 'closed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
            }`}>{rfq.status}</span>
            <span className="text-sm text-gray-500">Deadline: {rfq.deadline ? new Date(rfq.deadline).toLocaleString() : '-'}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {isProcurement && rfq.status === 'draft' && (
            <Button onClick={() => publishMutation.mutate()}>Publish RFQ</Button>
          )}
          {canCompare && rfq.quotation_count >= 1 && (
            <Button variant="outline" asChild>
              <Link to={`/quotations/compare/${rfq.id}`}>
                {rfq.quotation_count >= 2 ? 'Compare Quotations' : 'Review Quotation'}
              </Link>
            </Button>
          )}
          {isVendor && rfq.status === 'published' && rfq.is_invited && (
            <Button asChild>
              <Link to={`/quotations/submit/${rfq.id}`}>Submit Quotation</Link>
            </Button>
          )}
          {isVendor && rfq.status === 'published' && !rfq.is_invited && (
            <p className="text-sm text-amber-600 self-center">Your company was not invited to this RFQ</p>
          )}
          {isVendor && !user?.vendor_id && (
            <p className="text-sm text-amber-600 self-center">Account not linked to a vendor — contact admin</p>
          )}
          {isProcurement && rfq.status !== 'closed' && (
            <Button variant="destructive" onClick={() => closeMutation.mutate()}>Close RFQ</Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="items">Line Items ({rfq.items?.length || 0})</TabsTrigger>
          <TabsTrigger value="vendors">Vendors ({rfq.vendor_ids?.length || 0})</TabsTrigger>
          {canCompare && (
            <TabsTrigger value="quotations">Quotations ({rfq.quotation_count || 0})</TabsTrigger>
          )}
          <TabsTrigger value="attachments">Attachments ({rfq.attachments?.length || 0})</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <Card><CardContent className="p-4">
            <p className="text-gray-700">{rfq.description || 'No description provided.'}</p>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="items">
          <Card><CardContent className="p-4">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-gray-500 text-left">
                <th className="pb-2">Product</th><th className="pb-2">Qty</th><th className="pb-2">Unit</th><th className="pb-2">Specs</th>
              </tr></thead>
              <tbody>
                {(rfq.items || []).map(i => (
                  <tr key={i.id} className="border-b border-gray-50">
                    <td className="py-2 font-medium">{i.product_name}</td>
                    <td className="py-2">{i.quantity}</td>
                    <td className="py-2">{i.unit || '-'}</td>
                    <td className="py-2 text-gray-500">{i.specifications || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="vendors">
          <Card><CardContent className="p-4">
            {(rfq.vendors || []).length === 0 ? (
              <p className="text-sm text-gray-400">No vendors assigned</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-gray-500 text-left">
                    <th className="pb-2">Company</th>
                    <th className="pb-2">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {rfq.vendors.map(v => (
                    <tr key={v.id} className="border-b border-gray-50">
                      <td className="py-2 font-medium">{v.company_name}</td>
                      <td className="py-2 text-gray-500">{v.email || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="quotations">
          <Card><CardContent className="p-4">
            {quotations.length === 0 ? (
              <p className="text-sm text-gray-400">No quotations submitted yet</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-gray-500 text-left">
                    <th className="pb-2">Vendor</th>
                    <th className="pb-2">Subtotal</th>
                    <th className="pb-2">Delivery</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Submitted</th>
                    <th className="pb-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {quotations.map(q => (
                    <tr key={q.id} className="border-b border-gray-50">
                      <td className="py-2 font-medium">{q.vendor_name || `Vendor #${q.vendor_id}`}</td>
                      <td className="py-2">Rs {q.subtotal?.toLocaleString()}</td>
                      <td className="py-2">{q.delivery_days} days</td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          q.status === 'accepted' ? 'bg-green-100 text-green-700' :
                          q.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          q.status === 'under_review' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>{q.status}</span>
                      </td>
                      <td className="py-2 text-gray-500">
                        {q.submitted_at ? new Date(q.submitted_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-2">
                        {isProcurement && q.status === 'submitted' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (confirm(`Request approval for ${q.vendor_name}'s quotation?`)) {
                                approvalMutation.mutate(q.id)
                              }
                            }}
                            disabled={approvalMutation.isPending}
                          >
                            Request Approval
                          </Button>
                        )}
                        {canCompare && rfq.quotation_count >= 2 && (
                          <Link to={`/quotations/compare/${rfq.id}`} className="text-blue-600 hover:underline text-xs ml-2">
                            Compare all
                          </Link>
                        )}
                        {q.status === 'under_review' && (
                          <Link to="/approvals" className="text-blue-600 hover:underline text-xs">View in Approvals</Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="attachments">
          <Card><CardContent className="p-4">
            {(rfq.attachments || []).length === 0 ? (
              <p className="text-sm text-gray-400">No attachments</p>
            ) : rfq.attachments.map(a => (
              <div key={a.id} className="flex items-center gap-2 py-2 border-b border-gray-50 text-sm">
                <span>{a.filename}</span>
                <a href={`http://localhost:8000/${a.file_path}`} target="_blank" className="text-blue-600 hover:underline text-xs">Download</a>
              </div>
            ))}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
