'use client'

import React from 'react'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from '@/components/ui/button'
import { Zap, CheckCircle2, Server, Database, Wifi, HardDrive } from 'lucide-react'
import { cn } from "@/lib/utils"

export function SystemStatus() {
    const [isMounted, setIsMounted] = React.useState(false)

    React.useEffect(() => {
        setIsMounted(true)
    }, [])

    const systems = [
        { name: 'API Server', status: 'operational', icon: Server },
        { name: 'Database', status: 'operational', icon: Database },
        { name: 'WebSocket', status: 'operational', icon: Wifi },
        { name: 'Storage', status: 'operational', icon: HardDrive },
    ]

    if (!isMounted) {
        return (
            <Button variant="ghost" size="icon" className="text-slate-500 hover:bg-blue-50 hover:text-blue-600 w-8 h-8 rounded relative">
                <Zap className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-green-500 rounded-full border border-white"></span>
            </Button>
        )
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="text-slate-500 hover:bg-blue-50 hover:text-blue-600 w-8 h-8 rounded relative">
                    <Zap className="w-4 h-4" />
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-green-500 rounded-full border border-white"></span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="end">
                <div className="p-3 border-b bg-slate-50/50">
                    <h4 className="font-semibold text-sm">System Status</h4>
                    <p className="text-xs text-muted-foreground">All systems operational</p>
                </div>
                <div className="p-2">
                    {systems.map((sys) => (
                        <div key={sys.name} className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 rounded-md bg-secondary/50 text-muted-foreground">
                                    <sys.icon className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium">{sys.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs text-green-600 font-medium">Online</span>
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-2 border-t bg-slate-50/50 text-center">
                    <p className="text-[10px] text-muted-foreground">Last updated: Just now</p>
                </div>
            </PopoverContent>
        </Popover>
    )
}
