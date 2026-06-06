import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Search } from 'lucide-react'

export default function VendorList() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const { data, isLoading } = useQuery({
    queryKey: ['vendors', debouncedSearch, category, status],
    queryFn: () => {
      const params = new URLSearchParams()
      if (debouncedSearch) params.append('search', debouncedSearch)
      if (category) params.append('category', category)
      if (status) params.append('status', status)
      params.append('limit', '50')
      return api.get(`/vendors?${params}`).then(r => r.data)
    },
  })

  const statusBadge = (s) => {
    const map = { active: 'bg-green-100 text-green-700', inactive: 'bg-gray-100 text-gray-600', blacklisted: 'bg-red-100 text-red-700' }
    return map[s] || 'bg-gray-100 text-gray-600'
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Vendors</h2>
        {['admin', 'procurement_officer'].includes(user?.role) && (
          <Button asChild><Link to="/vendors/new"><Plus className="w-4 h-4 mr-2" />Add Vendor</Link></Button>
        )}
      </div>
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <Input placeholder="Search vendors..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="border rounded-md px-3 py-2 text-sm" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">All Categories</option>
              {['IT', 'Logistics', 'Manufacturing', 'Office Supplies', 'Construction', 'Healthcare', 'Other'].map(c =>
                <option key={c} value={c}>{c}</option>
              )}
            </select>
            <select className="border rounded-md px-3 py-2 text-sm" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="blacklisted">Blacklisted</option>
            </select>
          </div>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-2 font-medium">Company</th>
                    <th className="pb-2 font-medium">Category</th>
                    <th className="pb-2 font-medium">GST</th>
                    <th className="pb-2 font-medium">Email</th>
                    <th className="pb-2 font-medium">Phone</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.vendors || []).map(v => (
                    <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3">
                        <Link to={`/vendors/${v.id}`} className="text-blue-600 hover:underline font-medium">{v.company_name}</Link>
                      </td>
                      <td className="py-3">{v.category}</td>
                      <td className="py-3 text-gray-500">{v.gst_number || '-'}</td>
                      <td className="py-3">{v.email}</td>
                      <td className="py-3">{v.phone || '-'}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${statusBadge(v.status)}`}>{v.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data?.vendors?.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <p>No vendors found</p>
                  <Button asChild variant="outline" className="mt-3">
                    <Link to="/vendors/new">Add your first vendor</Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
