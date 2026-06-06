import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../api/axios'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']

export default function Reports() {
  const [exportEntity, setExportEntity] = useState('vendors')

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['reports-stats'],
    queryFn: () => api.get('/reports/procurement-stats').then(r => r.data),
  })

  const { data: monthlySpend } = useQuery({
    queryKey: ['reports-monthly'],
    queryFn: () => api.get('/reports/monthly-spend').then(r => r.data),
  })

  const { data: vendorPerf } = useQuery({
    queryKey: ['reports-vendor-perf'],
    queryFn: () => api.get('/reports/vendor-performance').then(r => r.data),
  })

  const { data: categorySpend } = useQuery({
    queryKey: ['reports-category'],
    queryFn: () => api.get('/reports/spending-by-category').then(r => r.data),
  })

  const handleExport = () => {
    window.open(`http://localhost:8000/reports/export?entity=${exportEntity}`, '_blank')
  }

  const winRateColor = (rate) => rate > 50 ? 'text-green-600' : rate > 25 ? 'text-amber-600' : 'text-red-600'

  if (statsLoading) return <Skeleton className="h-64" />

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Reports & Analytics</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center">
          <p className="text-sm text-gray-500">Total Spend</p>
          <p className="text-2xl font-bold">Rs {stats?.total_spend?.toLocaleString() || 0}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-sm text-gray-500">Approval Rate</p>
          <p className="text-2xl font-bold">{stats?.approval_rate || 0}%</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-sm text-gray-500">Avg Quotations/RFQ</p>
          <p className="text-2xl font-bold">{stats?.avg_quotations_per_rfq || 0}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-sm text-gray-500">Total Vendors</p>
          <p className="text-2xl font-bold">{vendorPerf?.length || 0}</p>
        </CardContent></Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Monthly Spend (Last 12 Months)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlySpend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [`Rs ${v?.toLocaleString()}`, 'Total']} />
                <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Spending by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={categorySpend || []} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={100} label>
                  {(categorySpend || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip formatter={(v) => `Rs ${v?.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Vendor Performance Table */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3">Vendor Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-gray-500">
                <th className="pb-2">Vendor</th><th className="pb-2">Category</th><th className="pb-2">Quotations</th>
                <th className="pb-2">Won</th><th className="pb-2">Win Rate</th><th className="pb-2">Avg Delivery</th>
                <th className="pb-2">Total PO Value</th>
              </tr></thead>
              <tbody>
                {(vendorPerf || []).map(v => (
                  <tr key={v.vendor_id} className="border-b border-gray-50">
                    <td className="py-2 font-medium">{v.company_name}</td>
                    <td className="py-2">{v.category}</td>
                    <td className="py-2">{v.total_quotations_submitted}</td>
                    <td className="py-2">{v.quotations_won}</td>
                    <td className={`py-2 font-medium ${winRateColor(v.win_rate)}`}>{v.win_rate}%</td>
                    <td className="py-2">{v.avg_delivery_days} days</td>
                    <td className="py-2">Rs {v.total_po_value?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {vendorPerf?.length === 0 && <p className="text-center py-4 text-gray-400">No vendor data yet</p>}
          </div>
        </CardContent>
      </Card>

      {/* Export */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3">Export Data</h3>
          <div className="flex gap-3 items-end">
            <div>
              <label className="text-sm text-gray-500 block mb-1">Entity</label>
              <select className="border rounded-md px-3 py-2 text-sm" value={exportEntity} onChange={e => setExportEntity(e.target.value)}>
                <option value="vendors">Vendors</option>
                <option value="rfqs">RFQs</option>
                <option value="pos">Purchase Orders</option>
                <option value="invoices">Invoices</option>
              </select>
            </div>
            <Button onClick={handleExport}>Export CSV</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
