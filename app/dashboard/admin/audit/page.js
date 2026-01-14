'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import React from 'react'
import {
  FileText,
  Activity,
  User,
  Calendar,
  Download,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Shield,
  Clock,
  Database
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function AuditPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // Filters
  const [search, setSearch] = useState('')
  const [action, setAction] = useState('')
  const [entityType, setEntityType] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isImpersonated, setIsImpersonated] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Statistics
  const [stats, setStats] = useState(null)
  const [loadingStats, setLoadingStats] = useState(true)

  // Expanded rows
  const [expandedRows, setExpandedRows] = useState(new Set())

  // Available filter options
  const [actions, setActions] = useState([])
  const [entityTypes, setEntityTypes] = useState([])

  useEffect(() => {
    fetchLogs()
  }, [page, pageSize, search, action, entityType, startDate, endDate, isImpersonated])

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString()
      })

      if (search) params.append('search', search)
      if (action) params.append('action', action)
      if (entityType) params.append('entity_type', entityType)
      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)
      if (isImpersonated) params.append('is_impersonated', isImpersonated)

      const response = await fetch(`/api/audit?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
        setTotal(data.total || 0)
        setTotalPages(data.totalPages || 0)
      }
    } catch (err) {
      console.error('Error fetching logs:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      setLoadingStats(true)
      const response = await fetch('/api/audit/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)

        // Extract unique actions and entity types
        if (data.byAction) {
          setActions(Object.keys(data.byAction).sort())
        }
        if (data.byEntityType) {
          setEntityTypes(Object.keys(data.byEntityType).sort())
        }
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
    } finally {
      setLoadingStats(false)
    }
  }

  const handleExport = async (format) => {
    try {
      setExporting(true)
      const params = new URLSearchParams({ format })

      if (search) params.append('search', search)
      if (action) params.append('action', action)
      if (entityType) params.append('entity_type', entityType)
      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)
      if (isImpersonated) params.append('is_impersonated', isImpersonated)

      const response = await fetch(`/api/audit/export?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (err) {
      console.error('Error exporting:', err)
    } finally {
      setExporting(false)
    }
  }

  const clearFilters = () => {
    setSearch('')
    setAction('')
    setEntityType('')
    setStartDate('')
    setEndDate('')
    setIsImpersonated('')
    setPage(1)
  }

  const toggleRowExpand = (logId) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId)
    } else {
      newExpanded.add(logId)
    }
    setExpandedRows(newExpanded)
  }

  const getActionBadgeColor = (actionText) => {
    if (actionText.includes('CREATE') || actionText.includes('STARTED')) return 'bg-green-100 text-green-800 border-green-200'
    if (actionText.includes('UPDATE') || actionText.includes('EDIT')) return 'bg-blue-100 text-blue-800 border-blue-200'
    if (actionText.includes('DELETE') || actionText.includes('ENDED')) return 'bg-red-100 text-red-800 border-red-200'
    if (actionText.includes('IMPERSONATION')) return 'bg-purple-100 text-purple-800 border-purple-200'
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const hasActiveFilters = search || action || entityType || startDate || endDate || isImpersonated

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 via-purple-50/20 to-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl">
              <FileText className="w-7 h-7 text-white" />
            </div>
            Audit Logs
          </h1>
          <p className="text-gray-500 mt-1">Track all activities and changes in your organization</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="border-2"
          >
            <Filter className="w-4 h-4 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          <Select value="" onValueChange={handleExport} disabled={exporting}>
            <SelectTrigger className="w-[140px] border-2">
              <Download className="w-4 h-4 mr-2" />
              <SelectValue placeholder={exporting ? "Exporting..." : "Export"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">Export CSV</SelectItem>
              <SelectItem value="json">Export JSON</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Statistics Cards */}
      {!loadingStats && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Database className="w-4 h-4" />
                Total Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.total.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-100 bg-gradient-to-br from-green-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Action Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{Object.keys(stats.byAction || {}).length}</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Entity Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{Object.keys(stats.byEntityType || {}).length}</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-100 bg-gradient-to-br from-orange-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Impersonated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{stats.impersonatedCount}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <Card className="border-2 border-purple-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Advanced Filters
              </span>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-1" />
                  Clear All
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search user, action, entity..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Action Type</label>
                <Select value={action} onValueChange={(val) => { setAction(val); setPage(1); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All actions</SelectItem>
                    {actions.map(a => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Entity Type</label>
                <Select value={entityType} onValueChange={(val) => { setEntityType(val); setPage(1); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All entities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All entities</SelectItem>
                    {entityTypes.map(e => (
                      <SelectItem key={e} value={e}>{e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Start Date</label>
                <Input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">End Date</label>
                <Input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Impersonated</label>
                <Select value={isImpersonated} onValueChange={(val) => { setIsImpersonated(val); setPage(1); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All logs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All logs</SelectItem>
                    <SelectItem value="true">Impersonated only</SelectItem>
                    <SelectItem value="false">Non-impersonated only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Table */}
      <Card className="shadow-xl border-2">
        <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-purple-50/30">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Activity History
              </CardTitle>
              <CardDescription>
                Showing {logs.length} of {total.toLocaleString()} logs
                {hasActiveFilters && ' (filtered)'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Per page:</span>
              <Select value={pageSize.toString()} onValueChange={(val) => { setPageSize(parseInt(val)); setPage(1); }}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 mx-auto mb-4 animate-spin text-purple-600" />
              <p className="text-gray-500">Loading audit logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No audit logs found</p>
              <p className="text-sm mt-2">
                {hasActiveFilters ? 'Try adjusting your filters' : 'Activity will appear here as users perform actions'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead className="font-semibold">Timestamp</TableHead>
                    <TableHead className="font-semibold">User</TableHead>
                    <TableHead className="font-semibold">Action</TableHead>
                    <TableHead className="font-semibold">Entity</TableHead>
                    <TableHead className="font-semibold">Entity ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map(log => (
                    <React.Fragment key={log.id}>
                      <TableRow
                        className="hover:bg-purple-50/30 cursor-pointer transition-colors"
                        onClick={() => toggleRowExpand(log.id)}
                      >
                        <TableCell>
                          {expandedRows.has(log.id) ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </TableCell>

                        <TableCell className="text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="font-medium text-gray-900">
                                {formatRelativeTime(log.created_at)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(log.created_at).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <div>
                              <span className="font-medium">
                                {log.user_name || 'Unknown'}
                              </span>

                              {log.is_impersonated && (
                                <Badge className="ml-2 bg-orange-100 text-orange-800 border-orange-200 text-xs">
                                  <Shield className="w-3 h-3 mr-1" />
                                  Impersonated
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge className={`${getActionBadgeColor(log.action)} border font-medium`}>
                            {log.action}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <span className="text-sm font-medium text-gray-700">
                            {log.entity_type || 'N/A'}
                          </span>
                        </TableCell>

                        <TableCell>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-600">
                            {log.entity_id ? `${log.entity_id.substring(0, 8)}...` : 'N/A'}
                          </code>
                        </TableCell>
                      </TableRow>

                      {expandedRows.has(log.id) && (
                        <TableRow className="bg-slate-50">
                          <TableCell colSpan={6} className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                <Database className="w-4 h-4" />
                                Metadata
                              </div>

                              {log.metadata && Object.keys(log.metadata).length > 0 ? (
                                <pre className="bg-white p-4 rounded-lg border-2 border-gray-200 text-xs overflow-x-auto">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              ) : (
                                <p className="text-sm text-gray-500 italic">
                                  No metadata available
                                </p>
                              )}

                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="font-semibold text-gray-700">
                                    Full Entity ID:
                                  </span>
                                  <code className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                                    {log.entity_id || 'N/A'}
                                  </code>
                                </div>

                                <div>
                                  <span className="font-semibold text-gray-700">
                                    Log ID:
                                  </span>
                                  <code className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                                    {log.id}
                                  </code>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>

              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {page} of {totalPages} ({total.toLocaleString()} total logs)
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (page <= 3) {
                  pageNum = i + 1
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = page - 2 + i
                }

                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(pageNum)}
                    className={page === pageNum ? "bg-purple-600 hover:bg-purple-700" : ""}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
