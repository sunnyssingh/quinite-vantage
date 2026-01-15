'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Mail, Phone, Shield } from 'lucide-react'
import ChangePasswordForm from '@/components/dashboard/ChangePasswordForm'

export default function PlatformProfilePage() {
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await fetch('/api/auth/user')
                const data = await response.json()
                if (data.user?.profile) {
                    setProfile(data.user.profile)
                }
            } catch (error) {
                console.error('Error fetching profile:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchProfile()
    }, [])

    if (loading) return <div className="p-8">Loading profile...</div>

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Platform Profile</h1>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Profile Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5 text-gray-500" />
                            Account Details
                        </CardTitle>
                        <CardDescription>Your personal information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Full Name</p>
                                <p className="text-lg font-medium text-gray-900">{profile?.full_name}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Mail className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Email Address</p>
                                <p className="text-lg font-medium text-gray-900">{profile?.email}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Phone className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Phone</p>
                                <p className="text-lg font-medium text-gray-900">{profile?.phone || 'Not provided'}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Shield className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Role</p>
                                <Badge variant="secondary" className="mt-1">
                                    {profile?.role?.replace('_', ' ').toUpperCase()}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Change Password */}
                <ChangePasswordForm />
            </div>
        </div>
    )
}
