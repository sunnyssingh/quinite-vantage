'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileText, Shield, User, Calendar } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function PlatformAuditPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [limit, setLimit] = useState('100')

  useEffect(() => {
    fetchLogs()
  }, [limit])

  const fetchLogs = async () => {
    try {
      const response = await fetch(`/api/platform/audit?limit=${limit}`)
      const data = await response.json()
      setLogs(data.logs || [])
    } catch (error) {
      console.error('Error fetching logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionBadgeColor = (action) => {
    if (action.includes('CREATED') || action.includes('STARTED')) return 'bg-green-100 text-green-800'
    if (action.includes('UPDATED') || action.includes('EDIT')) return 'bg-blue-100 text-blue-800'
    if (action.includes('DELETED') || action.includes('ENDED')) return 'bg-red-100 text-red-800'
    if (action.includes('IMPERSONATION')) return 'bg-orange-100 text-orange-800'
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Platform Audit Logs</h1>
          <p className="text-gray-500 mt-1">System-wide activity tracking</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-sm text-gray-600 whitespace-nowrap">Show:</span>
          <Select value={limit} onValueChange={setLimit}>
            <SelectTrigger className="w-full md:w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="50">50 logs</SelectItem>
              <SelectItem value="100">100 logs</SelectItem>
              <SelectItem value="200">200 logs</SelectItem>
              <SelectItem value="500">500 logs</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            All Platform Activity
          </CardTitle>
          <CardDescription>Complete audit trail across all organizations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Impersonated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  logs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {new Date(log.created_at).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{log.user_name || 'System'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getActionBadgeColor(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{log.entity_type || 'N/A'}</TableCell>
                      <TableCell>
                        {log.is_impersonated && (
                          <Badge className="bg-orange-100 text-orange-800">
                            <Shield className="w-3 h-3 mr-1" />
                            Yes
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}