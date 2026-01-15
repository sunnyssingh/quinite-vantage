'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users, Activity, Shield, Database } from 'lucide-react'

export default function PlatformDashboard() {
  const [stats, setStats] = useState({
    organizations: 0,
    users: 0,
    platformAdmins: 0,
    database: { projectId: 'Loading...', url: '' }
  })

  useEffect(() => {
    fetch('/api/platform/stats')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setStats(data)
        }
      })
      .catch(console.error)
  }, [])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Platform Dashboard</h1>
        <p className="text-gray-500 mt-1">Global analytics and system overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.organizations}</div>
            <p className="text-xs text-gray-500 mt-1">
              Active organizations
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.platformAdmins} Platform Admins
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className={`h-4 w-4 ${stats.systemHealth === 100 ? 'text-green-600' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.systemHealth === 100 ? 'text-green-600' : 'text-red-500'}`}>
              {stats.systemHealth}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Operational Status
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow bg-slate-50 border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Database</CardTitle>
            <Database className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate" title={stats.database.projectId}>
              {stats.database.projectId}
            </div>
            <p className="text-xs text-gray-500 mt-1 truncate" title={stats.database.url}>
              Verified Connection
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics & Diagnostics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Real Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>Global Metrics</CardTitle>
            <CardDescription>Live data from database</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-600 font-medium">Total Calls</p>
                <p className="text-2xl font-bold text-purple-900">{stats.call_logs || 0}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Active Leads</p>
                <p className="text-2xl font-bold text-blue-900">{stats.leads || 0}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Campaigns</p>
                <p className="text-2xl font-bold text-green-900">{stats.campaigns || 0}</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-orange-600 font-medium">Projects</p>
                <p className="text-2xl font-bold text-orange-900">{stats.projects || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Diagnostic */}
        <Card>
          <CardHeader>
            <CardTitle>Database Integrity Check</CardTitle>
            <CardDescription>Verifying required tables exist</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 h-[200px] overflow-y-auto pr-2">
              {stats.tableStatus && Object.entries(stats.tableStatus).map(([table, status]) => (
                <div key={table} className="flex items-center justify-between p-2 rounded border border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-2">
                    {status.exists ? (
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                    )}
                    <span className="font-mono text-sm text-gray-700">{table}</span>
                  </div>
                  {status.exists ? (
                    <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
                      {status.count} rows
                    </span>
                  ) : (
                    <span className="text-xs text-red-600 font-bold bg-red-50 px-2 py-1 rounded">
                      MISSING
                    </span>
                  )}
                </div>
              ))}
              {!stats.tableStatus && <p className="text-sm text-gray-500">Running diagnostics...</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}