'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Building2, Users, Eye, AlertCircle } from 'lucide-react'

export default function PlatformOrganizationsPage() {
  const router = useRouter()
  const [organizations, setOrganizations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrganizations()
  }, [])

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/platform/organizations')
      const data = await response.json()
      setOrganizations(data.organizations || [])
    } catch (error) {
      console.error('Error fetching organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    if (status === 'COMPLETED') {
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>
    }
    return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
        <p className="text-gray-500 mt-1">Manage all organizations in the platform</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Organizations</CardTitle>
          <CardDescription>View and manage organization accounts</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : organizations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Building2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No organizations yet</p>
              <p className="text-sm mt-2">Organizations will appear here after signup</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Onboarding</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map(org => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-gray-400" />
                        {org.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(org.onboarding_status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        {org._count || 0}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(org.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => router.push(`/platform/organizations/${org.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}