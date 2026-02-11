'use client'

import { createContext, useContext, useState, useEffect } from 'react'

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

    const fetchPermissions = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/permissions/my-permissions')

            if (response.ok) {
                const data = await response.json()
                setPermissions(data.permissions || [])
            } else {
                console.error('Failed to fetch permissions')
                setPermissions([])
            }
        } catch (error) {
            console.error('Error fetching permissions:', error)
            setPermissions([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPermissions()
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
        fetchPermissions()
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
