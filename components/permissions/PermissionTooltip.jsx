'use client'

import React from 'react'
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
    // Fix hydration mismatch by waiting for mount
    const [mounted, setMounted] = React.useState(false)
    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        // Render children as-is during SSR/initial hydration to match server
        // This assumes the "happy path" (permission granted) for initial render to avoid layout shift
        // OR we can render a placeholder. 
        // Given this wraps buttons, rendering the button (likely disabled or enabled) is safer than nothing.
        // But if we render it enabled and then disable it, it might flash.
        // However, hydration mismatch is worse.
        // Let's render the "hasPermission" state by default (no tooltip wrapper) 
        // because the wrapper <div> changes the DOM structure.
        return <>{children}</>
    }

    // If user has permission, render children without tooltip
    if (hasPermission) {
        return <>{children}</>
    }

    // If no permission, wrap in tooltip
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="inline-flex items-center gap-2 cursor-not-allowed">
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
                    <div>
                        <p className="font-semibold text-xs mb-0.5">Access Denied</p>
                        <p className="text-xs opacity-90">{message}</p>
                    </div>
                </div>
            </TooltipContent>
        </Tooltip>
    )
}

export default PermissionTooltip
