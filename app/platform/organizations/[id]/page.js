'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Building2, Users, Mail, Shield, ArrowLeft, UserCircle, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function OrganizationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [organization, setOrganization] = useState(null)
  const [loading, setLoading] = useState(true)
  const [impersonating, setImpersonating] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchOrganization()
    }
  }, [params.id])

  const fetchOrganization = async () => {
    try {
      const response = await fetch(`/api/platform/organizations/${params.id}`)
      const data = await response.json()
      setOrganization(data.organization)
    } catch (error) {
      console.error('Error fetching organization:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImpersonate = async (userId) => {
    setImpersonating(true)
    try {
      const response = await fetch('/api/platform/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: userId,
          organizationId: params.id
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Redirect to org dashboard
        router.push('/dashboard')
      } else {
        alert(data.error || 'Impersonation failed')
      }
    } catch (error) {
      console.error('Impersonation error:', error)
      alert('Impersonation failed')
    } finally {
      setImpersonating(false)
    }
  }

  const getStatusBadge = (status) => {
    if (status === 'COMPLETED') {
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>
    }
    return <Badge className="bg-yellow-100 text-yellow-800">Pending Onboarding</Badge>
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">Loading organization...</div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Organization not found</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push('/platform/organizations')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Organizations
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
            <p className="text-gray-500 mt-1">Organization details and management</p>
          </div>
          {getStatusBadge(organization.onboarding_status)}
        </div>
      </div>

      {/* Organization Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Organization Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Organization ID</p>
              <p className="font-mono text-sm">{organization.id}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-gray-500">Created</p>
              <p className="font-medium">{new Date(organization.created_at).toLocaleString()}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="font-medium">{organization.users?.length || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Business Profile</CardTitle>
            <CardDescription>Company information (Placeholder)</CardDescription>
          </CardHeader>
          <CardContent>
            {organization.profile ? (
              <div className="space-y-2">
                <p className="text-sm"><strong>Sector:</strong> {organization.profile.sector}</p>
                <p className="text-sm"><strong>Business Type:</strong> {organization.profile.business_type || 'Not set'}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Business profile not completed</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Users */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Users</CardTitle>
          <CardDescription>Manage users and impersonate for support</CardDescription>
        </CardHeader>
        <CardContent>
          {!organization.users || organization.users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No users in this organization</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organization.users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserCircle className="w-5 h-5 text-gray-400" />
                        <span className="font-medium">{user.full_name || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-blue-100 text-blue-800">
                        {user.role?.name || 'No Role'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleImpersonate(user.id)}
                        disabled={impersonating}
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        {impersonating ? 'Impersonating...' : 'Login as User'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Usage & Billing Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Usage & Billing</CardTitle>
          <CardDescription>Organization usage metrics (Placeholder)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>Usage and billing metrics will be displayed here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}