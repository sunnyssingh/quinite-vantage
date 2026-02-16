'use client'

import React from 'react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button'
import { HelpCircle, ExternalLink, LifeBuoy, Keyboard, Info } from 'lucide-react'
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog'

export function HelpMenu() {
    const [showShortcuts, setShowShortcuts] = React.useState(false)
    const [isMounted, setIsMounted] = React.useState(false)

    React.useEffect(() => {
        setIsMounted(true)
    }, [])

    if (!isMounted) {
        return (
            <Button variant="ghost" size="icon" className="text-slate-500 hover:bg-blue-50 hover:text-blue-600 w-8 h-8 rounded hidden sm:flex">
                <HelpCircle className="w-4 h-4" />
            </Button>
        )
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-slate-500 hover:bg-blue-50 hover:text-blue-600 w-8 h-8 rounded hidden sm:flex">
                        <HelpCircle className="w-4 h-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Help & Support</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <a href="https://docs.quinite.com" target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            <span>Documentation</span>
                        </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <a href="mailto:support@quinite.com" className="cursor-pointer">
                            <LifeBuoy className="mr-2 h-4 w-4" />
                            <span>Contact Support</span>
                        </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={(e) => {
                        e.preventDefault()
                        setShowShortcuts(true)
                    }}>
                        <Keyboard className="mr-2 h-4 w-4" />
                        <span>Keyboard Shortcuts</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <div className="p-2 text-xs text-muted-foreground flex items-center justify-between">
                        <span>Version 2.0.1</span>
                        <Info className="h-3 w-3" />
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>

            <KeyboardShortcutsDialog open={showShortcuts} onOpenChange={setShowShortcuts} />
        </>
    )
}
