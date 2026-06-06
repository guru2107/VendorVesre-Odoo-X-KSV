import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import api from '../api/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Plus, Edit, Shield, CheckCircle, XCircle } from 'lucide-react'

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'procurement_officer', label: 'Procurement Officer' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'manager', label: 'Manager' },
]

export default function UserManagement() {
  const queryClient = useQueryClient()
  const [isCreating, setIsCreating] = useState(false)

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(res => res.data),
  })

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm()
  const selectedRole = watch('role')

  const { data: vendorData } = useQuery({
    queryKey: ['vendors', 'active-picker'],
    queryFn: () => api.get('/vendors?status=active&limit=100').then(res => res.data),
    enabled: isCreating || users.some(u => u.role === 'vendor'),
  })
  const activeVendors = vendorData?.vendors || []

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/users/', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      toast.success('User created successfully')
      setIsCreating(false)
      reset()
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to create user')
  })

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role, vendor_id }) => api.patch(`/users/${userId}/role`, { role, vendor_id }),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      toast.success('Role updated successfully')
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to update role')
  })

  const toggleStatusMutation = useMutation({
    mutationFn: ({ userId, is_active }) => api.patch(`/users/${userId}/status`, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      toast.success('User status updated')
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to update status')
  })

  const onSubmit = (data) => {
    const payload = { ...data }
    if (payload.role !== 'vendor') {
      delete payload.vendor_id
    } else if (!payload.vendor_id || Number.isNaN(payload.vendor_id)) {
      toast.error('Please select a vendor for vendor role')
      return
    }
    createMutation.mutate(payload)
  }

  if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">Manage system users, roles, and access.</p>
        </div>
        <Button onClick={() => setIsCreating(!isCreating)} className="gap-2">
          {isCreating ? 'Cancel' : <><Plus className="w-4 h-4" /> Add User</>}
        </Button>
      </div>

      {isCreating && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h2 className="text-lg font-semibold mb-4">Create New User</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" {...register('name', { required: 'Name is required' })} />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email', { required: 'Email is required' })} />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="password">Temporary Password</Label>
              <Input id="password" type="password" {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Min 8 characters' } })} />
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                {...register('role', { required: 'Role is required' })}
              >
                <option value="">Select a role</option>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role.message}</p>}
            </div>
            {selectedRole === 'vendor' && (
              <div>
                <Label htmlFor="vendor_id">Linked Vendor *</Label>
                <select
                  id="vendor_id"
                  className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                  {...register('vendor_id', {
                    required: selectedRole === 'vendor' ? 'Vendor is required for vendor role' : false,
                    valueAsNumber: true,
                  })}
                >
                  <option value="">Select a vendor</option>
                  {activeVendors.map(v => (
                    <option key={v.id} value={v.id}>{v.company_name} ({v.email})</option>
                  ))}
                </select>
                {errors.vendor_id && <p className="text-xs text-red-500 mt-1">{errors.vendor_id.message}</p>}
              </div>
            )}
            <div className="md:col-span-2 mt-2">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create User
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Vendor</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Joined</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{u.name}</div>
                  <div className="text-xs text-gray-500">{u.email}</div>
                </td>
                <td className="px-6 py-4">
                  <select
                    className="border-gray-200 rounded text-xs px-2 py-1 bg-gray-50"
                    value={u.role}
                    onChange={(e) => {
                      const role = e.target.value
                      if (role === 'vendor' && !u.vendor_id) {
                        toast.error('Select a vendor before assigning vendor role')
                        return
                      }
                      updateRoleMutation.mutate({ userId: u.id, role, vendor_id: u.vendor_id || undefined })
                    }}
                  >
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </td>
                <td className="px-6 py-4">
                  {u.role === 'vendor' ? (
                    <select
                      className="border-gray-200 rounded text-xs px-2 py-1 bg-gray-50 max-w-[180px]"
                      value={u.vendor_id || ''}
                      onChange={(e) => updateRoleMutation.mutate({
                        userId: u.id,
                        role: 'vendor',
                        vendor_id: Number(e.target.value),
                      })}
                    >
                      <option value="">Select vendor</option>
                      {activeVendors.map(v => (
                        <option key={v.id} value={v.id}>{v.company_name}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {u.is_active ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={u.is_active ? 'text-red-600 hover:text-red-700 hover:bg-red-50' : 'text-green-600 hover:text-green-700 hover:bg-green-50'}
                    onClick={() => toggleStatusMutation.mutate({ userId: u.id, is_active: !u.is_active })}
                  >
                    {u.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
