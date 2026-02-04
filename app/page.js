'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building2, Mail, Lock, User, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Skeleton } from '@/components/ui/skeleton'

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
      <div className="min-h-screen w-full relative flex flex-col lg:flex-row bg-slate-50 overflow-hidden font-sans">
        {/* Left Column Skeleton */}
        <div className="hidden lg:flex flex-col justify-between p-16 xl:p-24 relative w-full lg:w-1/2 z-10">
          <Skeleton className="w-48 h-12 rounded-lg bg-slate-200" />
          <div className="space-y-10 max-w-xl">
            <div className="space-y-3">
              <Skeleton className="h-14 w-full rounded-lg bg-slate-200" />
              <Skeleton className="h-14 w-3/4 rounded-lg bg-slate-200" />
            </div>
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="w-10 h-10 rounded-full bg-slate-200" />
                  <Skeleton className="h-6 w-48 rounded bg-slate-200" />
                </div>
              ))}
            </div>
          </div>
          <Skeleton className="h-4 w-64 rounded bg-slate-200" />
        </div>

        {/* Right Column Skeleton */}
        <div className="w-full lg:w-1/2 h-full flex flex-col items-center justify-center p-6 lg:p-12 relative z-10">
          <Skeleton className="lg:hidden mb-8 w-40 h-10 rounded bg-slate-200" />
          <div className="w-full max-w-[440px] bg-white/80 backdrop-blur-xl rounded-xl border border-white/60 shadow-xl p-8 space-y-8">
            <div className="space-y-3">
              <Skeleton className="h-8 w-1/2 rounded bg-slate-200" />
              <Skeleton className="h-4 w-3/4 rounded bg-slate-200" />
            </div>
            <Skeleton className="w-full h-12 rounded-lg bg-slate-200" />
            <div className="space-y-5">
              <Skeleton className="h-10 w-full rounded-lg bg-slate-200" />
              <Skeleton className="h-10 w-full rounded-lg bg-slate-200" />
              <Skeleton className="h-10 w-full rounded-lg bg-slate-200" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full relative flex flex-col lg:flex-row bg-slate-50 overflow-hidden font-sans selection:bg-blue-500/30">

      {/* Light Animated Gradient Background */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none overflow-hidden">
        {/* White overlay for softening */}
        <div className="absolute inset-0 bg-white/30 z-10 backdrop-blur-[1px]"></div>

        {/* Animated Pastel Orbs - Mix Blend Multiply for Subtractive Color on Light BG */}
        <div className="absolute top-0 left-1/4 w-[50vw] h-[50vw] bg-purple-300/40 rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-[50vw] h-[50vw] bg-cyan-300/40 rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/4 w-[50vw] h-[50vw] bg-pink-300/40 rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-blob animation-delay-4000"></div>
        <div className="absolute bottom-0 right-1/4 w-[40vw] h-[40vw] bg-blue-300/40 rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-blob animation-delay-6000"></div>
      </div>

      {/* Grid Layout Implementation */}
      <div className="relative z-10 w-full min-h-screen grid lg:grid-cols-2">

        {/* Left Column: Hero Content - Fixed */}
        <div className="hidden lg:flex flex-col justify-between p-16 xl:p-24 relative h-screen overflow-hidden">

          {/* Logo Top Left - Dark text logo works on light bg */}
          <div className="relative w-48 h-12">
            <Image
              src="/assets/logo.svg"
              alt="Quinite Vantage"
              fill
              className="object-contain object-left"
              priority
            />
          </div>

          {/* Hero Branding - Dark Text */}
          <div className="space-y-10 max-w-xl">
            <h1 className="text-5xl font-bold tracking-tight text-slate-900 leading-[1.1] font-outfit">
              Join Industry Leaders that Trust Quinite to Automate their Conversations
            </h1>

            <div className="space-y-6">
              <div className="flex items-center gap-4 group">
                <div className="p-2 rounded-full bg-blue-600/5 border border-blue-600/10 group-hover:bg-blue-600/10 transition-colors">
                  <ShieldCheck className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-lg text-slate-600 font-medium">TRAI Compliant Calling</span>
              </div>

              <div className="flex items-center gap-4 group">
                <div className="p-2 rounded-full bg-blue-600/5 border border-blue-600/10 group-hover:bg-blue-600/10 transition-colors">
                  <ShieldCheck className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-lg text-slate-600 font-medium">Human-like AI Voice Agents</span>
              </div>

              <div className="flex items-center gap-4 group">
                <div className="p-2 rounded-full bg-blue-600/5 border border-blue-600/10 group-hover:bg-blue-600/10 transition-colors">
                  <ShieldCheck className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-lg text-slate-600 font-medium">Real-time Call Analytics</span>
              </div>
            </div>
          </div>

          {/* Copyright/Footer Text */}
          <div className="text-slate-500 text-sm font-medium">
            © 2026 Quinite Technologies. All rights reserved.
          </div>
        </div>


        {/* Right Column: Login Form - Scrollable */}
        <div className="w-full h-screen flex flex-col relative">
          {/* Mobile Logo - Fixed at top (Visible only on small screens) */}
          <div className="lg:hidden flex-shrink-0 pt-6 pb-4 px-6 relative">
            <div className="relative w-40 h-10 mx-auto">
              <Image
                src="/assets/logo.svg"
                alt="Quinite Vantage"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto flex flex-col items-center justify-start lg:justify-center py-6 px-6 lg:p-12">
            <div className="w-full max-w-[440px] flex flex-col items-center">
              <Card className="w-full shadow-2xl shadow-slate-200/50 border-white/60 bg-white/80 backdrop-blur-xl">
                <CardContent className="p-6 md:p-8">
                  <div className="mb-6 space-y-2 min-h-[76px]">
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                      Welcome to Quinite
                    </h2>
                    <p className="text-sm text-gray-500">
                      Get started with your email or company account
                    </p>
                  </div>

                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-100 p-1 h-11 rounded-lg">
                      <TabsTrigger
                        value="signin"
                        className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-md transition-all"
                      >
                        Sign In
                      </TabsTrigger>
                      <TabsTrigger
                        value="signup"
                        className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-md transition-all"
                      >
                        Sign Up
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="signin" className="mt-0">
                      <form onSubmit={handleSignIn} className="space-y-3.5">
                        <div className="space-y-2">
                          <Label htmlFor="signin-email" className="text-sm font-medium text-gray-700">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-3 h-[18px] w-[18px] text-gray-400" />
                            <Input
                              id="signin-email"
                              name="email"
                              type="email"
                              placeholder="name@example.com"
                              className="pl-11 h-11 text-[15px] border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="signin-password" className="text-sm font-medium text-gray-700">Password</Label>
                            <button
                              type="button"
                              onClick={() => setShowForgotPassword(true)}
                              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                            >
                              Forgot password?
                            </button>
                          </div>
                          <div className="relative">
                            <Lock className="absolute left-3.5 top-3 h-[18px] w-[18px] text-gray-400" />
                            <Input
                              id="signin-password"
                              name="password"
                              type={showSigninPassword ? "text" : "password"}
                              placeholder="••••••••"
                              className="pl-11 pr-11 h-11 text-[15px] border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowSigninPassword(!showSigninPassword)}
                              className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              {showSigninPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                            </button>
                          </div>
                        </div>
                        <Button
                          type="submit"
                          className="w-full h-11 text-[15px] font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all hover:shadow-md mt-4"
                          disabled={submitting}
                        >
                          {submitting ? 'Signing in...' : 'Sign In'}
                        </Button>
                      </form>
                    </TabsContent>

                    <TabsContent value="signup" className="mt-0">
                      <form onSubmit={handleSignUp} className="space-y-3.5">
                        <div className="space-y-2">
                          <Label htmlFor="signup-name" className="text-sm font-medium text-gray-700">Full Name</Label>
                          <div className="relative">
                            <User className="absolute left-3.5 top-3 h-[18px] w-[18px] text-gray-400" />
                            <Input
                              id="signup-name"
                              name="fullName"
                              type="text"
                              placeholder="John Doe"
                              className="pl-11 h-11 text-[15px] border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="signup-company" className="text-sm font-medium text-gray-700">Company Name</Label>
                          <div className="relative">
                            <Building2 className="absolute left-3.5 top-3 h-[18px] w-[18px] text-gray-400" />
                            <Input
                              id="signup-company"
                              name="companyName"
                              type="text"
                              placeholder="Acme Inc."
                              className="pl-11 h-11 text-[15px] border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="signup-email" className="text-sm font-medium text-gray-700">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-3 h-[18px] w-[18px] text-gray-400" />
                            <Input
                              id="signup-email"
                              name="email"
                              type="email"
                              placeholder="name@example.com"
                              className="pl-11 h-11 text-[15px] border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-password" className="text-sm font-medium text-gray-700">Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3.5 top-3 h-[18px] w-[18px] text-gray-400" />
                            <Input
                              id="signup-password"
                              name="password"
                              type={showSignupPassword ? "text" : "password"}
                              placeholder="••••••••"
                              className="pl-11 pr-11 h-11 text-[15px] border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                              required
                              minLength={6}
                            />
                            <button
                              type="button"
                              onClick={() => setShowSignupPassword(!showSignupPassword)}
                              className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              {showSignupPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                            </button>
                          </div>
                        </div>
                        <Button
                          type="submit"
                          className="w-full h-11 text-[15px] font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all hover:shadow-md mt-4"
                          disabled={submitting}
                        >
                          {submitting ? 'Creating account...' : 'Create Account'}
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Footer Links - Always visible below card */}
              <div className="mt-8 flex gap-6 text-xs text-slate-500 font-medium">
                <a href="https://quinite.co/terms-conditions/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">Terms & Conditions</a>
                <a href="https://quinite.co/refund-and-cancellation/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">Refund Policy</a>
                <a href="https://quinite.co/privacy-policy/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal - Minimal */}
      {showForgotPassword && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => {
            setShowForgotPassword(false)
            setForgotPasswordEmail('')
          }}
        >
          <Card
            className="w-full max-w-sm shadow-lg border-border bg-card"
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
      )
      }
    </div >
  )
}