import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Loader2,
    Building2,
    Home,
    MapPin,
    DollarSign,
    Upload,
    Image as ImageIcon,
    Store,
    LandPlot
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function ProjectForm({ initialData, onSubmit, onCancel, isSubmitting }) {
    const fileRef = useRef(null)
    const { toast } = useToast()
    const [uploading, setUploading] = useState(false)

    // Initialize state with initialData or defaults
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

    // Load initial data if provided (for edit mode)
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
    }

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            toast({ variant: "destructive", title: "Error", description: "Only images allowed" })
            return
        }

        setUploading(true)

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
        // Basic validation
        if (!formData.name || !formData.locCity || !formData.locLocality || !formData.priceMin || !formData.priceMax) {
            toast({ variant: "destructive", title: "Validation Error", description: "Please fill in all required fields" })
            return
        }
        onSubmit(formData)
    }

    return (
        <div className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                    <TabsTrigger value="basic" className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Basic Info
                    </TabsTrigger>
                    <TabsTrigger value="property" className="flex items-center gap-2">
                        <Home className="w-4 h-4" />
                        Property
                    </TabsTrigger>
                    <TabsTrigger value="location" className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Location
                    </TabsTrigger>
                    <TabsTrigger value="pricing" className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Pricing
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-blue-600" />
                            Project Name *
                        </label>
                        <Input
                            placeholder="e.g., Sunrise Apartments"
                            value={formData.name}
                            onChange={e => handleChange('name', e.target.value)}
                            className="border-slate-300"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            Address
                        </label>
                        <Input
                            placeholder="e.g., 123 Main Street"
                            value={formData.address}
                            onChange={e => handleChange('address', e.target.value)}
                            className="border-slate-300"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                            Description
                        </label>
                        <Textarea
                            placeholder="Describe your project (minimum 50 characters)..."
                            value={formData.description}
                            onChange={e => handleChange('description', e.target.value)}
                            rows={4}
                            className="border-slate-300"
                        />
                        <p className="text-xs text-slate-500 mt-1">{formData.description.length}/50 characters minimum</p>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-blue-600" />
                            Project Image
                        </label>
                        <input
                            type="file"
                            ref={fileRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                        />
                        <Button
                            variant="outline"
                            onClick={() => fileRef.current?.click()}
                            disabled={uploading}
                            className="w-full border-dashed border-2"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload Image
                                </>
                            )}
                        </Button>
                        {formData.imageUrl && (
                            <div className="mt-3 relative">
                                <img
                                    src={formData.imageUrl}
                                    alt="preview"
                                    className="h-48 w-full object-cover rounded-lg border-2 border-slate-200 shadow-sm"
                                />
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="property" className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Transaction Type</label>
                            <select
                                className="w-full rounded-md border border-slate-300 px-3 py-2 bg-white"
                                value={formData.transaction}
                                onChange={e => handleChange('transaction', e.target.value)}
                            >
                                <option value="sell">Sell</option>
                                <option value="rent">Rent</option>
                                <option value="lease">Lease</option>
                                <option value="pg">PG</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Category</label>
                            <select
                                className="w-full rounded-md border border-slate-300 px-3 py-2 bg-white"
                                value={formData.propertyCategory}
                                onChange={e => handleChange('propertyCategory', e.target.value)}
                            >
                                <option value="residential">Residential</option>
                                <option value="commercial">Commercial</option>
                                <option value="land">Land</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Use Case</label>
                            <select
                                className="w-full rounded-md border border-slate-300 px-3 py-2 bg-white"
                                value={formData.propertyUseCase}
                                onChange={e => handleChange('propertyUseCase', e.target.value)}
                            >
                                <option value="apartment">Apartment</option>
                                <option value="builder_floor">Builder Floor</option>
                                <option value="independent_house">Independent House</option>
                                <option value="villa_bungalow">Villa / Bungalow</option>
                                <option value="row_house">Row House</option>
                                <option value="studio">Studio</option>
                                <option value="penthouse">Penthouse</option>
                                <option value="farm_house">Farm House</option>
                                <option value="service_apartment">Service Apartment</option>
                                <option value="office">Office</option>
                                <option value="retail">Retail</option>
                                <option value="residential_plot">Residential Plot</option>
                            </select>
                        </div>
                    </div>

                    {formData.propertyCategory === 'residential' && (
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                                <Home className="w-4 h-4 text-blue-600" />
                                Residential Details
                            </h4>
                            <div className="grid grid-cols-4 gap-3">
                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">BHK</label>
                                    <select
                                        value={formData.bhk}
                                        onChange={e => handleChange('bhk', e.target.value)}
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 bg-white"
                                    >
                                        <option value="1rk">1RK</option>
                                        <option value="1bhk">1BHK</option>
                                        <option value="2bhk">2BHK</option>
                                        <option value="3bhk">3BHK</option>
                                        <option value="4bhk">4BHK</option>
                                        <option value="5plus">5+</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Carpet Area (sqft)</label>
                                    <Input
                                        type="number"
                                        placeholder="1200"
                                        value={formData.carpetArea}
                                        onChange={e => handleChange('carpetArea', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Built-up Area</label>
                                    <Input
                                        type="number"
                                        placeholder="1400"
                                        value={formData.builtUpArea}
                                        onChange={e => handleChange('builtUpArea', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Super Built-up</label>
                                    <Input
                                        type="number"
                                        placeholder="1600"
                                        value={formData.superBuiltUpArea}
                                        onChange={e => handleChange('superBuiltUpArea', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {formData.propertyCategory === 'commercial' && (
                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                                <Store className="w-4 h-4 text-purple-600" />
                                Commercial Details
                            </h4>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Area (sqft)</label>
                                    <Input
                                        type="number"
                                        placeholder="2000"
                                        value={formData.commercialArea}
                                        onChange={e => handleChange('commercialArea', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Built-up Area</label>
                                    <Input
                                        type="number"
                                        placeholder="2200"
                                        value={formData.commercialBuiltUpArea}
                                        onChange={e => handleChange('commercialBuiltUpArea', e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center pt-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.groundFloor}
                                            onChange={e => handleChange('groundFloor', e.target.checked)}
                                            className="w-4 h-4 text-blue-600 rounded"
                                        />
                                        <span className="text-sm font-medium text-slate-700">Ground Floor</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {formData.propertyCategory === 'land' && (
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                            <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                                <LandPlot className="w-4 h-4 text-green-600" />
                                Land Details
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Plot Area (sqft)</label>
                                    <Input
                                        type="number"
                                        placeholder="5000"
                                        value={formData.plotArea}
                                        onChange={e => handleChange('plotArea', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="location" className="space-y-4">
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                        <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            Location Details
                        </h4>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1.5 block">City *</label>
                                <Input
                                    placeholder="Mumbai"
                                    value={formData.locCity}
                                    onChange={e => handleChange('locCity', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Locality *</label>
                                <Input
                                    placeholder="Andheri West"
                                    value={formData.locLocality}
                                    onChange={e => handleChange('locLocality', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Landmark</label>
                                <Input
                                    placeholder="Near Station"
                                    value={formData.locLandmark}
                                    onChange={e => handleChange('locLandmark', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="pricing" className="space-y-4">
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-yellow-600" />
                            Pricing Details (₹)
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Min Price *</label>
                                <Input
                                    type="number"
                                    placeholder="5000000"
                                    value={formData.priceMin}
                                    onChange={e => handleChange('priceMin', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Max Price *</label>
                                <Input
                                    type="number"
                                    placeholder="7500000"
                                    value={formData.priceMax}
                                    onChange={e => handleChange('priceMax', e.target.value)}
                                />
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            Enter the price range for searching and filtering. This will be displayed to potential leads.
                        </p>
                    </div>
                </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        'Save Project'
                    )}
                </Button>
            </div>
        </div>
    )
}
