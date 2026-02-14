import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

// Fetch campaign list
const fetchCampaigns = async (filters = {}) => {
    const params = new URLSearchParams()
    if (filters.status) params.append('status', filters.status)
    if (filters.projectId) params.append('project_id', filters.projectId)
    if (filters.page) params.append('page', filters.page)
    if (filters.limit) params.append('limit', filters.limit)

    const res = await fetch(`/api/campaigns?${params.toString()}`)
    if (!res.ok) throw new Error('Failed to fetch campaigns')
    return res.json()
}

// ... (fetchCampaign, createCampaign, etc. remain the same)

export function useCampaigns(filters = {}) {
    return useQuery({
        queryKey: ['campaigns', filters],
        queryFn: () => fetchCampaigns(filters),
        keepPreviousData: true
    })
}

export function useCampaign(id) {
    return useQuery({
        queryKey: ['campaign', id],
        queryFn: () => fetchCampaign(id),
        enabled: !!id
    })
}

export function useCreateCampaign() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: createCampaign,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['campaigns'] })
            toast.success('Campaign created successfully')
        },
        onError: (error) => {
            toast.error(error.message)
        }
    })
}

export function useUpdateCampaign() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: updateCampaign,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['campaigns'] })
            queryClient.invalidateQueries({ queryKey: ['campaign', data.id] })
            toast.success('Campaign updated successfully')
        },
        onError: (error) => {
            toast.error(error.message)
        }
    })
}

export function useDeleteCampaign() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deleteCampaign,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['campaigns'] })
            toast.success('Campaign deleted successfully')
        },
        onError: (error) => {
            toast.error(error.message)
        }
    })
}
