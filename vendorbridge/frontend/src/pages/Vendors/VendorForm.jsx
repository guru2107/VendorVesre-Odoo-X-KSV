import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../../api/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'

const CATEGORIES = ['IT', 'Logistics', 'Manufacturing', 'Office Supplies', 'Construction', 'Healthcare', 'Other']

function getApiError(err) {
  const data = err.response?.data
  if (!data) return 'Failed to save vendor'
  if (typeof data.error === 'string') return data.error
  if (typeof data.detail === 'string') return data.detail
  if (Array.isArray(data.details)) {
    return data.details.map(d => d.msg).join(', ')
  }
  return 'Failed to save vendor'
}

export default function VendorForm() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { id } = useParams()
  const isEdit = !!id
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const { data: vendor } = useQuery({
    queryKey: ['vendor', id],
    queryFn: () => api.get(`/vendors/${id}`).then(r => r.data),
    enabled: isEdit,
  })

  useEffect(() => {
    if (vendor) reset(vendor)
  }, [vendor, reset])

  const onSubmit = async (data) => {
    setLoading(true)
    const payload = {
      ...data,
      gst_number: data.gst_number?.trim() || null,
      contact_person: data.contact_person?.trim() || null,
      phone: data.phone?.trim() || null,
      address: data.address?.trim() || null,
    }
    try {
      if (isEdit) {
        await api.put(`/vendors/${id}`, payload)
      } else {
        await api.post('/vendors', payload)
      }
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      if (isEdit) queryClient.invalidateQueries({ queryKey: ['vendor', id] })
      toast.success('Vendor saved')
      navigate('/vendors')
    } catch (err) {
      toast.error(getApiError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? 'Edit Vendor' : 'Add Vendor'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label>Company Name *</Label>
              <Input {...register('company_name', { required: 'Required', minLength: { value: 2, message: 'Min 2 chars' } })} />
              {errors.company_name && <p className="text-xs text-red-500 mt-1">{errors.company_name.message}</p>}
            </div>
            <div>
              <Label>Category *</Label>
              <select className="flex h-10 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                {...register('category', { required: 'Required' })}>
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>}
            </div>
            <div>
              <Label>GST Number</Label>
              <Input {...register('gst_number')} placeholder="Format: 22AAAAA0000A1Z5" />
              <p className="text-xs text-gray-400 mt-1">Format: 22AAAAA0000A1Z5</p>
            </div>
            <div>
              <Label>Contact Person</Label>
              <Input {...register('contact_person')} />
            </div>
            <div>
              <Label>Email *</Label>
              <Input type="email" {...register('email', { required: 'Required' })} />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <Label>Phone</Label>
              <Input {...register('phone')} />
            </div>
            <div>
              <Label>Address</Label>
              <Textarea {...register('address')} />
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEdit ? 'Update' : 'Create'} Vendor
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/vendors')}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
