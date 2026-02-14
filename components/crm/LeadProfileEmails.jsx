'use client'

import { Button } from '@/components/ui/button'
import { Mail } from 'lucide-react'

export default function LeadProfileEmails() {
    return (
        <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground bg-gray-50/50 rounded-xl border-2 border-dashed">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                <Mail className="w-8 h-8 text-primary/60" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Connect Email</h3>
            <p className="max-w-xs text-center mt-2 text-sm">Sync your email to see all communications in one place.</p>
            <Button variant="outline" className="mt-6">Integrate Now</Button>
        </div>
    )
}
