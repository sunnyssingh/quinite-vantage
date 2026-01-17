'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building2, Users, Activity, Shield, Database } from 'lucide-react'

export default function PlatformDashboard() {
  const [stats, setStats] = useState({
    organizations: 0,
    users: 0,
    platformAdmins: 0,
    database: { projectId: 'Loading...', url: '' },
    overview: {
      totalOrgs: 0,
      activeOrgs: 0,
      totalUsers: 0,
      totalCalls: 0
    }
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
        <h1 className="text-3xl font-bold text-gray-900">Platform Overview</h1>
        <p className="text-gray-500 mt-1">Global ecosystem performance and health</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-all border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview?.totalOrgs || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              Registered tenants
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview?.totalUsers || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              Across all organizations
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {stats.overview?.totalCalls?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Lifetime processed
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Shield className={`h-4 w-4 ${stats.systemHealth === 100 ? 'text-green-600' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.systemHealth === 100 ? 'text-green-600' : 'text-red-500'}`}>
              {stats.systemHealth}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.systemHealth === 100 ? 'All Systems Operational' : 'Issues Detected'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Database Health (2/3 width) */}
        <Card className="col-span-1 lg:col-span-2 shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-gray-500" />
              <CardTitle>Database Schema Integrity</CardTitle>
            </div>
            <CardDescription className="flex items-center gap-2">
              Project ID: <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{stats.database.projectId}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {stats.tableStatus && Object.entries(stats.tableStatus).map(([table, status]) => (
                <div key={table} className={`flex items-center justify-between p-3 rounded-lg border ${status.exists ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm text-gray-900 capitalize">{table.replace('_', ' ')}</span>
                    <span className={`text-xs ${status.exists ? 'text-green-600' : 'text-red-600'}`}>
                      {status.exists ? 'Active' : 'Missing'}
                    </span>
                  </div>
                  {status.exists && (
                    <Badge variant="secondary" className="bg-white text-gray-600 pointer-events-none">
                      {status.count}
                    </Badge>
                  )}
                </div>
              ))}
              {!stats.tableStatus && [1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-lg"></div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions (1/3 width) */}
        <Card className="shadow-md bg-gradient-to-br from-purple-900 to-indigo-900 text-white border-0">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
            <CardDescription className="text-purple-200">Management Controls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="secondary" className="w-full justify-start hover:bg-white/90" onClick={() => window.location.href = '/dashboard/platform/organizations'}>
              <Building2 className="w-4 h-4 mr-2" />
              Manage Organizations
            </Button>
            <Button variant="secondary" className="w-full justify-start hover:bg-white/90" onClick={() => window.location.href = '/dashboard/platform/audit'}>
              <Activity className="w-4 h-4 mr-2" />
              View Audit Logs
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}