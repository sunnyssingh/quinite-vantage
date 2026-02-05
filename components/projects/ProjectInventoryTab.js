'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Building, Plus, Search, Filter, Home, CheckCircle2, Clock, MapPin, Edit } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import StatusChangeModal from '@/components/inventory/StatusChangeModal'
import EditPropertyModal from '@/components/inventory/EditPropertyModal'
import { toast } from 'react-hot-toast'
import Link from 'next/link'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export default function ProjectInventoryTab({ projectId, project, onMetricsUpdate }) {
    const [properties, setProperties] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [selectedProperty, setSelectedProperty] = useState(null)
    const [showStatusModal, setShowStatusModal] = useState(false)
    const [editingProperty, setEditingProperty] = useState(null)
    const [showEditModal, setShowEditModal] = useState(false)

    useEffect(() => {
        if (projectId) {
            fetchProperties()
        }
    }, [projectId, project?.updated_at])

    const fetchProperties = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/projects/${projectId}/properties`)
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch properties')
            }

            setProperties(data.properties || [])
        } catch (error) {
            console.error('Fetch properties error:', error)
            toast.error('Failed to load properties')
        } finally {
            setLoading(false)
        }
    }

    const handleStatusChanged = (updatedProperty, projectMetrics) => {
        // Update local property list
        setProperties(prev => prev.map(p =>
            p.id === updatedProperty.id ? updatedProperty : p
        ))

        // Notify parent to update project metrics
        if (onMetricsUpdate && projectMetrics) {
            onMetricsUpdate(projectMetrics)
        }
    }

    const handlePropertyUpdated = (updatedProperty) => {
        // Update local property list
        setProperties(prev => prev.map(p =>
            p.id === updatedProperty.id ? updatedProperty : p
        ))
    }

    const filteredProperties = properties.filter(p => {
        const matchesSearch = p.title?.toLowerCase().includes(search.toLowerCase()) ||
            p.address?.toLowerCase().includes(search.toLowerCase())
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const statusConfig = {
        available: { color: 'bg-green-100 text-green-700 border-green-300', label: 'Available', icon: Home },
        reserved: { color: 'bg-amber-100 text-amber-700 border-amber-300', label: 'Reserved', icon: Clock },
        sold: { color: 'bg-purple-100 text-purple-700 border-purple-300', label: 'Sold', icon: CheckCircle2 }
    }

    const statusCounts = {
        all: properties.length,
        available: properties.filter(p => p.status === 'available').length,
        reserved: properties.filter(p => p.status === 'reserved').length,
        sold: properties.filter(p => p.status === 'sold').length
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header with Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Project Inventory</h3>
                    <p className="text-sm text-muted-foreground">
                        {properties.length} {properties.length === 1 ? 'property' : 'properties'} in this project
                    </p>
                </div>
            </div>

            <div className="flex gap-2">
                {/* Dynamic Add Buttons based on Unit Types */}
                {project?.unit_types && project.unit_types.length > 0 ? (
                    <>
                        {project.unit_types.map((ut, idx) => {
                            const typeCount = properties.filter(p => p.type === ut.type || p.title.includes(ut.type)).length
                            const isFull = typeCount >= ut.count

                            return (
                                <Button
                                    key={idx}
                                    size="sm"
                                    variant={isFull ? "ghost" : "default"}
                                    className={isFull ? "opacity-50 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}
                                    disabled={isFull}
                                    onClick={() => {
                                        setEditingProperty({ type: ut.type, projectId }) // Pass projectId for creation
                                        setShowEditModal(true)
                                    }}
                                >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Add {ut.type}
                                    <span className="ml-1 text-[10px] opacity-80">({typeCount}/{ut.count})</span>
                                </Button>
                            )
                        })}
                    </>
                ) : (
                    /* Fallback Generic Add Button */
                    <Button
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => {
                            setEditingProperty({ projectId })
                            setShowEditModal(true)
                        }}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Property
                    </Button>
                )}
            </div>


            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search properties..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Filter by Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All ({statusCounts.all})</SelectItem>
                        <SelectItem value="available">Available ({statusCounts.available})</SelectItem>
                        <SelectItem value="reserved">Reserved ({statusCounts.reserved})</SelectItem>
                        <SelectItem value="sold">Sold ({statusCounts.sold})</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Properties Grid */}
            {
                filteredProperties.length === 0 ? (
                    <div className="text-center py-12 border border-dashed rounded-lg bg-muted/5">
                        <Building className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            {search || statusFilter !== 'all' ? 'No Properties Found' : 'No Properties Yet'}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            {search || statusFilter !== 'all'
                                ? 'Try adjusting your search or filters'
                                : 'Add properties to this project to start tracking inventory'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredProperties.map(property => {
                            const status = statusConfig[property.status] || statusConfig.available
                            const StatusIcon = status.icon

                            return (
                                <Card key={property.id} className="border-border hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <CardTitle className="text-sm font-bold text-foreground line-clamp-1">
                                                {property.title}
                                            </CardTitle>
                                            <Badge variant="outline" className={`${status.color} border text-[10px] font-semibold px-2 py-0.5 whitespace-nowrap`}>
                                                {status.label}
                                            </Badge>
                                        </div>
                                        {property.address && (
                                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                                <span className="line-clamp-1">{property.address}</span>
                                            </p>
                                        )}
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {/* Price */}
                                        {property.price && (
                                            <div>
                                                <p className="text-xs text-muted-foreground">Price</p>
                                                <p className="text-lg font-bold text-foreground">
                                                    ₹{property.price.toLocaleString('en-IN')}
                                                </p>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-xs"
                                                onClick={() => {
                                                    setEditingProperty(property)
                                                    setShowEditModal(true)
                                                }}
                                            >
                                                <Edit className="w-3 h-3 mr-1" />
                                                Edit
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-xs"
                                                onClick={() => {
                                                    setSelectedProperty(property)
                                                    setShowStatusModal(true)
                                                }}
                                            >
                                                Change Status
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )
            }

            {/* Status Change Modal */}
            <StatusChangeModal
                property={selectedProperty}
                isOpen={showStatusModal}
                onClose={() => {
                    setShowStatusModal(false)
                    setSelectedProperty(null)
                }}
                onStatusChanged={handleStatusChanged}
            />

            {/* Edit Property Modal */}
            <EditPropertyModal
                property={editingProperty}
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false)
                    setEditingProperty(null)
                }}
                onPropertyUpdated={handlePropertyUpdated}
            />
        </div >
    )
}
