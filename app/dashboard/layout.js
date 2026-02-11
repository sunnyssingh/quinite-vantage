'use client'
import { PermissionProvider } from '@/contexts/PermissionContext'

export default function DashboardLayout({ children }) {
  return (
    <PermissionProvider>
      {children}
    </PermissionProvider>
  )
}
