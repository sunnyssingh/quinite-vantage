'use client'
import { PermissionProvider } from '@/contexts/PermissionContext'
import { TooltipProvider } from '@/components/ui/tooltip'

export default function DashboardLayout({ children }) {
  return (
    <PermissionProvider>
      <TooltipProvider delayDuration={200}>
        {children}
      </TooltipProvider>
    </PermissionProvider>
  )
}
