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
    IndianRupee,
    Upload,
    Image as ImageIcon,
    Store,
    LandPlot,
    CheckCircle2,
    ChevronRight,
    ChevronLeft,
    AlertCircle
} from 'lucide-react'
import { toast } from 'react-hot-toast'

const STEPS = [
    { id: 'basic', title: 'Basic Info', icon: Building2, description: 'Project identity' },
    { id: 'property', title: 'Property', icon: Home, description: 'Type & Specs' },
    { id: 'location', title: 'Location', icon: MapPin, description: 'Address details' },
    { id: 'pricing', title: 'Pricing', icon: IndianRupee, description: 'Budget range' }
]

export default function ProjectForm({ initialData, onSubmit, onCancel, isSubmitting }) {
    const fileRef = useRef(null)
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
                if (stepErrors.length > 0) {
                    toast.error("Please fill all required fields before proceeding.")
                }
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
            toast.error("Only images allowed")
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
            toast.success("Image uploaded successfully!")
        } catch (err) {
            console.error(err)
            toast.error("Image upload failed")
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
            <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 border-b px-4 py-6 md:px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Progress Bar */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-semibold text-slate-600">Step {currentStep + 1} of {STEPS.length}</span>
                            <span className="text-xs font-semibold text-blue-600">{Math.round(((currentStep + 1) / STEPS.length) * 100)}% Complete</span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out rounded-full"
                                style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Step Indicators */}
                    <div className="flex items-center justify-between relative">
                        {/* Connection Line */}
                        <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-200 -z-10" />

                        {STEPS.map((step, idx) => {
                            const Icon = step.icon
                            const isActive = idx === currentStep
                            const isCompleted = idx < currentStep

                            return (
                                <div key={step.id} className="flex flex-col items-center gap-2 bg-gradient-to-br from-slate-50 to-blue-50/30 px-1 md:px-3">
                                    <div className={`
                                        w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300
                                        ${isActive ? 'border-blue-600 bg-blue-500 text-white scale-110 shadow-lg shadow-blue-200' :
                                            isCompleted ? 'border-green-500 bg-green-500 text-white shadow-md' :
                                                'border-slate-300 bg-white text-slate-400'}
                                    `}>
                                        {isCompleted ? <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" /> : <Icon className="w-4 h-4 md:w-5 md:h-5" />}
                                    </div>
                                    <div className="text-center">
                                        <p className={`text-xs md:text-sm font-semibold ${isActive ? 'text-blue-700' : isCompleted ? 'text-green-700' : 'text-slate-500'}`}>
                                            {step.title}
                                        </p>
                                        <p className="text-[10px] text-slate-400 hidden md:block">{step.description}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 py-4 md:py-8 max-w-5xl mx-auto w-full pb-20 px-3 md:px-6">
                {currentStep === 0 && (
                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                        <div className="grid gap-6">
                            <div>
                                <label className="text-sm font-semibold text-slate-800 mb-2 block flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-blue-600" />
                                    Project Name *
                                </label>
                                <Input
                                    value={formData.name}
                                    onChange={e => handleChange('name', e.target.value)}
                                    placeholder="e.g. Sunrise Heights, Green Valley Residency"
                                    className={`transition-all ${errors.name ? "border-red-300 focus-visible:ring-red-200" : formData.name ? "border-green-400 focus-visible:ring-green-200" : ""}`}
                                />
                                {errors.name && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.name}</p>}
                                {!errors.name && formData.name && <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Looks good!</p>}
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-800 mb-2 block flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-blue-600" />
                                    Full Address *
                                </label>
                                <Input
                                    value={formData.address}
                                    onChange={e => handleChange('address', e.target.value)}
                                    placeholder="e.g. Plot No. 123, Main Street, Near Central Park, Sector 5"
                                    className={`transition-all ${errors.address ? "border-red-300 focus-visible:ring-red-200" : formData.address ? "border-green-400 focus-visible:ring-green-200" : ""}`}
                                />
                                {errors.address && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.address}</p>}
                                {!errors.address && formData.address && <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Address saved!</p>}
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-800 mb-2 block flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4 text-blue-600" />
                                    Description *
                                </label>
                                <Textarea
                                    value={formData.description}
                                    onChange={e => handleChange('description', e.target.value)}
                                    placeholder="Describe your project in detail... Include amenities like swimming pool, gym, children's play area, 24/7 security, proximity to schools, hospitals, shopping centers, etc."
                                    rows={5}
                                    className={`transition-all ${errors.description ? "border-red-300 focus-visible:ring-red-200" : formData.description.length >= 50 ? "border-green-400 focus-visible:ring-green-200" : ""}`}
                                />
                                <div className="flex justify-between items-center mt-2">
                                    {errors.description ? (
                                        <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.description}</p>
                                    ) : formData.description.length >= 50 ? (
                                        <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Great description!</p>
                                    ) : (
                                        <span className="hidden"></span>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <div className={`h-1.5 w-24 bg-slate-200 rounded-full overflow-hidden`}>
                                            <div
                                                className={`h-full transition-all duration-300 ${formData.description.length >= 50 ? 'bg-green-500' :
                                                    formData.description.length >= 25 ? 'bg-yellow-500' : 'bg-red-400'
                                                    }`}
                                                style={{ width: `${Math.min((formData.description.length / 50) * 100, 100)}%` }}
                                            />
                                        </div>
                                        <p className={`text-xs font-semibold ${formData.description.length >= 50 ? 'text-green-600' :
                                            formData.description.length >= 25 ? 'text-amber-600' : 'text-red-500'
                                            }`}>
                                            {formData.description.length}/50
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-800 mb-2 block flex items-center gap-2">
                                    <Upload className="w-4 h-4 text-blue-600" />
                                    Project Banner Image *
                                </label>
                                <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all hover:border-blue-400 hover:bg-blue-50/30 ${errors.imageUrl ? 'border-red-300 bg-red-50/30' :
                                    formData.imageUrl ? 'border-green-400 bg-green-50/20' : 'border-slate-300'
                                    }`}>
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
                                                className="w-full h-56 object-cover rounded-lg shadow-md"
                                            />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                                <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()} className="shadow-lg">
                                                    <Upload className="w-4 h-4 mr-2" />
                                                    Change Image
                                                </Button>
                                            </div>
                                            <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
                                                <CheckCircle2 className="w-3 h-3" />
                                                Uploaded
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 cursor-pointer" onClick={() => fileRef.current?.click()}>
                                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto text-white shadow-lg">
                                                {uploading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Upload className="w-8 h-8" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">Click to upload or drag and drop</p>
                                                <p className="text-xs text-slate-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {errors.imageUrl && <p className="text-xs text-red-500 mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.imageUrl}</p>}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t mt-6 sm:flex sm:justify-end">
                            <Button variant="outline" onClick={onCancel} disabled={isSubmitting} className="w-full sm:w-auto sm:min-w-[100px]">
                                Cancel
                            </Button>
                            <Button
                                onClick={handleNext}
                                className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto sm:min-w-[120px]"
                            >
                                Next Step
                                <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                )}

                {currentStep === 1 && (
                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-sm font-semibold text-slate-800 mb-2 block">Transaction Type</label>
                                <select
                                    className="w-full rounded-lg border-2 border-slate-300 px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    value={formData.transaction}
                                    onChange={e => handleChange('transaction', e.target.value)}
                                >
                                    <option value="sell">🏠 Sell</option>
                                    <option value="rent">🔑 Rent</option>
                                    <option value="lease">📋 Lease</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-slate-800 mb-2 block">Category</label>
                                <select
                                    className="w-full rounded-lg border-2 border-slate-300 px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    value={formData.propertyCategory}
                                    onChange={e => handleChange('propertyCategory', e.target.value)}
                                >
                                    <option value="residential">🏘️ Residential</option>
                                    <option value="commercial">🏢 Commercial</option>
                                    <option value="land">🌳 Land/Plot</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-slate-800 mb-3 block">Property Type</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {['apartment', 'villa_bungalow', 'row_house', 'penthouse'].map(type => {
                                    const icons = {
                                        apartment: '🏢',
                                        villa_bungalow: '🏡',
                                        row_house: '🏘️',
                                        penthouse: '🌆'
                                    }
                                    return (
                                        <button
                                            key={type}
                                            onClick={() => handleChange('propertyUseCase', type)}
                                            className={`p-4 rounded-xl border-2 text-center transition-all transform hover:scale-105 ${formData.propertyUseCase === type
                                                ? 'border-blue-600 bg-blue-50 shadow-lg shadow-blue-200 scale-105'
                                                : 'border-slate-200 hover:border-blue-300 bg-white'
                                                }`}
                                        >
                                            <div className="text-3xl mb-2">{icons[type]}</div>
                                            <p className={`text-xs font-semibold ${formData.propertyUseCase === type ? 'text-blue-700' : 'text-slate-600'
                                                }`}>
                                                {type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                            </p>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {formData.propertyCategory === 'residential' && (
                            <div className="bg-gradient-to-br from-slate-50 to-blue-50/20 p-6 rounded-xl border-2 border-slate-200 space-y-5">
                                <div className="flex items-center justify-between border-b border-slate-300 pb-3">
                                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                        <Home className="w-5 h-5 text-blue-600" />
                                        Configuration & Area
                                    </h4>
                                    <span className="text-xs text-slate-500 bg-white px-3 py-1 rounded-full border">Residential</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="text-sm font-semibold text-slate-800 mb-2 block">BHK Configuration</label>
                                        <select
                                            value={formData.bhk}
                                            onChange={e => handleChange('bhk', e.target.value)}
                                            className="w-full rounded-lg border-2 border-slate-300 px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        >
                                            {['1rk', '1bhk', '2bhk', '3bhk', '4bhk', '5bhk'].map(opt => (
                                                <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-slate-800 mb-2 block flex items-center gap-2">
                                            Carpet Area (sqft) *
                                        </label>
                                        <Input
                                            type="number"
                                            value={formData.carpetArea}
                                            onChange={e => handleChange('carpetArea', e.target.value)}
                                            placeholder="e.g. 1200"
                                            className={`transition-all ${errors.carpetArea ? "border-red-300" : formData.carpetArea ? "border-green-400" : ""}`}
                                        />
                                        {errors.carpetArea && <p className="text-xs text-red-500 mt-1.5">{errors.carpetArea}</p>}
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-slate-800 mb-2 block">Built-up Area (sqft)</label>
                                        <Input
                                            type="number"
                                            value={formData.builtUpArea}
                                            onChange={e => handleChange('builtUpArea', e.target.value)}
                                            placeholder="e.g. 1450"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-slate-800 mb-2 block">Super Built-up (sqft)</label>
                                        <Input
                                            type="number"
                                            value={formData.superBuiltUpArea}
                                            onChange={e => handleChange('superBuiltUpArea', e.target.value)}
                                            placeholder="e.g. 1600"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex justify-between gap-3 pt-4 border-t mt-6">
                            <Button
                                variant="ghost"
                                onClick={handleBack}
                                disabled={isSubmitting}
                                className="text-slate-500 hover:text-slate-800"
                            >
                                <ChevronLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>
                            <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-3 w-full sm:w-auto ml-4">
                                <Button variant="outline" onClick={onCancel} disabled={isSubmitting} className="w-full sm:w-auto sm:min-w-[100px]">
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleNext}
                                    className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto sm:min-w-[120px]"
                                >
                                    Next Step
                                    <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                        <div className="grid gap-6">
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

                        {/* Action Buttons */}
                        <div className="flex justify-between gap-3 pt-4 border-t mt-6">
                            <Button
                                variant="ghost"
                                onClick={handleBack}
                                disabled={isSubmitting}
                                className="text-slate-500 hover:text-slate-800"
                            >
                                <ChevronLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>
                            <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-3 w-full sm:w-auto ml-4">
                                <Button variant="outline" onClick={onCancel} disabled={isSubmitting} className="w-full sm:w-auto sm:min-w-[100px]">
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleNext}
                                    className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto sm:min-w-[120px]"
                                >
                                    Next Step
                                    <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 3 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="text-center py-8">
                            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
                                <IndianRupee className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Final Step: Set Your Budget</h3>
                            <p className="text-slate-600 mt-2">Define the price range for your project</p>
                            <div className="inline-flex items-center gap-2 mt-3 bg-blue-50 px-4 py-2 rounded-full border border-blue-200">
                                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                                <span className="text-xs font-semibold text-blue-700">Almost done!</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                            <div>
                                <label className="text-sm font-semibold text-slate-800 mb-2 block flex items-center gap-2">
                                    <IndianRupee className="w-4 h-4 text-green-600" />
                                    Minimum Price *
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">₹</span>
                                    <Input
                                        type="number"
                                        value={formData.priceMin}
                                        onChange={e => handleChange('priceMin', e.target.value)}
                                        placeholder="5000000"
                                        className={`pl-8 text-lg font-semibold transition-all ${errors.priceMin ? "border-red-300" : formData.priceMin ? "border-green-400" : ""
                                            }`}
                                    />
                                </div>
                                {errors.priceMin && <p className="text-xs text-red-500 mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.priceMin}</p>}
                                {!errors.priceMin && formData.priceMin && (
                                    <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" />
                                        ₹{Number(formData.priceMin).toLocaleString('en-IN')}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-slate-800 mb-2 block flex items-center gap-2">
                                    <IndianRupee className="w-4 h-4 text-green-600" />
                                    Maximum Price *
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">₹</span>
                                    <Input
                                        type="number"
                                        value={formData.priceMax}
                                        onChange={e => handleChange('priceMax', e.target.value)}
                                        placeholder="7500000"
                                        className={`pl-8 text-lg font-semibold transition-all ${errors.priceMax ? "border-red-300" : formData.priceMax ? "border-green-400" : ""
                                            }`}
                                    />
                                </div>
                                {errors.priceMax && <p className="text-xs text-red-500 mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.priceMax}</p>}
                                {!errors.priceMax && formData.priceMax && (
                                    <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" />
                                        ₹{Number(formData.priceMax).toLocaleString('en-IN')}
                                    </p>
                                )}
                            </div>
                        </div>

                        {formData.priceMin && formData.priceMax && Number(formData.priceMin) < Number(formData.priceMax) && (
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5 mt-6 max-w-2xl mx-auto">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                                        <CheckCircle2 className="w-5 h-5 text-white" />
                                    </div>
                                    <h4 className="text-sm font-bold text-green-900">Price Range Confirmed</h4>
                                </div>
                                <div className="text-center py-3 bg-white rounded-lg border border-green-200">
                                    <p className="text-2xl font-bold text-green-700">
                                        ₹{Number(formData.priceMin).toLocaleString('en-IN')} - ₹{Number(formData.priceMax).toLocaleString('en-IN')}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-5 mt-8 max-w-2xl mx-auto">
                            <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2 mb-3">
                                <AlertCircle className="w-4 h-4" />
                                Review Before Saving
                            </h4>
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between py-2 border-b border-amber-200">
                                    <span className="text-amber-700">Project Name:</span>
                                    <span className="font-semibold text-amber-900">{formData.name || 'Not set'}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-amber-200">
                                    <span className="text-amber-700">Location:</span>
                                    <span className="font-semibold text-amber-900">{formData.locLocality}, {formData.locCity}</span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-amber-700">Configuration:</span>
                                    <span className="font-semibold text-amber-900">{formData.bhk.toUpperCase()}, {formData.propertyUseCase.replace('_', ' ')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-between items-center pt-4 border-t mt-6">
                            <Button
                                variant="ghost"
                                onClick={handleBack}
                                disabled={isSubmitting}
                                className="text-slate-500 hover:text-slate-800 px-0 sm:px-4"
                            >
                                <ChevronLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>
                            <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-3 w-full sm:w-auto ml-4">
                                <Button variant="outline" onClick={onCancel} disabled={isSubmitting} className="w-full sm:w-auto sm:min-w-[100px]">
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className={`w-full sm:w-auto sm:min-w-[140px] ${initialData ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                            {initialData ? 'Update Project' : 'Create Project'}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
