'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
  Building2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Home,
  Briefcase,
  MapPin,
  FileText,
  Check
} from 'lucide-react'
import { INDIAN_STATES, CITIES_BY_STATE } from '@/lib/indian-locations'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const STEPS = [
  { id: 1, title: 'Sector', icon: Briefcase },
  { id: 2, title: 'Business Type', icon: Building2 },
  { id: 3, title: 'Company Details', icon: FileText },
  { id: 4, title: 'Address', icon: MapPin },
  { id: 5, title: 'Review', icon: Check }
]

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)
  const [org, setOrg] = useState(null)

  // Form data
  const [formData, setFormData] = useState({
    sector: 'real_estate',
    businessType: '',
    companyName: '',
    gstin: '',
    contactNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: 'India',
    pincode: ''
  })
  const [availableCities, setAvailableCities] = useState([])

  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/')
        return
      }

      // Add timeout to prevent infinite loading
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      try {
        const userResponse = await fetch('/api/auth/user', {
          signal: controller.signal
        })
        clearTimeout(timeoutId)

        if (!userResponse.ok) {
          throw new Error('Failed to fetch user data')
        }

        const userData = await userResponse.json()

        if (!userData.user) {
          router.push('/')
          return
        }

        // Allow onboarding for:
        // 1. Users without a role yet (initial onboarding)
        // 2. Users with Client Super Admin role
        const userRole = userData.user.profile?.role?.name
        const hasOrganization = userData.user.profile?.organization_id

        // If user has a role but it's not Client Super Admin, block onboarding
        if (userRole && userRole !== 'Client Super Admin') {
          setError('Only Client Super Admin can complete onboarding')
          setLoading(false)
          return
        }

        // If onboarding completed, redirect to dashboard
        if (userData.user.profile?.organization?.onboarding_status === 'COMPLETED') {
          router.push('/dashboard')
          return
        }

        setUser(userData.user)
        setOrg(userData.user.profile?.organization)

        // Load existing profile data if any
        await loadProfile()
        setLoading(false)
      } catch (fetchError) {
        clearTimeout(timeoutId)
        if (fetchError.name === 'AbortError') {
          setError('Request timeout. Please check your connection and try again.')
        } else {
          setError('Failed to load user data. Please try again.')
        }
        setLoading(false)
      }
    } catch (error) {
      console.error('Error in checkStatus:', error)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  const loadProfile = async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch('/api/organization/profile', {
        signal: controller.signal
      })
      clearTimeout(timeoutId)

      if (!response.ok) {
        console.warn('No existing profile found, starting fresh')
        return
      }

      const data = await response.json()

      if (data.profile && Object.keys(data.profile).length > 0) {
        setFormData({
          sector: data.profile.sector || 'real_estate',
          businessType: data.profile.business_type || '',
          companyName: data.profile.company_name || '',
          gstin: data.profile.gstin || '',
          contactNumber: data.profile.contact_number || '',
          addressLine1: data.profile.address_line_1 || '',
          addressLine2: data.profile.address_line_2 || '',
          city: data.profile.city || '',
          state: data.profile.state || '',
          country: data.profile.country || 'India',
          pincode: data.profile.pincode || ''
        })
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('Profile load timeout:', error)
      } else {
        console.error('Error loading profile:', error)
      }
      // Don't block onboarding if profile load fails
    }
  }

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Update available cities when state changes
    if (field === 'state') {
      const cities = CITIES_BY_STATE[value] || []
      setAvailableCities(cities)
      // Reset city if it's not in the new state's cities
      if (!cities.includes(formData.city)) {
        setFormData(prev => ({ ...prev, city: '' }))
      }
    }

    setError('')
  }

  const saveDraft = async () => {
    setSaving(true)
    try {
      await fetch('/api/organization/profile', {
        method: 'PUT', // ✅ FIXED
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sector: formData.sector,
          businessType: formData.businessType,
          companyName: formData.companyName,
          gstin: formData.gstin,
          contactNumber: formData.contactNumber,
          addressLine1: formData.addressLine1,
          addressLine2: formData.addressLine2,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          pincode: formData.pincode,
          isComplete: false
        })
      })
    } catch (error) {
      console.error('Error saving draft:', error)
    } finally {
      setSaving(false)
    }
  }


  const validateStep = () => {
    switch (currentStep) {
      case 1:
        return formData.sector !== ''
      case 2:
        return formData.businessType !== ''
      case 3:
        if (!formData.companyName.trim()) {
          setError('Company name is required')
          return false
        }
        if (!formData.contactNumber.trim()) {
          setError('Contact number is required')
          return false
        }
        // Validate phone number (10 digits)
        const phoneRegex = /^[6-9]\d{9}$/
        if (!phoneRegex.test(formData.contactNumber.replace(/[^\d]/g, ''))) {
          setError('Please enter a valid 10-digit Indian mobile number')
          return false
        }
        return true
      case 4:
        if (!formData.addressLine1.trim()) {
          setError('Address line 1 is required')
          return false
        }
        if (!formData.city.trim()) {
          setError('City is required')
          return false
        }
        if (!formData.state.trim()) {
          setError('State is required')
          return false
        }
        if (!formData.pincode.trim()) {
          setError('Pincode is required')
          return false
        }
        return true
      case 5:
        return true
      default:
        return false
    }
  }

  const nextStep = async () => {
    if (!validateStep()) return

    // Save draft when moving forward
    await saveDraft()

    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setError('')
    }
  }

  const handleSubmit = async () => {
    if (!validateStep()) return

    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/organization/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sector: formData.sector,
          businessType: formData.businessType,
          companyName: formData.companyName,
          gstin: formData.gstin,
          contactNumber: formData.contactNumber,
          addressLine1: formData.addressLine1,
          addressLine2: formData.addressLine2,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          pincode: formData.pincode,
          isComplete: true
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete onboarding')
      }

      // Success! Redirect to dashboard
      router.push('/dashboard')

    } catch (error) {
      setError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="animate-pulse">Loading...</div>
      </div>
    )
  }

  if (error && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button
              className="w-full mt-4"
              onClick={async () => {
                await fetch('/api/auth/signout', { method: 'POST' })
                await supabase.auth.signOut()
                router.push('/')
              }}
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full">
              <Building2 className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Organization Onboarding</h1>
          <p className="text-gray-600 mt-2">Complete your business profile to get started</p>
          <p className="text-sm text-gray-500 mt-1">Organization: <strong>{org?.name}</strong></p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {STEPS.map((step, index) => {
              const Icon = step.icon
              const isCompleted = currentStep > step.id
              const isCurrent = currentStep === step.id

              return (
                <div key={step.id} className="flex-1 flex items-center">
                  <div className="flex flex-col items-center w-full">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      ${isCompleted ? 'bg-green-600 text-white' : ''}
                      ${isCurrent ? 'bg-blue-600 text-white' : ''}
                      ${!isCurrent && !isCompleted ? 'bg-gray-300 text-gray-600' : ''}
                    `}>
                      {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <p className={`text-xs mt-2 text-center ${isCurrent ? 'font-bold' : ''}`}>
                      {step.title}
                    </p>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 ${isCompleted ? 'bg-green-600' : 'bg-gray-300'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Form Card */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>
              Step {currentStep} of 5: {STEPS[currentStep - 1].title}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && 'Select your business sector'}
              {currentStep === 2 && 'Choose your business type'}
              {currentStep === 3 && 'Enter your company information'}
              {currentStep === 4 && 'Provide your business address'}
              {currentStep === 5 && 'Review and submit your details'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Step 1: Sector */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <Label>Select your sector</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => updateFormData('sector', 'real_estate')}
                    className={`p-6 border-2 rounded-lg text-left transition-all ${formData.sector === 'real_estate'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <Home className="w-8 h-8 mb-2 text-blue-600" />
                    <h3 className="font-semibold text-lg">Real Estate</h3>
                    <p className="text-sm text-gray-600 mt-1">Property sales, rentals, and management</p>
                  </button>

                  <div className="p-6 border-2 border-gray-200 rounded-lg text-left opacity-50 cursor-not-allowed">
                    <Briefcase className="w-8 h-8 mb-2 text-gray-400" />
                    <h3 className="font-semibold text-lg">Other Sectors</h3>
                    <p className="text-sm text-gray-600 mt-1">Coming Soon</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Business Type */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <Label>What type of real estate business are you?</Label>
                <RadioGroup value={formData.businessType} onValueChange={(value) => updateFormData('businessType', value)}>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <RadioGroupItem value="agent" id="agent" />
                    <Label htmlFor="agent" className="cursor-pointer flex-1">
                      <div>
                        <p className="font-medium">Real Estate Agent / Broker</p>
                        <p className="text-sm text-gray-600">Individual agents or brokerage firms</p>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <RadioGroupItem value="builder" id="builder" />
                    <Label htmlFor="builder" className="cursor-pointer flex-1">
                      <div>
                        <p className="font-medium">Real Estate Developer / Builder</p>
                        <p className="text-sm text-gray-600">Property development and construction companies</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Step 3: Company Details */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => updateFormData('companyName', e.target.value)}
                    placeholder="Enter your company name"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="gstin">GSTIN (Optional)</Label>
                  <Input
                    id="gstin"
                    value={formData.gstin}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase()
                      // Limit to 15 characters
                      if (value.length <= 15) {
                        updateFormData('gstin', value)
                      }
                    }}
                    onBlur={(e) => {
                      const value = e.target.value
                      if (value && value.length > 0) {
                        // Validate if user entered something
                        if (value.length !== 15) {
                          setError('GSTIN must be exactly 15 characters')
                        } else {
                          const stateCode = parseInt(value.substring(0, 2))
                          if (isNaN(stateCode) || stateCode < 1 || stateCode > 37) {
                            setError('Invalid GSTIN: First 2 digits must be a valid state code (01-37)')
                          } else {
                            setError('') // Clear error if valid
                          }
                        }
                      }
                    }}
                    placeholder="Enter your GSTIN (15 characters)"
                    className="mt-1"
                    maxLength={15}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Goods and Services Tax Identification Number (15 characters, first 2 digits = state code)
                  </p>
                </div>

                <div>
                  <Label htmlFor="contactNumber">Contact Number *</Label>
                  <Input
                    id="contactNumber"
                    type="tel"
                    value={formData.contactNumber}
                    onChange={(e) => {
                      // Only allow digits and limit to 10
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                      updateFormData('contactNumber', value)
                    }}
                    placeholder="+91 XXXXXXXXXX"
                    className="mt-1"
                    maxLength={10}
                    pattern="[6-9][0-9]{9}"
                    title="Please enter a valid 10-digit Indian mobile number starting with 6-9"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter 10-digit mobile number (starting with 6, 7, 8, or 9)
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Address */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="addressLine1">Address Line 1 *</Label>
                  <Input
                    id="addressLine1"
                    value={formData.addressLine1}
                    onChange={(e) => updateFormData('addressLine1', e.target.value)}
                    placeholder="Building name, street"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="addressLine2">Address Line 2</Label>
                  <Input
                    id="addressLine2"
                    value={formData.addressLine2}
                    onChange={(e) => updateFormData('addressLine2', e.target.value)}
                    placeholder="Area, landmark (optional)"
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Select value={formData.state} onValueChange={(value) => updateFormData('state', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDIAN_STATES.map((state) => (
                          <SelectItem key={state.code} value={state.name}>
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Select
                      value={formData.city}
                      onValueChange={(value) => updateFormData('city', value)}
                      disabled={!formData.state}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder={formData.state ? "Select city" : "Select state first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCities.length > 0 ? (
                          availableCities.map((city) => (
                            <SelectItem key={city} value={city}>
                              {city}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="other" disabled>
                            No cities available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {formData.state && availableCities.length === 0 && (
                      <p className="text-xs text-gray-500 mt-1">Or type your city name below</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => updateFormData('country', e.target.value)}
                      className="mt-1"
                      disabled
                    />
                  </div>

                  <div>
                    <Label htmlFor="pincode">Pincode *</Label>
                    <Input
                      id="pincode"
                      value={formData.pincode}
                      onChange={(e) => updateFormData('pincode', e.target.value)}
                      placeholder="Pincode"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Review */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <Alert>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    Please review your information before submitting. You can go back to edit any details.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-sm text-gray-500">Sector</h3>
                    <p className="text-lg">Real Estate</p>
                  </div>
                  <Separator />

                  <div>
                    <h3 className="font-semibold text-sm text-gray-500">Business Type</h3>
                    <p className="text-lg capitalize">{formData.businessType.replace('_', ' ')}</p>
                  </div>
                  <Separator />

                  <div>
                    <h3 className="font-semibold text-sm text-gray-500">Company Details</h3>
                    <p className="text-lg">{formData.companyName}</p>
                    {formData.gstin && <p className="text-sm text-gray-600">GSTIN: {formData.gstin}</p>}
                    <p className="text-sm text-gray-600">Contact: {formData.contactNumber}</p>
                  </div>
                  <Separator />

                  <div>
                    <h3 className="font-semibold text-sm text-gray-500">Address</h3>
                    <p className="text-sm">{formData.addressLine1}</p>
                    {formData.addressLine2 && <p className="text-sm">{formData.addressLine2}</p>}
                    <p className="text-sm">{formData.city}, {formData.state} - {formData.pincode}</p>
                    <p className="text-sm">{formData.country}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1 || submitting}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <div className="flex gap-2">
                {currentStep < 5 ? (
                  <>
                    <Button
                      variant="ghost"
                      onClick={saveDraft}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save Draft'}
                    </Button>
                    <Button onClick={nextStep} disabled={saving}>
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {submitting ? 'Submitting...' : 'Complete Onboarding'}
                    <Check className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help Text */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Need help? Contact support or save your progress and continue later.
        </p>
      </div>
    </div>
  )
}
