'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Check, Copy, AlertTriangle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function CredentialsModal({ open, onOpenChange, credentials }) {
    const [copied, setCopied] = useState(false)
    const { toast } = useToast()

    const handleCopy = async () => {
        try {
            const textToCopy = `Email: ${credentials.email}\nPassword: ${credentials.tempPassword}`
            await navigator.clipboard.writeText(textToCopy)
            setCopied(true)
            toast({
                title: "Copied!",
                description: "Credentials copied to clipboard",
            })
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to copy credentials",
            })
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-green-600">
                        <Check className="w-5 h-5" />
                        User Created Successfully
                    </DialogTitle>
                    <DialogDescription>
                        Share these temporary credentials with the user. They won't be shown again.
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-slate-50 p-4 rounded-lg space-y-4 border border-slate-200">
                    <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">Email</label>
                        <div className="text-sm font-mono text-gray-900 bg-white p-2 rounded border border-gray-200 mt-1">
                            {credentials?.email}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">Temporary Password</label>
                        <div className="text-sm font-mono text-gray-900 bg-white p-2 rounded border border-gray-200 mt-1">
                            {credentials?.tempPassword}
                        </div>
                    </div>
                </div>

                <div className="bg-amber-50 p-3 rounded-md flex gap-2 items-start text-amber-800 text-sm">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <p>This password is temporary. The user should change it immediately after their first login.</p>
                </div>

                <div className="flex justify-end gap-3">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Close
                    </Button>
                    <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={handleCopy}
                    >
                        {copied ? (
                            <>
                                <Check className="w-4 h-4 mr-2" />
                                Copied
                            </>
                        ) : (
                            <>
                                <Copy className="w-4 h-4 mr-2" />
                                Copy Credentials
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
