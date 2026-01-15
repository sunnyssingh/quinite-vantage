import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Loader2,
    Building2,
    Home,
    MapPin,
    DollarSign,
    Upload,
    Image as ImageIcon,
    Store,
    LandPlot,
    CheckCircle2,
    ChevronRight,
    ChevronLeft,
    AlertCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const STEPS = [
    { id: 'basic', title: 'Basic Info', icon: Building2, description: 'Project identity' },
    { id: 'property', title: 'Property', icon: Home, description: 'Type & Specs' },
    { id: 'location', title: 'Location', icon: MapPin, description: 'Address details' },
    { id: 'pricing', title: 'Pricing', icon: DollarSign, description: 'Budget range' }
]

export default function ProjectForm({ initialData, onSubmit, onCancel, isSubmitting }) {
    const fileRef = useRef(null)
    const { toast } = useToast()
    const [uploading, setUploading] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)
    const [touched, setTouched] = useState({})
    const [errors, setErrors] = useState({})

    // Initialize state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        address: '',
        imageUrl: '',
        imagePath: null,
        transaction: 'sell',
        propertyCategory: 'residential',
        propertyUseCase: 'apartment',
        bhk: '2bhk',
        carpetArea: '',
        builtUpArea: '',
        superBuiltUpArea: '',
        commercialArea: '',
        commercialBuiltUpArea: '',
        groundFloor: false,
        plotArea: '',
        locCity: '',
        locLocality: '',
        locLandmark: '',
        priceMin: '',
        priceMax: ''
    })

    // Load initial data
    useEffect(() => {
        if (initialData) {
            const re = initialData.metadata?.real_estate || initialData.real_estate || {}
            const prop = re.property || {}
            const loc = re.location || {}
            const pricing = re.pricing || {}

            setFormData({
                name: initialData.name || '',
                description: initialData.description || '',
                address: initialData.address || '',
                imageUrl: initialData.image_url || '',
                imagePath: initialData.image_path || null,
                transaction: re.transaction || 'sell',
                propertyCategory: prop.category || 'residential',
                propertyUseCase: prop.use_case || 'apartment',
                bhk: prop.residential?.bhk || '2bhk',
                carpetArea: prop.residential?.carpet_area || '',
                builtUpArea: prop.residential?.built_up_area || '',
                superBuiltUpArea: prop.residential?.super_built_up_area || '',
                commercialArea: prop.commercial?.area || '',
                commercialBuiltUpArea: prop.commercial?.built_up_area || '',
                groundFloor: prop.commercial?.ground_floor || false,
                plotArea: prop.land?.plot_area || '',
                locCity: loc.city || '',
                locLocality: loc.locality || '',
                locLandmark: loc.landmark || '',
                priceMin: pricing.min || '',
                priceMax: pricing.max || ''
            })
        }
    }, [initialData])

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        // Clear error when field is modified
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }))
        }
    }

    const validateStep = (stepIndex) => {
        const newErrors = {}
        const data = formData

        if (stepIndex === 0) { // Basic
            if (!data.name.trim()) newErrors.name = 'Project name is required'
            if (!data.address.trim()) newErrors.address = 'Detailed address is required'
            if (!data.description.trim()) newErrors.description = 'Description is required'
            else if (data.description.length < 50) newErrors.description = 'Description must be at least 50 characters'
            if (!data.imageUrl) newErrors.imageUrl = 'Project image is mandatory'
        }

        if (stepIndex === 1) { // Property
            if (data.propertyCategory === 'residential') {
                if (!data.carpetArea) newErrors.carpetArea = 'Carpet area is required'
            }
            if (data.propertyCategory === 'commercial') {
                if (!data.commercialArea) newErrors.commercialArea = 'Area is required'
            }
            if (data.propertyCategory === 'land') {
                if (!data.plotArea) newErrors.plotArea = 'Plot area is required'
            }
        }

        if (stepIndex === 2) { // Location
            if (!data.locCity.trim()) newErrors.locCity = 'City is required'
            if (!data.locLocality.trim()) newErrors.locLocality = 'Locality is required'
        }

        if (stepIndex === 3) { // Pricing
            if (!data.priceMin) newErrors.priceMin = 'Minimum price is required'
            if (!data.priceMax) newErrors.priceMax = 'Maximum price is required'
            if (Number(data.priceMin) > Number(data.priceMax)) {
                newErrors.priceMin = 'Min price cannot be greater than max'
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1))
        } else {
            const stepErrors = Object.keys(errors)
            if (stepErrors.length > 0) {
                toast({
                    variant: "destructive",
                    title: "Incomplete Details",
                    description: "Please fill all required fields before proceeding."
                })
            }
        }
    }

    const handleBack = () => {
        setCurrentStep(prev => Math.max(prev - 1, 0))
    }

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            toast({ variant: "destructive", title: "Error", description: "Only images allowed" })
            return
        }

        setUploading(true)
        setErrors(prev => ({ ...prev, imageUrl: null }))

        try {
            const res = await fetch('/api/projects/upload-url', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileName: file.name,
                    contentType: file.type
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            await fetch(data.uploadUrl, {
                method: 'PUT',
                headers: { 'Content-Type': file.type },
                body: file
            })

            handleChange('imageUrl', data.image_url)
            handleChange('imagePath', data.image_path)
            toast({ title: "Success", description: "Image uploaded successfully!" })
        } catch (err) {
            console.error(err)
            toast({ variant: "destructive", title: "Error", description: "Image upload failed" })
        } finally {
            setUploading(false)
        }
    }

    const handleSubmit = () => {
        if (validateStep(currentStep)) {
            onSubmit(formData)
        }
    }

    return (
        <div className="flex flex-col h-full min-h-[500px]">
            {/* Stepper Header */}
            <div className="bg-slate-50/50 border-b px-2 py-4 md:px-6 md:py-6">
                <div className="flex items-center justify-between max-w-2xl mx-auto relative">
                    {/* Connection Line */}
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -z-10" />

                    {STEPS.map((step, idx) => {
                        const Icon = step.icon
                        const isActive = idx === currentStep
                        const isCompleted = idx < currentStep

                        return (
                            <div key={step.id} className="flex flex-col items-center gap-2 bg-white px-2">
                                <div className={`
                                    w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                                    ${isActive ? 'border-blue-600 bg-blue-50 text-blue-600 scale-110 shadow-md' :
                                        isCompleted ? 'border-green-500 bg-green-50 text-green-600' :
                                            'border-slate-200 text-slate-400'}
                                `}>
                                    {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
                                </div>
                                <div className="text-center hidden md:block">
                                    <p className={`text-xs font-semibold ${isActive ? 'text-blue-700' : 'text-slate-500'}`}>
                                        {step.title}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 py-6 md:py-8 max-w-5xl mx-auto w-full pb-24 px-6">
                {currentStep === 0 && (
                    <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                        <div className="bg-blue-50/50 p-4 rounded-lg flex gap-3 border border-blue-100">
                            <Building2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-sm font-semibold text-blue-900">Project Essentials</h3>
                                <p className="text-xs text-blue-700 mt-1">
                                    Provide a catchy name and detailed description to attract potential leads.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-5">
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Project Name *</label>
                                <Input
                                    value={formData.name}
                                    onChange={e => handleChange('name', e.target.value)}
                                    placeholder="e.g. Sunrise Heights"
                                    className={errors.name ? "border-red-300 focus-visible:ring-red-200" : ""}
                                />
                                {errors.name && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.name}</p>}
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Full Address *</label>
                                <Input
                                    value={formData.address}
                                    onChange={e => handleChange('address', e.target.value)}
                                    placeholder="e.g. 123, Main Street, Near Central Park"
                                    className={errors.address ? "border-red-300 focus-visible:ring-red-200" : ""}
                                />
                                {errors.address && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.address}</p>}
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Description *</label>
                                <Textarea
                                    value={formData.description}
                                    onChange={e => handleChange('description', e.target.value)}
                                    placeholder="Describe the project amenities, connectivity, and features..."
                                    rows={4}
                                    className={errors.description ? "border-red-300 focus-visible:ring-red-200" : ""}
                                />
                                <div className="flex justify-between mt-1">
                                    {errors.description ? (
                                        <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.description}</p>
                                    ) : (
                                        <span />
                                    )}
                                    <p className={`text-xs ${formData.description.length < 50 ? 'text-amber-600' : 'text-green-600'}`}>
                                        {formData.description.length}/50 min chars
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Project Banner *</label>
                                <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${errors.imageUrl ? 'border-red-300 bg-red-50/30' : 'border-slate-200 hover:border-blue-400'}`}>
                                    <input
                                        type="file"
                                        ref={fileRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                    />
                                    {formData.imageUrl ? (
                                        <div className="relative group">
                                            <img
                                                src={formData.imageUrl}
                                                alt="Preview"
                                                className="w-full h-48 object-cover rounded-md shadow-sm"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
                                                <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
                                                    Change Image
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 cursor-pointer" onClick={() => fileRef.current?.click()}>
                                            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-600">
                                                {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">Click to upload image</p>
                                                <p className="text-xs text-slate-500">SVG, PNG, JPG or GIF</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {errors.imageUrl && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.imageUrl}</p>}
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 1 && (
                    <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Transaction Type</label>
                                <select
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    value={formData.transaction}
                                    onChange={e => handleChange('transaction', e.target.value)}
                                >
                                    <option value="sell">Sell</option>
                                    <option value="rent">Rent</option>
                                    <option value="lease">Lease</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Category</label>
                                <select
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    value={formData.propertyCategory}
                                    onChange={e => handleChange('propertyCategory', e.target.value)}
                                >
                                    <option value="residential">Residential</option>
                                    <option value="commercial">Commercial</option>
                                    <option value="land">Land</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Property Type</label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {['apartment', 'villa_bungalow', 'row_house', 'penthouse'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => handleChange('propertyUseCase', type)}
                                        className={`p-3 text-sm rounded-lg border text-left transition-all ${formData.propertyUseCase === type
                                            ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600'
                                            : 'border-slate-200 hover:border-blue-300 text-slate-600'
                                            }`}
                                    >
                                        {type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {formData.propertyCategory === 'residential' && (
                            <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 space-y-4">
                                <h4 className="font-semibold text-slate-900 border-b pb-2">Configuration & Area</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 mb-1.5 block">BHK</label>
                                        <select
                                            value={formData.bhk}
                                            onChange={e => handleChange('bhk', e.target.value)}
                                            className="w-full rounded-md border border-slate-300 px-3 py-2 bg-white"
                                        >
                                            {['1rk', '1bhk', '2bhk', '3bhk', '4bhk', '5bhk'].map(opt => (
                                                <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 mb-1.5 block">Carpet Area (sqft)</label>
                                        <Input
                                            type="number"
                                            value={formData.carpetArea}
                                            onChange={e => handleChange('carpetArea', e.target.value)}
                                            className={errors.carpetArea ? "border-red-300" : ""}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 mb-1.5 block">Built-up Area</label>
                                        <Input
                                            type="number"
                                            value={formData.builtUpArea}
                                            onChange={e => handleChange('builtUpArea', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 mb-1.5 block">Super Built-up</label>
                                        <Input
                                            type="number"
                                            value={formData.superBuiltUpArea}
                                            onChange={e => handleChange('superBuiltUpArea', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                        <div className="bg-indigo-50/50 p-4 rounded-lg flex gap-3 border border-indigo-100">
                            <MapPin className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-sm font-semibold text-indigo-900">Pinpoint Location</h3>
                                <p className="text-xs text-indigo-700 mt-1">
                                    Accurate location details help leads find your project easily.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1.5 block">City *</label>
                                <Input
                                    value={formData.locCity}
                                    onChange={e => handleChange('locCity', e.target.value)}
                                    placeholder="e.g. Mumbai"
                                    className={errors.locCity ? "border-red-300" : ""}
                                />
                                {errors.locCity && <p className="text-xs text-red-500 mt-1">{errors.locCity}</p>}
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Locality *</label>
                                <Input
                                    value={formData.locLocality}
                                    onChange={e => handleChange('locLocality', e.target.value)}
                                    placeholder="e.g. Bandra West"
                                    className={errors.locLocality ? "border-red-300" : ""}
                                />
                                {errors.locLocality && <p className="text-xs text-red-500 mt-1">{errors.locLocality}</p>}
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Landmark</label>
                                <Input
                                    value={formData.locLandmark}
                                    onChange={e => handleChange('locLandmark', e.target.value)}
                                    placeholder="e.g. Near St. Peter's Church"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 3 && (
                    <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                        <div className="text-center py-6">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <DollarSign className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Final Step: Pricing</h3>
                            <p className="text-slate-500">Set the budget range for your project</p>
                        </div>

                        <div className="grid grid-cols-2 gap-6 max-w-lg mx-auto">
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Min Price (₹) *</label>
                                <Input
                                    type="number"
                                    value={formData.priceMin}
                                    onChange={e => handleChange('priceMin', e.target.value)}
                                    className={errors.priceMin ? "border-red-300 text-lg" : "text-lg"}
                                />
                                {errors.priceMin && <p className="text-xs text-red-500 mt-1">{errors.priceMin}</p>}
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Max Price (₹) *</label>
                                <Input
                                    type="number"
                                    value={formData.priceMax}
                                    onChange={e => handleChange('priceMax', e.target.value)}
                                    className={errors.priceMax ? "border-red-300 text-lg" : "text-lg"}
                                />
                                {errors.priceMax && <p className="text-xs text-red-500 mt-1">{errors.priceMax}</p>}
                            </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-8">
                            <h4 className="text-sm font-bold text-amber-800 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" />
                                Review before saving
                            </h4>
                            <ul className="mt-2 space-y-1 text-xs text-amber-800">
                                <li>• Project Name: <span className="font-medium">{formData.name || 'Not set'}</span></li>
                                <li>• Location: <span className="font-medium">{formData.locLocality}, {formData.locCity}</span></li>
                                <li>• Configuration: <span className="font-medium">{formData.bhk.toUpperCase()}, {formData.propertyUseCase}</span></li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Navigation */}
            <div className="bg-white border-t px-3 py-3 md:px-4 md:py-4 flex justify-between items-center z-10 sticky bottom-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <Button
                    variant="ghost"
                    onClick={handleBack}
                    disabled={currentStep === 0 || isSubmitting}
                    className={`text-slate-500 hover:text-slate-800 px-2 md:px-4 ${currentStep === 0 ? 'invisible' : ''}`}
                >
                    <ChevronLeft className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">Back</span>
                </Button>

                <div className="flex gap-2 md:gap-4">
                    <Button variant="outline" onClick={onCancel} disabled={isSubmitting} className="px-3 md:px-4 md:min-w-[100px]">
                        Cancel
                    </Button>
                    {currentStep === STEPS.length - 1 ? (
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 md:px-4 md:min-w-[140px]"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    <span className="hidden sm:inline">Creating...</span>
                                    <span className="sm:hidden">Wait...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    <span className="hidden sm:inline">Create Project</span>
                                    <span className="sm:hidden">Create</span>
                                </>
                            )}
                        </Button>
                    ) : (
                        <Button
                            onClick={handleNext}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 md:px-4 md:min-w-[120px]"
                        >
                            <span className="hidden sm:inline">Next Step</span>
                            <span className="sm:hidden">Next</span>
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
