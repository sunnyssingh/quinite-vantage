'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Building2, Users, MoreHorizontal, UserCheck, Ban, CheckCircle, Trash2, Phone } from 'lucide-react'
import { toast } from 'react-hot-toast'

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
      toast.error('Failed to load organizations')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (id, action) => {
    const toastId = toast.loading(`Processing ${action}...`)
    try {
      const response = await fetch(`/api/platform/organizations?id=${id}&action=${action}`, {
        method: 'POST'
      })

      if (!response.ok) throw new Error('Action failed')

      toast.success(`${action} successful`, { id: toastId })
      fetchOrganizations() // Refresh list
    } catch (err) {
      toast.error(`Failed to ${action} organization`, { id: toastId })
    }
  }

  const handleImpersonate = async (orgId) => {
    const toastId = toast.loading('Starting impersonation...')
    try {
      const response = await fetch('/api/platform/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: orgId })
      })

      if (!response.ok) throw new Error('Impersonation failed')

      const data = await response.json()
      toast.success('Impersonation active! Redirecting...', { id: toastId })

      // Redirect to the organization dashboard
      setTimeout(() => {
        window.location.href = data.redirectUrl || '/dashboard/admin'
      }, 1000)

    } catch (err) {
      toast.error('Impersonation failed', { id: toastId })
    }
  }

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Active</Badge>
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Suspended</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  /* ... inside component ... */
  const [editOrg, setEditOrg] = useState(null)

  // ... existing fetchOrganizations ...

  const handleUpdateSettings = async (e) => {
    e.preventDefault()
    if (!editOrg) return

    const toastId = toast.loading('Updating settings...')
    try {
      const callerId = e.target.callerId.value

      const response = await fetch(`/api/platform/organizations?id=${editOrg.id}&action=update_settings`, {
        method: 'POST',
        body: JSON.stringify({ caller_id: callerId })
      })

      if (!response.ok) throw new Error('Update failed')

      toast.success('Settings updated', { id: toastId })
      setEditOrg(null)
      fetchOrganizations()
    } catch (err) {
      toast.error('Failed to update settings', { id: toastId })
    }
  }

  /* ... existing getStatusBadge ... */

  return (
    <div className="p-6 space-y-6">
      {/* ... Header ... */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
          <p className="text-gray-500 mt-1">Manage tenant accounts and access</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered Organizations</CardTitle>
          <CardDescription>Total: {organizations.length}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : organizations.length === 0 ? (
            /* ... empty state ... */
            <div className="text-center py-12 text-gray-500">
              <Building2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No organizations found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Caller ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations.map(org => (
                    <TableRow key={org.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{org.name}</span>
                          <span className="text-xs text-gray-500">{org.slug || 'No slug'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {org.caller_id ? (
                          <div className="flex items-center gap-1 text-sm text-gray-700">
                            <Phone className="h-3 w-3" /> {org.caller_id}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Default</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(org.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Users className="w-4 h-4" />
                          {org._count?.profiles || org.users?.length || 0}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(org.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setEditOrg(org)}>
                              <Phone className="mr-2 h-4 w-4" />
                              Assign Number
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleImpersonate(org.id)}>
                              <UserCheck className="mr-2 h-4 w-4" />
                              Impersonate Admin
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {/* ... actions ... */}
                            {org.status === 'suspended' ? (
                              <DropdownMenuItem onClick={() => handleAction(org.id, 'activate')}>
                                <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                Activate Organization
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleAction(org.id, 'suspend')}>
                                <Ban className="mr-2 h-4 w-4 text-orange-600" />
                                Suspend Access
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this organization? This cannot be undone.')) {
                                  handleAction(org.id, 'delete')
                                }
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Organization
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Settings Modal */}
      {editOrg && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h2 className="text-xl font-bold mb-4">Edit Organization Settings</h2>
            <form onSubmit={handleUpdateSettings} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Caller ID</label>
                <div className="flex items-center gap-2 border rounded-md px-3 py-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <input
                    name="callerId"
                    defaultValue={editOrg.caller_id || ''}
                    placeholder="+919876543210"
                    className="flex-1 outline-none text-sm"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Must be a valid verified number in Plivo.</p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={() => setEditOrg(null)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}