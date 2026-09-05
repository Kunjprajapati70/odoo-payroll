import { useAuth } from '../../hooks/useAuth'
import { can } from '../../utils/permissions'

export default function RoleGuard({ action, fallback = null, children }) {
  const { user } = useAuth()
  return can(user, action) ? children : fallback
}
