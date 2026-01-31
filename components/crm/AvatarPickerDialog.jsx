'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'
import { Check } from 'lucide-react'

export default function AvatarPickerDialog({ open, onOpenChange, lead, onSave }) {
    const [loading, setLoading] = useState(false)
    const [selectedAvatar, setSelectedAvatar] = useState(lead?.avatar_url || '')

    // Local avatar options from public/assets/avatar folder
    const MALE_AVATARS = [
        '/assets/avatar/Male/avatar-male-1.svg',
        '/assets/avatar/Male/avatar-male-2.svg',
        '/assets/avatar/Male/avatar-male-3.svg',
        '/assets/avatar/Male/avatar-male-4.svg',
        '/assets/avatar/Male/avatar-male-5.svg'
    ]

    const FEMALE_AVATARS = [
        '/assets/avatar/Female/avatar-female-1.svg',
        '/assets/avatar/Female/avatar-female-2.svg',
        '/assets/avatar/Female/avatar-female-3.svg',
        '/assets/avatar/Female/avatar-female-4.svg',
        '/assets/avatar/Female/avatar-female-5.svg'
    ]

    // Combine all avatars
    const ALL_AVATARS = [...MALE_AVATARS, ...FEMALE_AVATARS]

    const handleSave = async () => {
        if (!selectedAvatar) {
            toast.error('Please select an avatar')
            return
        }

        try {
            setLoading(true)
            const res = await fetch(`/api/leads/${lead.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ avatar_url: selectedAvatar })
            })

            if (!res.ok) {
                const errorData = await res.json()
                console.error('Avatar update failed:', errorData)
                throw new Error(errorData.error || 'Failed to update avatar')
            }

            toast.success('Avatar updated successfully')
            onSave() // Trigger refresh
            onOpenChange(false)
        } catch (error) {
            console.error(error)
            toast.error('Failed to update avatar')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Choose Your Avatar</DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    <div className="grid grid-cols-5 gap-4">
                        {ALL_AVATARS.map((url, index) => (
                            <button
                                key={url}
                                type="button"
                                className={`relative group cursor-pointer rounded-full overflow-hidden border-4 transition-all duration-200 hover:scale-105 ${selectedAvatar === url
                                    ? 'border-primary ring-4 ring-primary/20 scale-105'
                                    : 'border-transparent hover:border-muted'
                                    }`}
                                onClick={() => setSelectedAvatar(url)}
                            >
                                <div className="aspect-square w-full bg-muted/30 flex items-center justify-center">
                                    <img
                                        src={url}
                                        alt={`Avatar ${index + 1}`}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                </div>
                                {selectedAvatar === url && (
                                    <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                                        <div className="bg-primary rounded-full p-1">
                                            <Check className="w-4 h-4 text-primary-foreground" />
                                        </div>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="button" onClick={handleSave} disabled={loading || !selectedAvatar}>
                        {loading ? 'Saving...' : 'Save Avatar'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
