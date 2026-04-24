'use client'

import { createContext, useContext, useState, useEffect, useRef } from 'react'

const POLL_INTERVAL_MS = 60_000

const PermissionContext = createContext({
    permissions: [],
    loading: true,
    hasPermission: () => false,
    hasAnyPermission: () => false,
    hasAllPermissions: () => false,
    refreshPermissions: () => { }
})

export function PermissionProvider({ children }) {
    const [permissions, setPermissions] = useState([])
    const [loading, setLoading] = useState(true)
    const permissionVersionRef = useRef(null)

    const fetchPermissions = async ({ silent = false } = {}) => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        try {
            if (!silent) setLoading(true)
            const response = await fetch('/api/permissions/my-permissions', {
                signal: controller.signal
            })

            if (response.ok) {
                const data = await response.json()
                permissionVersionRef.current = data.permissionVersion ?? null
                setPermissions(data.permissions || [])
            } else {
                if (!silent) {
                    console.error('Failed to fetch permissions (Status:', response.status, ')')
                    setPermissions([])
                }
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.warn('[PermissionContext] Fetch timed out')
            } else if (!silent) {
                console.error('Error fetching permissions:', error)
                setPermissions([])
            }
        } finally {
            clearTimeout(timeoutId)
            if (!silent) setLoading(false)
        }
    }

    // Poll every 60s: if permission_version changed, re-fetch with loading UI
    const checkForUpdates = async () => {
        try {
            const response = await fetch('/api/permissions/my-permissions', { signal: AbortSignal.timeout(5000) })
            if (!response.ok) return
            const data = await response.json()
            const newVersion = data.permissionVersion ?? null
            if (newVersion !== null && permissionVersionRef.current !== null && newVersion !== permissionVersionRef.current) {
                permissionVersionRef.current = newVersion
                setPermissions(data.permissions || [])
            }
        } catch {
            // Silent — don't disturb UX on poll failure
        }
    }

    useEffect(() => {
        fetchPermissions()
        const interval = setInterval(checkForUpdates, POLL_INTERVAL_MS)
        return () => clearInterval(interval)
    }, [])

    const hasPermission = (featureKey) => {
        return permissions.includes(featureKey)
    }

    const hasAnyPermission = (featureKeys) => {
        return featureKeys.some(key => permissions.includes(key))
    }

    const hasAllPermissions = (featureKeys) => {
        return featureKeys.every(key => permissions.includes(key))
    }

    const refreshPermissions = () => {
        fetchPermissions({ silent: false })
    }

    return (
        <PermissionContext.Provider
            value={{
                permissions,
                loading,
                hasPermission,
                hasAnyPermission,
                hasAllPermissions,
                refreshPermissions
            }}
        >
            {children}
        </PermissionContext.Provider>
    )
}

export function usePermissions() {
    const context = useContext(PermissionContext)
    if (!context) {
        throw new Error('usePermissions must be used within a PermissionProvider')
    }
    return context
}

export function usePermission(featureKey) {
    const { hasPermission } = usePermissions()
    return hasPermission(featureKey)
}
