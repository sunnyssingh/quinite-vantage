'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'react-hot-toast'
import { Send, Users, Shield, User } from 'lucide-react'

export default function SendNotificationPage() {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        target_type: 'all', // all, role, user
        target_value: '',
        type: 'info',
        title: '',
        message: '',
        link: ''
    })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await fetch('/api/platform/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Failed to send')

            toast.success(data.message || 'Notifications sent successfully')
            setFormData({
                target_type: 'all',
                target_value: '',
                type: 'info',
                title: '',
                message: '',
                link: ''
            })
        } catch (error) {
            console.error('Error:', error)
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container max-w-2xl py-10">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                        <Send className="h-6 w-6 text-primary" />
                        Broadcast Notification
                    </CardTitle>
                    <CardDescription>
                        Send a message to users, roles, or the entire platform.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Target Selection */}
                        <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Target Audience</h3>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Send To</Label>
                                    <Select
                                        value={formData.target_type}
                                        onValueChange={(v) => setFormData({ ...formData, target_type: v, target_value: '' })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4" /> All Users
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="role">
                                                <div className="flex items-center gap-2">
                                                    <Shield className="h-4 w-4" /> Specific Role
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="user">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4" /> Specific User (Email)
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {formData.target_type === 'role' && (
                                    <div className="space-y-2">
                                        <Label>Select Role</Label>
                                        <Select
                                            value={formData.target_value}
                                            onValueChange={(v) => setFormData({ ...formData, target_value: v })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select role..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Admin">Admin</SelectItem>
                                                <SelectItem value="Member">Member</SelectItem>
                                                <SelectItem value="Owner">Owner</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {formData.target_type === 'user' && (
                                    <div className="space-y-2">
                                        <Label>User Email</Label>
                                        <Input
                                            placeholder="user@example.com"
                                            type="email"
                                            value={formData.target_value}
                                            onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                                            required
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Message Details */}
                        <div className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Notification Type</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(v) => setFormData({ ...formData, type: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="info">Info (Blue)</SelectItem>
                                            <SelectItem value="success">Success (Green)</SelectItem>
                                            <SelectItem value="warning">Warning (Yellow)</SelectItem>
                                            <SelectItem value="error">Error (Red)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Link (Optional)</Label>
                                    <Input
                                        placeholder="/dashboard/..."
                                        value={formData.link}
                                        onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input
                                    placeholder="e.g. System Maintenance"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Message</Label>
                                <Textarea
                                    placeholder="Enter your message here..."
                                    className="min-h-[100px]"
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Sending...' : 'Send Notification'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
