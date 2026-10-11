import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useCyberResolve } from '../hooks/useCyberResolve'
import type { UserRoleSlug } from '../interfaces'
import type { CyberResolveUser } from '../contexts/CyberResolveContext'

interface RoleRouteProps {
  allowedRoles: UserRoleSlug[]
}

function getDefaultDashboardPath(user: CyberResolveUser | null) {
  if (!user) return "/login"
  if (user.role === "admin") return "/dashboard/admin"
  if (user.role === "analyst") return "/dashboard/analyst"
  return "/dashboard/user"
}

function hasAnyRole(user: CyberResolveUser | null, allowedRoles: UserRoleSlug[]) {
  if (!user) return false
  const roleMap: Record<string, string> = {
    'administrator': 'admin',
    'security-analyst': 'analyst',
    'employee': 'user',
    'admin': 'admin',
    'analyst': 'analyst',
    'user': 'user'
  }
  const userRole = roleMap[user.role] || user.role
  return allowedRoles.some(role => (roleMap[role] || role) === userRole)
}

export function ProtectedRoute() {
  const { currentUser } = useCyberResolve()
  const location = useLocation()
  const isAuthenticated = !!currentUser

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

export function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { currentUser } = useCyberResolve()

  if (!hasAnyRole(currentUser, allowedRoles)) {
    return <Navigate to={getDefaultDashboardPath(currentUser)} replace />
  }

  return <Outlet />
}

export function GuestRoute() {
  const { currentUser } = useCyberResolve()
  const isAuthenticated = !!currentUser

  if (isAuthenticated) {
    return <Navigate to={getDefaultDashboardPath(currentUser)} replace />
  }

  return <Outlet />
}

export function RoleLandingRedirect() {
  const { currentUser } = useCyberResolve()

  return <Navigate to={getDefaultDashboardPath(currentUser)} replace />
}