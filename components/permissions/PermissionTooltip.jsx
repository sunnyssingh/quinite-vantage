'use client'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Lock } from 'lucide-react'

/**
 * PermissionTooltip - Wraps UI elements to show permission-based tooltips
 * 
 * @param {boolean} hasPermission - Whether user has the required permission
 * @param {string} message - Tooltip message to show when permission is denied
 * @param {React.ReactNode} children - The UI element to wrap
 * @param {boolean} showLockIcon - Whether to show lock icon on disabled elements
 */
export function PermissionTooltip({
    hasPermission = true,
    message = "You don't have permission to perform this action",
    children,
    showLockIcon = false
}) {
    // If user has permission, render children without tooltip
    if (hasPermission) {
        return <>{children}</>
    }

    // If no permission, wrap in tooltip
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="inline-flex items-center gap-2">
                    {showLockIcon && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                    {children}
                </div>
            </TooltipTrigger>
            <TooltipContent
                side="top"
                className="bg-red-600 text-white border-red-700 max-w-xs"
            >
                <div className="flex items-start gap-2">
                    <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{message}</p>
                </div>
            </TooltipContent>
        </Tooltip>
    )
}

export default PermissionTooltip
