import { useQuery } from '@tanstack/react-query'

/**
 * Hook to fetch CRM Pipelines
 */
export function usePipelines() {
    return useQuery({
        queryKey: ['crm-pipelines'],
        queryFn: async () => {
            const res = await fetch('/api/crm/pipelines')
            if (!res.ok) throw new Error('Failed to fetch pipelines')
            const data = await res.json()
            return data.pipelines || []
        },
        staleTime: 10 * 60 * 1000, // Pipelines change very rarely
    })
}

/**
 * Hook to fetch Admin/Org Users for assignment
 */
export function useUsers() {
    return useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const res = await fetch('/api/admin/users')
            if (!res.ok) throw new Error('Failed to fetch users')
            const data = await res.json()
            return data.users || []
        },
        staleTime: 5 * 60 * 1000, 
    })
}

/**
 * Hook to fetch Organization settings (Currency, Brand, etc)
 */
export function useOrgSettings() {
    return useQuery({
        queryKey: ['org-settings'],
        queryFn: async () => {
            const res = await fetch('/api/organization/settings')
            if (!res.ok) throw new Error('Failed to fetch org settings')
            const data = await res.json()
            return data.organization || null
        },
        staleTime: 60 * 60 * 1000, // Org settings almost never change
    })
}
