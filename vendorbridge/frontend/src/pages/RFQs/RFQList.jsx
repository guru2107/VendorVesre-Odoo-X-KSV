import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus } from 'lucide-react'

export default function RFQList() {
  const { user } = useAuth()
  const [status, setStatus] = useState('')

  const isVendor = user?.role === 'vendor'
  const canCompare = ['admin', 'procurement_officer', 'manager'].includes(user?.role)

  const { data, isLoading } = useQuery({
    queryKey: ['rfqs', status],
    queryFn: () => {
      const params = new URLSearchParams({ limit: '50' })
      if (status) params.append('status', status)
      return api.get(`/rfqs?${params}`).then(r => r.data)
    },
    refetchOnMount: 'always',
  })

  const deadlineColor = (deadline) => {
    if (!deadline) return 'text-gray-500'
    const days = Math.ceil((new Date(deadline) - new Date()) / 86400000)
    if (days < 0) return 'text-gray-400 line-through'
    if (days < 3) return 'text-red-600 font-medium'
    if (days <= 7) return 'text-amber-600 font-medium'
    return 'text-green-600'
  }

  const statusBadge = (s) => {
    const map = { draft: 'bg-gray-100 text-gray-600', published: 'bg-blue-100 text-blue-700', closed: 'bg-red-100 text-red-700' }
    return map[s] || 'bg-gray-100 text-gray-600'
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">RFQs</h2>
        {['admin', 'procurement_officer'].includes(user?.role) && (
          <Button asChild><Link to="/rfqs/create"><Plus className="w-4 h-4 mr-2" />New RFQ</Link></Button>
        )}
      </div>
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3 mb-4">
            <select className="border rounded-md px-3 py-2 text-sm" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          {isLoading ? <Skeleton className="h-60" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-2 font-medium">Title</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Deadline</th>
                    <th className="pb-2 font-medium">Vendors</th>
                    <th className="pb-2 font-medium">Quotations</th>
                    {(isVendor || canCompare) && <th className="pb-2 font-medium">Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {(data?.rfqs || []).map(rfq => (
                    <tr key={rfq.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3">
                        <Link to={`/rfqs/${rfq.id}`} className="text-blue-600 hover:underline font-medium">{rfq.title}</Link>
                      </td>
                      <td className="py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${statusBadge(rfq.status)}`}>{rfq.status}</span></td>
                      <td className={`py-3 ${deadlineColor(rfq.deadline)}`}>
                        {rfq.deadline ? new Date(rfq.deadline).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-3">{rfq.vendor_count || 0}</td>
                      <td className="py-3">{rfq.quotation_count || 0}</td>
                      {(isVendor || canCompare) && (
                        <td className="py-3">
                          {isVendor && rfq.status === 'published' && rfq.is_invited ? (
                            <Button asChild size="sm">
                              <Link to={`/quotations/submit/${rfq.id}`}>Submit Quotation</Link>
                            </Button>
                          ) : canCompare && rfq.quotation_count >= 2 ? (
                            <Button asChild size="sm" variant="outline">
                              <Link to={`/quotations/compare/${rfq.id}`}>Compare</Link>
                            </Button>
                          ) : canCompare && rfq.quotation_count === 1 ? (
                            <Button asChild size="sm" variant="outline">
                              <Link to={`/quotations/compare/${rfq.id}`}>Review</Link>
                            </Button>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {data?.rfqs?.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <p>No RFQs found</p>
                  {isVendor && !user?.vendor_id && (
                    <p className="text-sm text-amber-600 mt-2">
                      Your account is not linked to a vendor company. Ask an administrator to link it in User Management.
                    </p>
                  )}
                  {isVendor && user?.vendor_id && (
                    <p className="text-sm mt-2">
                      No RFQs have been assigned to your company yet.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
