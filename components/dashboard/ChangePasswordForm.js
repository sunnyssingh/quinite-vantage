'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Lock, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function ChangePasswordForm() {
    const [passwords, setPasswords] = useState({
        newPassword: '',
        confirmPassword: ''
    })
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (passwords.newPassword.length < 6) {
            toast({
                variant: "destructive",
                title: "Invalid Password",
                description: "Password must be at least 6 characters long."
            })
            return
        }

        if (passwords.newPassword !== passwords.confirmPassword) {
            toast({
                variant: "destructive",
                title: "Mismatch",
                description: "Passwords do not match."
            })
            return
        }

        setLoading(true)

        try {
            const response = await fetch('/api/auth/update-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: passwords.newPassword })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update password')
            }

            toast({
                title: "Password Updated",
                description: "Your password has been changed successfully."
            })

            // Reset form
            setPasswords({ newPassword: '', confirmPassword: '' })

        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-gray-500" />
                    Change Password
                </CardTitle>
                <CardDescription>
                    Update your account password. Ensure it's at least 6 characters long.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                            id="new-password"
                            type="password"
                            placeholder="••••••••"
                            value={passwords.newPassword}
                            onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input
                            id="confirm-password"
                            type="password"
                            placeholder="••••••••"
                            value={passwords.confirmPassword}
                            onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                            required
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full sm:w-auto"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            'Update Password'
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
