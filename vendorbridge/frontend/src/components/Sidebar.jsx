import { NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  LayoutDashboard, Users, FileText, ClipboardList,
  CheckSquare, ShoppingCart, Receipt, Activity, BarChart3,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'procurement_officer', 'vendor', 'manager'] },
  { to: '/vendors', label: 'Vendors', icon: Users, roles: ['admin', 'procurement_officer', 'manager'] },
  { to: '/my-company', label: 'My Company', icon: Users, roles: ['vendor'] },
  { to: '/rfqs', label: 'RFQs', icon: FileText, roles: ['admin', 'procurement_officer', 'vendor', 'manager'] },
  { to: '/quotations/my', label: 'My Quotations', icon: ClipboardList, roles: ['vendor'] },
  { to: '/approvals', label: 'Approvals', icon: CheckSquare, roles: ['admin', 'procurement_officer', 'manager'] },
  { to: '/purchase-orders', label: 'Purchase Orders', icon: ShoppingCart, roles: ['admin', 'procurement_officer', 'vendor', 'manager'] },
  { to: '/invoices', label: 'Invoices', icon: Receipt, roles: ['admin', 'procurement_officer', 'vendor', 'manager'] },
  { to: '/activity-logs', label: 'Activity Logs', icon: Activity, roles: ['admin', 'procurement_officer', 'vendor', 'manager'] },
  { to: '/reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'manager'] },
  { to: '/users', label: 'User Management', icon: Users, roles: ['admin'] },
]

export default function Sidebar() {
  const { user } = useAuth()

  const filtered = navItems.filter(item => item.roles.includes(user?.role))

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col no-print">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-blue-800">VendorBridge</h1>
        <p className="text-xs text-gray-500 mt-1">Procurement Management</p>
      </div>
      <nav className="flex-1 py-4 overflow-y-auto">
        {filtered.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium border-r-2 border-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
