import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

// Fetch properties
const fetchProperties = async (filters = {}) => {
    const params = new URLSearchParams()
    if (filters.status) params.append('status', filters.status)
    if (filters.projectId) params.append('project_id', filters.projectId)
    if (filters.type) params.append('type', filters.type)

    // Note: API endpoint for properties refactored to /api/inventory/properties 
    // or /api/properties? Check routes.
    // Based on previous steps, we refactored /api/inventory/properties/route.js
    // So endpoint should be /api/inventory/properties

    const res = await fetch(`/api/inventory/properties?${params.toString()}`)
    if (!res.ok) throw new Error('Failed to fetch properties')
    const data = await res.json()
    return data.properties
}

// Fetch single property
const fetchProperty = async (id) => {
    const res = await fetch(`/api/inventory/properties/${id}`)
    if (!res.ok) throw new Error('Failed to fetch property')
    const data = await res.json()
    return data.property
}

// Create property
const createProperty = async (data) => {
    const res = await fetch('/api/inventory/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error('Failed to create property')
    return res.json()
}

// Update property
const updateProperty = async ({ id, ...updates }) => {
    const res = await fetch(`/api/inventory/properties/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
    })
    if (!res.ok) throw new Error('Failed to update property')
    return res.json()
}

// Delete property
const deleteProperty = async (id) => {
    const res = await fetch(`/api/inventory/properties/${id}`, {
        method: 'DELETE'
    })
    if (!res.ok) throw new Error('Failed to delete property')
    return true
}

export function useProperties(filters) {
    return useQuery({
        queryKey: ['properties', filters],
        queryFn: () => fetchProperties(filters)
    })
}

export function useProperty(id) {
    return useQuery({
        queryKey: ['property', id],
        queryFn: () => fetchProperty(id),
        enabled: !!id
    })
}

export function useCreateProperty() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: createProperty,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['properties'] })
            toast.success('Property created successfully')
        },
        onError: (error) => {
            toast.error(error.message)
        }
    })
}

export function useUpdateProperty() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: updateProperty,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['properties'] })
            queryClient.invalidateQueries({ queryKey: ['property', data.id] })
            toast.success('Property updated successfully')
        },
        onError: (error) => {
            toast.error(error.message)
        }
    })
}

export function useDeleteProperty() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deleteProperty,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['properties'] })
            toast.success('Property deleted successfully')
        },
        onError: (error) => {
            toast.error(error.message)
        }
    })
}
