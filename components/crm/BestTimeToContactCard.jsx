'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Edit2, Save, X, Loader2, Clock } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function BestTimeToContactCard({ profile, leadId, onUpdate }) {
    const [isEditing, setIsEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        best_contact_time: '',
        preferred_contact_method: ''
    })

    const handleEdit = () => {
        setFormData({
            best_contact_time: profile.best_contact_time || '',
            preferred_contact_method: profile.preferred_contact_method || 'phone'
        })
        setIsEditing(true)
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            const res = await fetch(`/api/leads/${leadId}/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (!res.ok) throw new Error('Failed to update contact preferences')

            toast.success('Contact preferences updated')
            setIsEditing(false)
            if (onUpdate) onUpdate()
        } catch (error) {
            console.error(error)
            toast.error('Failed to save changes')
        } finally {
            setSaving(false)
        }
    }



    return (
        <Card className="h-full border-0 shadow-sm ring-1 ring-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-50 text-purple-600 rounded-md">
                        <Clock className="w-4 h-4 text-purple-600" />
                    </div>
                    <CardTitle className="text-sm font-semibold text-gray-900">Best Time to Contact</CardTitle>
                </div>
                {!isEditing ? (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-primary" onClick={handleEdit}>
                        <Edit2 className="w-4 h-4" />
                    </Button>
                ) : (
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:bg-rose-50" onClick={() => setIsEditing(false)}>
                            <X className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50" onClick={handleSave} disabled={saving}>
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        </Button>
                    </div>
                )}
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                    {/* Preferred Time */}
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">Preferred Time</p>
                        {isEditing ? (
                            <Input
                                value={formData.best_contact_time}
                                onChange={(e) => setFormData({ ...formData, best_contact_time: e.target.value })}
                                placeholder="e.g. Weekdays 9am-11am"
                                className="h-8"
                            />
                        ) : (
                            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                {profile.best_contact_time || 'Not specified'}
                            </p>
                        )}
                    </div>

                    {/* Preferred Method */}
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">Preferred Method</p>
                        {isEditing ? (
                            <Select
                                value={formData.preferred_contact_method}
                                onValueChange={(val) => setFormData({ ...formData, preferred_contact_method: val })}
                            >
                                <SelectTrigger className="h-8">
                                    <SelectValue placeholder="Select method" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="phone">Phone Call</SelectItem>
                                    <SelectItem value="email">Email</SelectItem>
                                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                </SelectContent>
                            </Select>
                        ) : (
                            <div className="flex items-center gap-2">
                                {/* Optional: Keep small icon but make it subtle, or just text */}
                                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 capitalize">
                                    {profile.preferred_contact_method || 'Phone'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
