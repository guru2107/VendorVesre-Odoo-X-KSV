import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import RoleGuard from './components/RoleGuard'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import VendorList from './pages/Vendors/VendorList'
import VendorForm from './pages/Vendors/VendorForm'
import VendorDetail from './pages/Vendors/VendorDetail'
import MyCompany from './pages/Vendors/MyCompany'
import RFQList from './pages/RFQs/RFQList'
import RFQCreate from './pages/RFQs/RFQCreate'
import RFQDetail from './pages/RFQs/RFQDetail'
import QuotationSubmit from './pages/Quotations/QuotationSubmit'
import MyQuotations from './pages/Quotations/MyQuotations'
import QuotationCompare from './pages/Quotations/QuotationCompare'
import ApprovalQueue from './pages/Approvals/ApprovalQueue'
import ApprovalDetail from './pages/Approvals/ApprovalDetail'
import POList from './pages/PurchaseOrders/POList'
import PODetail from './pages/PurchaseOrders/PODetail'
import InvoiceList from './pages/Invoices/InvoiceList'
import InvoiceDetail from './pages/Invoices/InvoiceDetail'
import ActivityLogs from './pages/ActivityLogs'
import Reports from './pages/Reports'
import UserManagement from './pages/UserManagement'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />

          <Route path="vendors" element={
            <RoleGuard roles={['admin', 'procurement_officer', 'manager']}><VendorList /></RoleGuard>
          } />
          <Route path="my-company" element={
            <RoleGuard roles={['vendor']}><MyCompany /></RoleGuard>
          } />
          <Route path="vendors/new" element={
            <RoleGuard roles={['admin', 'procurement_officer']}><VendorForm /></RoleGuard>
          } />
          <Route path="vendors/:id" element={<VendorDetail />} />
          <Route path="vendors/:id/edit" element={
            <RoleGuard roles={['admin']}><VendorForm /></RoleGuard>
          } />

          <Route path="rfqs" element={<RFQList />} />
          <Route path="rfqs/create" element={
            <RoleGuard roles={['procurement_officer', 'admin']}><RFQCreate /></RoleGuard>
          } />
          <Route path="rfqs/:id" element={<RFQDetail />} />

          <Route path="quotations/my" element={
            <RoleGuard roles={['vendor']}><MyQuotations /></RoleGuard>
          } />
          <Route path="quotations/submit/:rfqId" element={
            <RoleGuard roles={['vendor']}><QuotationSubmit /></RoleGuard>
          } />
          <Route path="quotations/compare/:rfqId" element={
            <RoleGuard roles={['procurement_officer', 'manager', 'admin']}><QuotationCompare /></RoleGuard>
          } />

          <Route path="approvals" element={
            <RoleGuard roles={['manager', 'admin', 'procurement_officer']}><ApprovalQueue /></RoleGuard>
          } />
          <Route path="approvals/:id" element={
            <RoleGuard roles={['manager', 'admin', 'procurement_officer']}><ApprovalDetail /></RoleGuard>
          } />

          <Route path="purchase-orders" element={<POList />} />
          <Route path="purchase-orders/:id" element={<PODetail />} />

          <Route path="invoices" element={<InvoiceList />} />
          <Route path="invoices/:id" element={<InvoiceDetail />} />

          <Route path="activity-logs" element={<ActivityLogs />} />

          <Route path="reports" element={
            <RoleGuard roles={['admin', 'manager']}><Reports /></RoleGuard>
          } />

          <Route path="users" element={
            <RoleGuard roles={['admin']}><UserManagement /></RoleGuard>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

