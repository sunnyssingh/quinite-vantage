'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Edit2, Save, X, Loader2, Clock, Phone } from 'lucide-react'
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
                {!isEditing ? (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-full" onClick={handleEdit}>
                        <Edit2 className="w-4 h-4" />
                    </Button>
                ) : (
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-50 rounded-full" onClick={() => setIsEditing(false)}>
                            <X className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-purple-600 hover:bg-purple-50 rounded-full" onClick={handleSave} disabled={saving}>
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        </Button>
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
                        {isEditing ? (
                            <Input
                                value={formData.best_contact_time}
                                onChange={(e) => setFormData({ ...formData, best_contact_time: e.target.value })}
                                placeholder="e.g. Weekdays 9am-11am"
                                className="h-9 bg-gray-50/50"
                            />
                        ) : (
                            <div className="font-medium text-gray-900 group-hover:text-purple-700 transition-colors">
                                {profile.best_contact_time || 'Not specified'}
                            </div>
                        )}
                    </div>

                    {/* Preferred Method */}
                    <div className="group">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
                            <Phone className="w-3.5 h-3.5" />
                            <span className="text-xs font-semibold uppercase tracking-wide">Preferred Method</span>
                        </div>
                        {isEditing ? (
                            <Select
                                value={formData.preferred_contact_method}
                                onValueChange={(val) => setFormData({ ...formData, preferred_contact_method: val })}
                            >
                                <SelectTrigger className="h-9 bg-gray-50/50">
                                    <SelectValue placeholder="Select method" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="phone">Phone Call</SelectItem>
                                    <SelectItem value="email">Email</SelectItem>
                                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                </SelectContent>
                            </Select>
                        ) : (
                            <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-sm font-medium border border-purple-100 capitalize">
                                {profile.preferred_contact_method || 'Phone'}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
