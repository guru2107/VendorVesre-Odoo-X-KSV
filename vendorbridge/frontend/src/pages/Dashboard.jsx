import { useQuery } from '@tanstack/react-query'
import api from '../api/axios'
import { useAuth } from '../hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { Clock, FileText, ShoppingCart, Receipt, Plus, Users, CheckSquare } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function Dashboard() {
  const { user } = useAuth()
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard/summary').then(r => r.data),
  })

  const kpiCards = user?.role === 'vendor'
    ? [
        { label: 'Active RFQs', value: data?.active_rfqs || 0, icon: FileText, color: 'text-blue-600' },
        { label: 'My Quotations', value: data?.my_quotations || 0, icon: Clock, color: 'text-amber-600' },
      ]
    : [
        { label: 'Pending Approvals', value: data?.pending_approvals || 0, icon: Clock, color: 'text-amber-600' },
        { label: 'Active RFQs', value: data?.active_rfqs || 0, icon: FileText, color: 'text-blue-600' },
        { label: 'Purchase Orders', value: data?.total_pos || 0, icon: ShoppingCart, color: 'text-emerald-600' },
        { label: 'Total Invoices', value: data?.total_invoices || 0, icon: Receipt, color: 'text-violet-600' },
      ]

  const statusColor = (s) => {
    const map = { issued: 'bg-blue-100 text-blue-700', fulfilled: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700', generated: 'bg-gray-100 text-gray-700',
      sent: 'bg-blue-100 text-blue-700', paid: 'bg-green-100 text-green-700' }
    return map[s] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)
          : kpiCards.map(card => (
              <Card key={card.label}>
                <CardContent className="flex items-center gap-4 p-6">
                  <div className={`p-3 rounded-lg bg-gray-50 ${card.color}`}>
                    <card.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{card.label}</p>
                    <p className="text-2xl font-bold">{card.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))
        }
      </div>

      {/* Recent Tables */}
      {user?.role !== 'vendor' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Recent Purchase Orders</h3>
              {isLoading ? <Skeleton className="h-40" /> : (
                <div className="space-y-2">
                  {(data?.recent_pos || []).map(po => (
                    <div key={po.po_number} className="flex justify-between items-center py-2 border-b border-gray-50 text-sm">
                      <span className="font-medium">{po.po_number}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${statusColor(po.status)}`}>{po.status}</span>
                    </div>
                  ))}
                  {(!data?.recent_pos || data.recent_pos.length === 0) && <p className="text-sm text-gray-400">No purchase orders yet</p>}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Recent Invoices</h3>
              {isLoading ? <Skeleton className="h-40" /> : (
                <div className="space-y-2">
                  {(data?.recent_invoices || []).map(inv => (
                    <div key={inv.invoice_number} className="flex justify-between items-center py-2 border-b border-gray-50 text-sm">
                      <span className="font-medium">{inv.invoice_number}</span>
                      <span>Rs {inv.total?.toLocaleString()}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${statusColor(inv.status)}`}>{inv.status}</span>
                    </div>
                  ))}
                  {(!data?.recent_invoices || data.recent_invoices.length === 0) && <p className="text-sm text-gray-400">No invoices yet</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Monthly Spend Chart */}
      {user?.role !== 'vendor' && data?.monthly_spend?.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Procurement Spend - Last 6 Months</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.monthly_spend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={v => `Rs ${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [`Rs ${v?.toLocaleString()}`, 'Total']} />
                <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        {['admin', 'procurement_officer'].includes(user?.role) && (
          <Button asChild>
            <Link to="/rfqs/create"><Plus className="w-4 h-4 mr-2" />New RFQ</Link>
          </Button>
        )}
        {user?.role === 'vendor' ? (
          <Button asChild variant="outline">
            <Link to="/my-company"><Users className="w-4 h-4 mr-2" />My Company</Link>
          </Button>
        ) : (
          <Button asChild variant="outline">
            <Link to="/vendors"><Users className="w-4 h-4 mr-2" />View Vendors</Link>
          </Button>
        )}
        {['admin', 'procurement_officer', 'manager'].includes(user?.role) && (
          <Button asChild variant="outline">
            <Link to="/approvals"><CheckSquare className="w-4 h-4 mr-2" />Pending Approvals</Link>
          </Button>
        )}
      </div>
    </div>
  )
}
