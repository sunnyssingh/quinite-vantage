'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Camera, Mail, Phone, Building, MapPin, Edit2 } from 'lucide-react'

const getInitials = (name) => {
    if (!name) return 'LP'
    return name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
}

export default function LeadProfileSidebar({ lead, profile, onEditProfile, onEditAvatar }) {
    if (!lead || !profile) return null

    return (
        <div className="bg-card border rounded-xl overflow-hidden shadow-sm h-full flex flex-col">
            <div
                className="h-28 w-full"
                style={{
                    background: 'linear-gradient(to right, #ffffff, #e1f5fe, #b3e5fc)'
                }}
            />

            <div className="flex flex-col items-center text-center px-6 -mt-12 mb-6">
                <div className="relative mb-3 group">
                    <Avatar key={lead.avatar_url || 'no-avatar'} className="h-24 w-24 border-4 border-background shadow-md">
                        {lead.avatar_url ? (
                            <img
                                src={lead.avatar_url}
                                alt={lead.name}
                                className="aspect-square h-full w-full object-cover"
                                onError={(e) => {
                                    console.error('Avatar failed to load:', lead.avatar_url)
                                    e.target.style.display = 'none'
                                }}
                            />
                        ) : null}
                        <AvatarFallback className="text-2xl font-bold bg-white text-primary">
                            {getInitials(lead.name)}
                        </AvatarFallback>
                    </Avatar>
                    {/* Edit Avatar Overlay */}
                    <button
                        onClick={onEditAvatar}
                        className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                        aria-label="Change avatar"
                    >
                        <Camera className="w-6 h-6 text-white" />
                    </button>
                </div>
                <h2 className="text-xl font-bold text-gray-900">{lead.name}</h2>
                <p className="text-sm text-gray-500">{profile.company || 'No Company'}</p>
            </div>

            <div className="px-6 pb-6 flex flex-col flex-1 gap-6">
                <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Contact Info</h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-sm group">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors">
                                <Mail className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500">Email</p>
                                <p className="font-medium text-gray-900 truncate" title={lead.email}>{lead.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm group">
                            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600 group-hover:bg-green-100 transition-colors">
                                <Phone className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500">Phone</p>
                                <p className="font-medium text-gray-900 truncate">{lead.phone || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm group">
                            <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-100 transition-colors">
                                <Building className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500">Department</p>
                                <p className="font-medium text-gray-900 truncate">{lead.department || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Location</h3>
                    <div className="flex items-start gap-3 text-sm">
                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 shrink-0">
                            <MapPin className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 pt-1">
                            <p className="font-medium text-gray-900 leading-snug">
                                {[
                                    profile.mailing_city,
                                    profile.mailing_state,
                                    profile.mailing_country
                                ].filter(Boolean).join(', ') || 'N/A'}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                                {[profile.mailing_street, profile.mailing_zip].filter(Boolean).join(', ')}
                            </p>
                        </div>
                    </div>
                </div>

                <Button variant="outline" className="w-full rounded-lg border-dashed border-gray-300 hover:border-primary hover:text-primary transition-colors mt-auto" onClick={onEditProfile}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Profile
                </Button>
            </div>
        </div>
    )
}
