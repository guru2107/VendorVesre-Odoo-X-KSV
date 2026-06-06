import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import toast from 'react-hot-toast'

export default function VendorDetail({ vendorId }) {
  const { id: paramId } = useParams()
  const id = vendorId || paramId
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: vendor, isLoading, isError } = useQuery({
    queryKey: ['vendor', id],
    queryFn: () => api.get(`/vendors/${id}`).then(r => r.data),
    enabled: !!id,
  })

  const statusMutation = useMutation({
    mutationFn: (status) => api.patch(`/vendors/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', id] })
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      toast.success('Status updated')
    },
    onError: () => toast.error('Failed to update status'),
  })

  if (isLoading) return <Skeleton className="h-64" />
  if (isError || !vendor) {
    return (
      <div className="p-8 text-center text-gray-500">
        Vendor not found or you do not have access to view this page.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        {vendorId ? (
          <span className="text-gray-900">My Company</span>
        ) : (
          <>
            <Link to="/vendors" className="hover:text-blue-600">Vendors</Link>
            <span>/</span>
            <span className="text-gray-900">{vendor?.company_name}</span>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-bold">{vendor?.company_name}</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Category:</span> <span className="ml-2">{vendor?.category}</span></div>
              <div><span className="text-gray-500">GST:</span> <span className="ml-2">{vendor?.gst_number || '-'}</span></div>
              <div><span className="text-gray-500">Contact:</span> <span className="ml-2">{vendor?.contact_person || '-'}</span></div>
              <div><span className="text-gray-500">Email:</span> <span className="ml-2">{vendor?.email}</span></div>
              <div><span className="text-gray-500">Phone:</span> <span className="ml-2">{vendor?.phone || '-'}</span></div>
              <div><span className="text-gray-500">Address:</span> <span className="ml-2">{vendor?.address || '-'}</span></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Status:</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                vendor?.status === 'active' ? 'bg-green-100 text-green-700' :
                vendor?.status === 'blacklisted' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
              }`}>{vendor?.status}</span>
            </div>
            {user?.role === 'admin' && (
              <div className="space-y-2">
                <Label className="text-sm">Change Status</Label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={vendor?.status || ''}
                  onChange={e => statusMutation.mutate(e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="blacklisted">Blacklisted</option>
                </select>
                <Button asChild variant="outline" className="w-full mt-2">
                  <Link to={`/vendors/${id}/edit`}>Edit Vendor</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Label({ children, className }) {
  return <label className={`block font-medium ${className || ''}`}>{children}</label>
}
