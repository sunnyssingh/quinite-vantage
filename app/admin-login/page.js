'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Shield, Mail, Lock, AlertCircle, ArrowLeft } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function AdminLoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        // Check if user is actually a platform admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (profile?.role === 'platform_admin') {
          router.push('/dashboard/platform')
        } else {
          // If logged in but not admin, maybe sign them out or just show form?
          // For now, let's show the form so they can switch accounts.
          // Optional: Auto-sign out to prevent state confusion
          await supabase.auth.signOut()
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  const handleSignIn = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    const formData = new FormData(e.target)
    const email = formData.get('email')
    const password = formData.get('password')

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, isPlatformAdmin: true })
      })

      let data
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        const text = await response.text()
        console.error('Non-JSON response:', text)
        throw new Error(`Server returned ${response.status} ${response.statusText}`)
      }

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      toast.success('Login successful! Redirecting to platform dashboard...')
      setTimeout(() => router.push('/dashboard/platform'), 1000)
    } catch (err) {
      console.error('Login error:', err)
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="animate-pulse text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <Card className="w-full max-w-md shadow-2xl border-purple-500/20">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Platform Admin Access</CardTitle>
          <CardDescription className="text-center">
            Restricted access for platform administrators only
          </CardDescription>
        </CardHeader>
        <CardContent>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Admin Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="admin-email"
                  name="email"
                  type="email"
                  placeholder="admin@platform.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="admin-password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              disabled={submitting}
            >
              {submitting ? 'Signing in...' : 'Admin Sign In'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Button variant="ghost" onClick={() => router.push('/')} className="text-sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to User Login
            </Button>
          </div>

          {/* Legal Links Footer */}
          <div className="mt-4 pt-4 border-t border-gray-200 text-center text-xs text-gray-400 space-y-2">
            <div className="flex justify-center gap-3 flex-wrap">
              <a
                href="https://quinite.co/terms-conditions/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:underline"
              >
                Terms & Conditions
              </a>
              <span>•</span>
              <a
                href="https://quinite.co/privacy-policy/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:underline"
              >
                Privacy Policy
              </a>
              <span>•</span>
              <a
                href="https://quinite.co/refund-and-cancellation/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:underline"
              >
                Refund & Cancellation
              </a>
            </div>
            <div className="mt-4 text-xs text-gray-400">
              If you have any problem, <a href="https://quinite.co/contact/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">Contact Us</a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}