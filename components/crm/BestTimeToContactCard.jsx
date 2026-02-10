import { useState, useCallback, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Clock, Phone, Check } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function BestTimeToContactCard({ profile, leadId, onUpdate }) {
    const [formData, setFormData] = useState({
        best_contact_time: profile?.best_contact_time || '',
        preferred_contact_method: profile?.preferred_contact_method || ''
    })
    const [saveStatus, setSaveStatus] = useState('idle') // 'idle' | 'saving' | 'saved'
    const saveTimeoutRef = useRef(null)
    const lastSavedRef = useRef(formData)

    useEffect(() => {
        if (profile) {
            const newData = {
                best_contact_time: profile.best_contact_time || '',
                preferred_contact_method: profile.preferred_contact_method || ''
            }
            setFormData(newData)
            lastSavedRef.current = newData
        }
    }, [profile])

    // Debounced auto-save function
    const autoSave = useCallback(async (data) => {
        try {
            setSaveStatus('saving')

            const res = await fetch(`/api/leads/${leadId}/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            if (!res.ok) throw new Error('Failed to update contact preferences')

            lastSavedRef.current = data
            setSaveStatus('saved')

            // Show saved indicator briefly
            setTimeout(() => setSaveStatus('idle'), 2000)

            if (onUpdate) {
                onUpdate()
            }
        } catch (error) {
            console.error(error)
            toast.error('Failed to save changes')
            setSaveStatus('idle')
            setFormData(lastSavedRef.current)
        }
    }, [leadId, onUpdate])

    // Debounced save trigger
    const triggerAutoSave = useCallback((newData) => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current)
        }

        saveTimeoutRef.current = setTimeout(() => {
            autoSave(newData)
        }, 500)
    }, [autoSave])

    // Handle field changes
    const handleFieldChange = useCallback((field, value) => {
        setFormData(prev => {
            const newData = { ...prev, [field]: value }
            triggerAutoSave(newData)
            return newData
        })
    }, [triggerAutoSave])

    return (
        <Card className="h-full border-0 shadow-sm ring-1 ring-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-100 mb-4 bg-gradient-to-r from-purple-50/50 to-transparent">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-100 text-purple-700 rounded-lg shadow-sm">
                        <Clock className="w-4 h-4 fill-purple-700/20" />
                    </div>
                    <div>
                        <CardTitle className="text-sm font-bold text-gray-900">Best Time to Contact</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">Availability & method</p>
                    </div>
                </div>
                {/* Save Status Indicator */}
                {saveStatus !== 'idle' && (
                    <div className="flex items-center gap-1.5 text-xs">
                        {saveStatus === 'saving' && (
                            <>
                                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
                                <span className="text-purple-600 font-medium">Saving...</span>
                            </>
                        )}
                        {saveStatus === 'saved' && (
                            <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-600 font-medium">Saved</span>
                            </>
                        )}
                    </div>
                )}
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
                <div className="flex flex-col gap-6">
                    {/* Preferred Time */}
                    <div className="group">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="text-xs font-semibold uppercase tracking-wide">Preferred Time</span>
                        </div>
                        <Input
                            value={formData.best_contact_time}
                            onChange={(e) => handleFieldChange('best_contact_time', e.target.value)}
                            placeholder="e.g. Weekdays 9am-11am"
                            className="h-9 bg-gray-50/50 hover:bg-gray-100/50 focus:bg-white transition-colors"
                        />
                    </div>

                    {/* Preferred Method */}
                    <div className="group">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
                            <Phone className="w-3.5 h-3.5" />
                            <span className="text-xs font-semibold uppercase tracking-wide">Preferred Method</span>
                        </div>
                        <Select
                            value={formData.preferred_contact_method}
                            onValueChange={(val) => handleFieldChange('preferred_contact_method', val)}
                        >
                            <SelectTrigger className="h-9 bg-gray-50/50 hover:bg-gray-100/50 focus:bg-white transition-colors">
                                <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="phone">Phone Call</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
