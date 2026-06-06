import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import toast from 'react-hot-toast'
import { Download, Printer, Mail, CheckCircle, Loader2 } from 'lucide-react'

export default function InvoiceDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => api.get(`/invoices/${id}`).then(r => r.data),
  })

  const emailMutation = useMutation({
    mutationFn: () => api.post(`/invoices/${id}/send-email`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] })
      toast.success(res.data.message || 'Email sent')
    },
    onError: (e) => toast.error(e.response?.data?.error || e.response?.data?.detail || 'Failed to send email'),
  })

  const downloadPdf = async () => {
    try {
      const res = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `${invoice?.invoice_number || `invoice-${id}`}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('Failed to download PDF')
    }
  }

  const statusMutation = useMutation({
    mutationFn: () => api.patch(`/invoices/${id}/status`, { status: 'paid' }),
    onSuccess: () => { queryClient.invalidateQueries(['invoice', id]); toast.success('Marked as paid') },
    onError: () => toast.error('Failed'),
  })

  if (isLoading) return <Skeleton className="h-64" />
  if (!invoice) return <p>Invoice not found</p>

  const isProcurement = ['admin', 'procurement_officer'].includes(user?.role)
  const vendor = invoice.vendor

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500 no-print">
        <Link to="/invoices" className="hover:text-blue-600">Invoices</Link>
        <span>/</span>
        <span className="text-gray-900">{invoice.invoice_number}</span>
      </div>

      <div className="flex justify-between items-start no-print">
        <div>
          <h2 className="text-2xl font-bold">{invoice.invoice_number}</h2>
          <div className="flex gap-3 mt-1">
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
              invoice.status === 'sent' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
            }`}>{invoice.status}</span>
            <span className="text-sm text-gray-500">Generated: {invoice.generated_at ? new Date(invoice.generated_at).toLocaleDateString() : ''}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadPdf}>
            <Download className="w-4 h-4 mr-2" />Download PDF
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" />Print
          </Button>
          {isProcurement && vendor?.email && (
            <Button variant="outline" onClick={() => {
              if (confirm(`Send to ${vendor.email}?`)) emailMutation.mutate()
            }} disabled={emailMutation.isPending}>
              {emailMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
              Send Email
            </Button>
          )}
          {isProcurement && invoice.status !== 'paid' && (
            <Button onClick={() => statusMutation.mutate()}>
              <CheckCircle className="w-4 h-4 mr-2" />Mark Paid
            </Button>
          )}
        </div>
      </div>

      {/* Invoice Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">Bill To</h3>
            {vendor ? (
              <div className="text-sm space-y-1">
                <p className="font-medium">{vendor.company_name}</p>
                {vendor.address && <p>{vendor.address}</p>}
                {vendor.phone && <p>Phone: {vendor.phone}</p>}
                {vendor.gst_number && <p>GST: {vendor.gst_number}</p>}
              </div>
            ) : <p className="text-gray-400">Vendor info unavailable</p>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-sm space-y-2">
            <div><span className="text-gray-500">Invoice #:</span> <span className="font-medium">{invoice.invoice_number}</span></div>
            <div><span className="text-gray-500">PO Ref:</span> <span className="font-medium">{invoice.po_number || `PO #${invoice.po_id}`}</span></div>
            <div><span className="text-gray-500">Date:</span> <span className="font-medium">{invoice.generated_at ? new Date(invoice.generated_at).toLocaleDateString() : ''}</span></div>
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <Card>
        <CardContent className="p-4">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-gray-500">
              <th className="pb-2">Product</th><th className="pb-2">Qty</th><th className="pb-2">Unit</th>
              <th className="pb-2">Unit Price</th><th className="pb-2 text-right">Total</th>
            </tr></thead>
            <tbody>
              {(invoice.items || []).map((item, i) => (
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
              <div className="flex justify-between"><span>Subtotal:</span><span>Rs {invoice.subtotal?.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>GST ({invoice.tax_rate}%):</span><span>Rs {invoice.tax_amount?.toLocaleString()}</span></div>
              <div className="flex justify-between font-bold text-base border-t pt-2"><span>Total:</span><span>Rs {invoice.total?.toLocaleString()}</span></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
