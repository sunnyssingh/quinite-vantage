'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building2, Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function AuthPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showSigninPassword, setShowSigninPassword] = useState(false)
  const [showSignupPassword, setShowSignupPassword] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('signin')

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setLoading(false) // Stop loading immediately to show UI/toast if needed briefly

        // Fetch user profile to get role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        const role = profile?.role || 'employee'
        const dashboardRoutes = {
          platform_admin: '/dashboard/platform',
          super_admin: '/dashboard/admin',
          manager: '/dashboard/manager',
          employee: '/dashboard/employee'
        }

        const dashboardRoute = dashboardRoutes[role] || '/dashboard/admin'

        toast.success(`Welcome back! Redirecting to dashboard...`)
        router.push(dashboardRoute)
      } else {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  const handleSignOut = async () => {
    setSubmitting(true)
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
      await supabase.auth.signOut()
      await supabase.auth.signOut()
      toast.success('Signed out successfully')
      // Reload the page to show signin/signup forms
      window.location.reload()
    } catch (err) {
      toast.error('Failed to sign out')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    const formData = new FormData(e.target)
    const email = formData.get('email')
    const password = formData.get('password')
    const fullName = formData.get('fullName')
    const companyName = formData.get('companyName')

    try {
      // Step 1: Create auth account
      const signupResponse = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, companyName })
      })

      const signupData = await signupResponse.json()

      if (!signupResponse.ok) {
        throw new Error(signupData.error || 'Signup failed')
      }

      // Check if email confirmation is needed
      if (signupData.needsConfirmation) {
        toast.success('Account created! Please check your email to confirm before signing in.')
        setActiveTab('signin')
        setSubmitting(false)
        return
      }

      // If no confirmation needed, proceed with auto-signin and onboarding

      // Step 2: Sign in to get session
      const signinResponse = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, isPlatformAdmin: false })
      })

      const signinData = await signinResponse.json()

      if (!signinResponse.ok) {
        throw new Error(signinData.error || 'Login after signup failed')
      }

      // Step 3: Run onboarding to create org and setup profile
      const onboardResponse = await fetch('/api/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, organizationName: companyName || 'My Organization' })
      })

      const onboardData = await onboardResponse.json()

      if (!onboardResponse.ok && !onboardData.alreadyOnboarded) {
        toast.error(`${onboardData.error}. Setup incomplete. Try logging in again.`)
        setActiveTab('signin')
        setSubmitting(false)
        return
      }

      // Success! Redirect to onboarding wizard
      toast.success('Account created! Complete your onboarding to get started.')
      setTimeout(() => router.push('/onboarding'), 1500)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

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
        body: JSON.stringify({ email, password, isPlatformAdmin: false })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // Check if user needs to complete onboarding
      if (data.needsOnboarding) {
        // Get user data from signin response
        const fullName = data.user?.user_metadata?.full_name || data.user?.email?.split('@')[0]
        const companyName = data.user?.user_metadata?.company_name || 'My Organization'

        // Call onboarding API to create organization
        const onboardResponse = await fetch('/api/onboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullName, organizationName: companyName })
        })

        const onboardData = await onboardResponse.json()

        if (!onboardResponse.ok && !onboardData.alreadyOnboarded) {
          toast.error(`${onboardData.error}. Please try again.`)
          setSubmitting(false)
          return
        }

        toast.success('Complete your onboarding to get started.')
        setTimeout(() => router.push('/onboarding'), 1000)
      } else {
        // Role-based redirect
        const role = data.user?.role || 'employee'
        const dashboardRoutes = {
          platform_admin: '/dashboard/platform',
          super_admin: '/dashboard/admin',
          manager: '/dashboard/manager',
          employee: '/dashboard/employee'
        }

        const dashboardRoute = dashboardRoutes[role] || '/dashboard/admin'

        toast.success('Welcome back! Redirecting to dashboard...')
        setTimeout(() => router.push(dashboardRoute), 1000)
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setForgotPasswordLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotPasswordEmail })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email')
      }

      toast.success(data.message)
      setTimeout(() => {
        setShowForgotPassword(false)
        setForgotPasswordEmail('')
      }, 3000)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setForgotPasswordLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="animate-pulse text-sm text-muted-foreground">Loading application...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 animate-in fade-in duration-500">

      {/* Minimal Header/Logo Area */}
      <div className="mb-8 text-center space-y-2">
        <div className="inline-flex items-center justify-center p-3 rounded-xl bg-primary/5 mb-4 ring-1 ring-border">
          <Building2 className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Quinite Vantage</h1>
        <p className="text-sm text-muted-foreground">AI-Powered Call Automation Platform</p>
      </div>

      <Card className="w-full max-w-sm shadow-sm border-border bg-card">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-lg font-medium text-center">Welcome back</CardTitle>
          <CardDescription className="text-center text-xs">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50 p-1">
              <TabsTrigger value="signin" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-0">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="text-xs font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      placeholder="name@example.com"
                      className="pl-9 h-9 text-sm bg-background/50"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="signin-password" className="text-xs font-medium">Password</Label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs text-primary hover:text-primary/80 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signin-password"
                      name="password"
                      type={showSigninPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-9 pr-9 h-9 text-sm bg-background/50"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowSigninPassword(!showSigninPassword)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showSigninPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full h-9 text-sm font-medium" disabled={submitting}>
                  {submitting ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-0">
              <form onSubmit={handleSignUp} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="signup-name" className="text-xs font-medium">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-name"
                      name="fullName"
                      type="text"
                      placeholder="John Doe"
                      className="pl-9 h-9 text-sm bg-background/50"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="signup-company" className="text-xs font-medium">Company Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-company"
                      name="companyName"
                      type="text"
                      placeholder="Acme Inc."
                      className="pl-9 h-9 text-sm bg-background/50"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="signup-email" className="text-xs font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="name@example.com"
                      className="pl-9 h-9 text-sm bg-background/50"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-password" className="text-xs font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      name="password"
                      type={showSignupPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-9 pr-9 h-9 text-sm bg-background/50"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showSignupPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full h-9 text-sm font-medium mt-1" disabled={submitting}>
                  {submitting ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Minimal Footer */}
          <div className="mt-6 pt-4 border-t border-dashed border-border text-center text-[10px] text-muted-foreground space-y-2">
            <p>By continuing, you agree to our</p>
            <div className="flex justify-center gap-3">
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <span>•</span>
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Forgot Password Modal - Minimal */}
      {showForgotPassword && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
          onClick={() => {
            setShowForgotPassword(false)
            setForgotPasswordEmail('')
          }}
        >
          <Card
            className="w-full max-w-sm shadow-lg border-border bg-card animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="space-y-2 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Reset Password</CardTitle>
                <button
                  onClick={() => {
                    setShowForgotPassword(false)
                    setForgotPasswordEmail('')
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <span className="sr-only">Close</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <CardDescription className="text-xs">
                Enter your email to receive a reset link
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    id="forgot-email"
                    type="email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="h-9 text-sm"
                    required
                    disabled={forgotPasswordLoading}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => {
                      setShowForgotPassword(false)
                      setForgotPasswordEmail('')
                    }}
                    disabled={forgotPasswordLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="h-8 text-xs"
                    disabled={forgotPasswordLoading}
                  >
                    {forgotPasswordLoading ? 'Sending...' : 'Send Link'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}