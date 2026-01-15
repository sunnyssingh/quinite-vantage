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
import { useToast } from '@/hooks/use-toast'

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
  const { toast } = useToast()

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        // User is logged in - show option to continue or sign out
        setLoading(false)
        toast({
          title: 'Welcome back!',
          description: `You're logged in as ${session.user.email}`
        })
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
      toast({
        title: 'Success',
        description: 'Signed out successfully'
      })
      // Reload the page to show signin/signup forms
      window.location.reload()
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to sign out'
      })
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
        toast({
          title: 'Account created!',
          description: 'Please check your email to confirm before signing in.',
          duration: 6000
        })
        setActiveTab('signin')
        setSubmitting(false)
        return
      }

      // If no confirmation needed, proceed with auto-signin and onboarding

      // toast.loading('Logging in to complete onboarding...', { id: 'signup' }) - removed as Shadcn toast doesn't support persistent loading with ID directly like sonner

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

        toast({
          variant: 'destructive',
          title: 'Onboarding failed',
          description: `${onboardData.error}. Setup incomplete. Try logging in again.`
        })
        setActiveTab('signin')
        setSubmitting(false)
        return
      }



      // Success! Redirect to onboarding wizard

      toast({
        title: 'Success',
        description: 'Account created! Complete your onboarding to get started.'
      })
      setTimeout(() => router.push('/onboarding'), 1500)
    } catch (err) {

      toast({
        variant: 'destructive',
        title: 'Signup failed',
        description: err.message
      })
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


        // toast.loading('Setting up your organization...', { id: 'signin' }) - Shadcn toast replacement

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

          toast({
            variant: 'destructive',
            title: 'Setup failed',
            description: `${onboardData.error}. Please try again.`
          })
          setSubmitting(false)
          return
        }



        toast({
          title: 'Welcome!',
          description: 'Complete your onboarding to get started.'
        })
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


        toast({
          title: 'Welcome back!',
          description: 'Redirecting to dashboard...'
        })
        setTimeout(() => router.push(dashboardRoute), 1000)
      }
    } catch (err) {

      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message
      })
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="animate-pulse">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full">
              <Building2 className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Welcome to Quinite Vantage</CardTitle>
          <CardDescription className="text-center">
            AI-Powered Call Automation Platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      placeholder="your.email@company.com"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signin-password"
                      name="password"
                      type={showSigninPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowSigninPassword(!showSigninPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showSigninPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Signing in...' : 'Sign In'}
                </Button>
                <div className="text-center mt-3">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
              </form>
              <div className="mt-4 text-center text-sm text-gray-600">
                <a href="/admin-login" className="text-blue-600 hover:underline">
                  Platform Admin Login
                </a>
              </div>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-name"
                      name="fullName"
                      type="text"
                      placeholder="John Doe"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-company">Company Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-company"
                      name="companyName"
                      type="text"
                      placeholder="Acme Inc."
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="your.email@company.com"
                      className="pl-10"
                      required
                      title="Please enter a valid email address"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-password"
                      name="password"
                      type={showSignupPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Forgot Password Modal - Modern Design */}
      {showForgotPassword && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
          onClick={() => {
            setShowForgotPassword(false)
            setForgotPasswordEmail('')
          }}
        >
          <Card
            className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-md animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="space-y-3 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                    <Lock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Reset Password
                    </CardTitle>
                    <CardDescription className="text-sm mt-0.5">
                      We'll send you a reset link
                    </CardDescription>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowForgotPassword(false)
                    setForgotPasswordEmail('')
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={forgotPasswordLoading}
                >
                  {/* Removed AlertCircle, assuming a close icon or similar is intended */}
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email" className="text-sm font-medium text-gray-700">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="forgot-email"
                      type="email"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      placeholder="your.email@company.com"
                      className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                      disabled={forgotPasswordLoading}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">
                    Enter the email associated with your account
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-11 border-gray-200 hover:bg-gray-50"
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
                    className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30"
                    disabled={forgotPasswordLoading}
                  >
                    {forgotPasswordLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </div>
                    ) : (
                      'Send Reset Link'
                    )}
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