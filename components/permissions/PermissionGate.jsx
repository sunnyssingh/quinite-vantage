'use client'

import { usePermissions } from '@/contexts/PermissionContext'

/**
 * PermissionGate component
 * Conditionally renders children based on user permissions
 * 
 * @param {string|string[]} feature - Feature key(s) to check
 * @param {boolean} requireAll - If true, requires all features. If false, requires any feature
 * @param {React.ReactNode} children - Content to render if permission granted
 * @param {React.ReactNode} fallback - Content to render if permission denied
 */
export function PermissionGate({
    feature,
    requireAll = false,
    children,
    fallback = null
}) {
    const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions()

    // Show nothing while loading
    if (loading) {
        return null
    }

    // Handle single feature
    if (typeof feature === 'string') {
        return hasPermission(feature) ? children : fallback
    }

    // Handle multiple features
    if (Array.isArray(feature)) {
        const allowed = requireAll
            ? hasAllPermissions(feature)
            : hasAnyPermission(feature)

        return allowed ? children : fallback
    }

    // Invalid feature prop
    return fallback
}

/**
 * PermissionButton component
 * Button that's only visible/enabled based on permissions
 */
export function PermissionButton({
    feature,
    requireAll = false,
    disabled = false,
    children,
    ...props
}) {
    const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions()

    if (loading) {
        return null
    }

    let allowed = false
    if (typeof feature === 'string') {
        allowed = hasPermission(feature)
    } else if (Array.isArray(feature)) {
        allowed = requireAll
            ? hasAllPermissions(feature)
            : hasAnyPermission(feature)
    }

    if (!allowed) {
        return null
    }

    return (
        <button disabled={disabled} {...props}>
            {children}
        </button>
    )
}

/**
 * PermissionLink component
 * Link that's only visible based on permissions
 */
export function PermissionLink({
    feature,
    requireAll = false,
    children,
    ...props
}) {
    const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions()

    if (loading) {
        return null
    }

    let allowed = false
    if (typeof feature === 'string') {
        allowed = hasPermission(feature)
    } else if (Array.isArray(feature)) {
        allowed = requireAll
            ? hasAllPermissions(feature)
            : hasAnyPermission(feature)
    }

    if (!allowed) {
        return null
    }

    return (
        <a {...props}>
            {children}
        </a>
    )
}
