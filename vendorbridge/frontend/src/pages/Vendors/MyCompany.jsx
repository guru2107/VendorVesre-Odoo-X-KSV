import { useAuth } from '../../hooks/useAuth'
import VendorDetail from './VendorDetail'

export default function MyCompany() {
  const { user } = useAuth()

  if (!user?.vendor_id) {
    return (
      <div className="p-8">
        <p className="text-gray-600">
          Your account is not linked to a vendor. Contact an administrator.
        </p>
      </div>
    )
  }

  return <VendorDetail vendorId={String(user.vendor_id)} />
}
