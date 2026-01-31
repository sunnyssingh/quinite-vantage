'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Edit2, Save, X } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function LeadProfileOverview({ lead, profile, onUpdate }) {
    const [isEditing, setIsEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        company: profile.company || '',
        job_title: profile.job_title || '',
        location: profile.location || '',
        industry: profile.industry || '',
        lead_score: profile.lead_score || 0,
        engagement_level: profile.engagement_level || 'cold',
        budget_range: profile.budget_range || '',
        timeline: profile.timeline || '',
        preferred_contact_method: profile.preferred_contact_method || '',
        best_contact_time: profile.best_contact_time || ''
    })

    const handleSave = async () => {
        try {
            setSaving(true)
            const res = await fetch(`/api/leads/${lead.id}/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (!res.ok) throw new Error('Failed to update profile')

            toast.success('Profile updated successfully')
            setIsEditing(false)
            onUpdate()
        } catch (error) {
            console.error('Error updating profile:', error)
            toast.error('Failed to update profile')
        } finally {
            setSaving(false)
        }
    }

    const handleCancel = () => {
        setFormData({
            company: profile.company || '',
            job_title: profile.job_title || '',
            location: profile.location || '',
            industry: profile.industry || '',
            lead_score: profile.lead_score || 0,
            engagement_level: profile.engagement_level || 'cold',
            budget_range: profile.budget_range || '',
            timeline: profile.timeline || '',
            preferred_contact_method: profile.preferred_contact_method || '',
            best_contact_time: profile.best_contact_time || ''
        })
        setIsEditing(false)
    }

    return (
        <div className="grid grid-cols-2 gap-6">
            {/* Company & Role Information */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Company & Role</CardTitle>
                        <CardDescription>Professional information</CardDescription>
                    </div>
                    {!isEditing && (
                        <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                            <Edit2 className="w-4 h-4" />
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="space-y-4">
                    {isEditing ? (
                        <>
                            <div className="space-y-2">
                                <Label>Company</Label>
                                <Input
                                    value={formData.company}
                                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                    placeholder="Company name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Job Title</Label>
                                <Input
                                    value={formData.job_title}
                                    onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                                    placeholder="Job title"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Location</Label>
                                <Input
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="City, Country"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Industry</Label>
                                <Input
                                    value={formData.industry}
                                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                    placeholder="Industry"
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <p className="text-sm text-muted-foreground">Company</p>
                                <p className="font-medium">{profile.company || 'Not specified'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Job Title</p>
                                <p className="font-medium">{profile.job_title || 'Not specified'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Location</p>
                                <p className="font-medium">{profile.location || 'Not specified'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Industry</p>
                                <p className="font-medium">{profile.industry || 'Not specified'}</p>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Lead Scoring & Qualification */}
            <Card>
                <CardHeader>
                    <CardTitle>Lead Scoring & Qualification</CardTitle>
                    <CardDescription>Engagement and priority</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isEditing ? (
                        <>
                            <div className="space-y-2">
                                <Label>Lead Score: {formData.lead_score}/100</Label>
                                <Slider
                                    value={[formData.lead_score]}
                                    onValueChange={(value) => setFormData({ ...formData, lead_score: value[0] })}
                                    max={100}
                                    step={5}
                                    className="w-full"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Engagement Level</Label>
                                <Select
                                    value={formData.engagement_level}
                                    onValueChange={(value) => setFormData({ ...formData, engagement_level: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="hot">Hot</SelectItem>
                                        <SelectItem value="warm">Warm</SelectItem>
                                        <SelectItem value="cold">Cold</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Budget Range</Label>
                                <Input
                                    value={formData.budget_range}
                                    onChange={(e) => setFormData({ ...formData, budget_range: e.target.value })}
                                    placeholder="e.g., $10k-$50k"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Timeline</Label>
                                <Input
                                    value={formData.timeline}
                                    onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                                    placeholder="e.g., Q1 2026"
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <p className="text-sm text-muted-foreground">Lead Score</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex-1 bg-muted rounded-full h-2">
                                        <div
                                            className="bg-primary h-2 rounded-full transition-all"
                                            style={{ width: `${profile.lead_score || 0}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-medium">{profile.lead_score || 0}/100</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Engagement Level</p>
                                <p className="font-medium capitalize">{profile.engagement_level || 'Cold'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Budget Range</p>
                                <p className="font-medium">{profile.budget_range || 'Not specified'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Timeline</p>
                                <p className="font-medium">{profile.timeline || 'Not specified'}</p>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Contact Preferences */}
            <Card>
                <CardHeader>
                    <CardTitle>Contact Preferences</CardTitle>
                    <CardDescription>Communication preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isEditing ? (
                        <>
                            <div className="space-y-2">
                                <Label>Preferred Contact Method</Label>
                                <Select
                                    value={formData.preferred_contact_method}
                                    onValueChange={(value) => setFormData({ ...formData, preferred_contact_method: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="email">Email</SelectItem>
                                        <SelectItem value="phone">Phone</SelectItem>
                                        <SelectItem value="sms">SMS</SelectItem>
                                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Best Contact Time</Label>
                                <Input
                                    value={formData.best_contact_time}
                                    onChange={(e) => setFormData({ ...formData, best_contact_time: e.target.value })}
                                    placeholder="e.g., Mornings, 2-4 PM"
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <p className="text-sm text-muted-foreground">Preferred Contact Method</p>
                                <p className="font-medium capitalize">{profile.preferred_contact_method || 'Not specified'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Best Contact Time</p>
                                <p className="font-medium">{profile.best_contact_time || 'Not specified'}</p>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Action Buttons */}
            {isEditing && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex gap-2">
                            <Button onClick={handleSave} disabled={saving} className="flex-1">
                                <Save className="w-4 h-4 mr-2" />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                            <Button variant="outline" onClick={handleCancel} disabled={saving}>
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
