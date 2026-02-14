'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { createClient as createClientSupabaseClient } from '@/lib/supabase/client'
import {
    Building2,
    LogOut,
    LayoutDashboard,
    KanbanSquare,
    Building,
    Settings,
    User,
    BarChart3,
    FileText,
    Users,
    Menu,
    FolderKanban, // [NEW]
    Megaphone,
    Search,
    Zap,
    HelpCircle,
    Phone,
    Clock,
    TrendingUp
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetHeader,
    SheetTitle
} from "@/components/ui/sheet" // [NEW]
import { Button } from '@/components/ui/button'
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { GlobalSearch } from './GlobalSearch'
import { NotificationBell } from './NotificationBell'
import { SystemStatus } from './SystemStatus'
import { HelpMenu } from './HelpMenu'

export default function AdminHeader({ user, profile }) {
    const router = useRouter()
    const pathname = usePathname()
    const [open, setOpen] = React.useState(false) // [NEW] State for mobile menu
    const [isMounted, setIsMounted] = React.useState(false)

    React.useEffect(() => {
        setIsMounted(true)
    }, [])

    const handleSignOut = async () => {
        const supabase = createClientSupabaseClient()
        await supabase.auth.signOut()
        router.push('/')
    }

    const navItems = [
        { label: 'Overview', href: '/dashboard/admin', icon: LayoutDashboard },
        { label: 'CRM', href: '/dashboard/admin/crm/dashboard', icon: KanbanSquare },
        { label: 'Inventory', href: '/dashboard/admin/inventory', icon: Building },
        { label: 'Analytics', href: '/dashboard/admin/analytics', icon: BarChart3 }
    ]

    const crmNavItems = [
        { label: 'Dashboard', href: '/dashboard/admin/crm/dashboard', icon: LayoutDashboard },
        { label: 'Projects', href: '/dashboard/admin/crm/projects', icon: FolderKanban },
        { label: 'Campaigns', href: '/dashboard/admin/crm/campaigns', icon: Megaphone },
        { label: 'Leads', href: '/dashboard/admin/crm/leads', icon: Users },
        { label: 'Pipeline', href: '/dashboard/admin/crm?tab=pipeline', icon: KanbanSquare },
        { label: 'Live Calls', href: '/dashboard/admin/crm/calls/live', icon: Phone },
        { label: 'Call History', href: '/dashboard/admin/crm/calls/history', icon: Clock },
        { label: 'Insights', href: '/dashboard/admin/crm/insights', icon: TrendingUp },
        { label: 'Analytics', href: '/dashboard/admin/crm/analytics', icon: BarChart3 },
        { label: 'Audit Log', href: '/dashboard/admin/crm/auditlog', icon: FileText },
        { label: 'Settings', href: '/dashboard/admin/crm/settings', icon: Settings },
    ]

    const inventoryNavItems = [
        { label: 'Overview', href: '/dashboard/admin/inventory', icon: LayoutDashboard },
        { label: 'Properties', href: '/dashboard/admin/inventory/properties', icon: Building },
        { label: 'Analytics', href: '/dashboard/admin/inventory/analytics', icon: BarChart3 },
    ]

    const isCrmModule = pathname?.startsWith('/dashboard/admin/crm')
    const isInventoryModule = pathname?.startsWith('/dashboard/admin/inventory')

    return (
        <header className="sticky top-0 z-30 w-full  border-border bg-white">
            <div className="w-full px-4 sm:px-6">
                <div className="flex justify-between h-14 items-center">
                    {/* Left Section: Logo & Nav */}
                    <div className="flex items-center gap-2 md:gap-6 h-full">
                        {/* Mobile Menu */}
                        <div className="md:hidden">
                            {isMounted ? (
                                <Sheet open={open} onOpenChange={setOpen}>
                                    <SheetTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <Menu className="h-6 w-6" />
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent side="left" className="w-[80%] sm:w-[300px] p-0 overflow-y-auto">
                                        <SheetHeader className="p-6 border-b border-border text-left">
                                            <SheetTitle className="flex items-center gap-2">
                                                <div className="relative w-32 h-12">
                                                    <Image
                                                        src="/assets/logo.svg"
                                                        alt="Quinite Vantage"
                                                        fill
                                                        className="object-contain object-left"
                                                    />
                                                </div>
                                            </SheetTitle>
                                        </SheetHeader>
                                        <div className="p-4 flex flex-col gap-1">
                                            {navItems.map((item) => {
                                                // Determine if this nav item is active based on the current path
                                                let isActive = false

                                                if (item.label === 'Overview') {
                                                    // Overview is active only on exact match
                                                    isActive = pathname === '/dashboard/admin'
                                                } else if (item.label === 'CRM') {
                                                    // CRM is active for any path starting with /dashboard/admin/crm
                                                    isActive = pathname?.startsWith('/dashboard/admin/crm')
                                                } else if (item.label === 'Inventory') {
                                                    // Inventory is active for any path starting with /dashboard/admin/inventory
                                                    isActive = pathname?.startsWith('/dashboard/admin/inventory')
                                                } else if (item.label === 'Analytics') {
                                                    // Analytics is active for exact match (not CRM or Inventory analytics)
                                                    isActive = pathname === '/dashboard/admin/analytics'
                                                }

                                                const Icon = item.icon
                                                return (
                                                    <Link
                                                        key={item.href}
                                                        href={item.href}
                                                        onClick={() => setOpen(false)}
                                                        className={cn(
                                                            "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                                                            isActive
                                                                ? "bg-blue-50 text-blue-700"
                                                                : "text-muted-foreground hover:bg-slate-50 hover:text-foreground"
                                                        )}
                                                    >
                                                        <Icon className="w-4 h-4" />
                                                        {item.label}
                                                    </Link>
                                                )
                                            })}
                                            {/* CRM Module Sub-Navigation */}
                                            {isCrmModule && (
                                                <>
                                                    <div className="my-2 border-t border-border" />
                                                    <div className="px-3 py-1.5 text-xs text-muted-foreground uppercase tracking-wider">
                                                        CRM Module
                                                    </div>
                                                    {crmNavItems.map((item) => {
                                                        const isActive = pathname === item.href || (item.label === 'Pipeline' && pathname === '/dashboard/admin/crm')
                                                        const Icon = item.icon
                                                        return (
                                                            <Link
                                                                key={item.href}
                                                                href={item.href}
                                                                onClick={() => setOpen(false)}
                                                                className={cn(
                                                                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                                                                    isActive
                                                                        ? "bg-blue-50 text-blue-700"
                                                                        : "text-muted-foreground hover:bg-slate-50 hover:text-foreground"
                                                                )}
                                                            >
                                                                <Icon className="w-4 h-4" />
                                                                {item.label}
                                                            </Link>
                                                        )
                                                    })}
                                                </>
                                            )}

                                            {/* Inventory Module Sub-Navigation */}
                                            {isInventoryModule && (
                                                <>
                                                    <div className="my-2 border-t border-border" />
                                                    <div className="px-3 py-1.5 text-xs text-muted-foreground uppercase tracking-wider">
                                                        Inventory Module
                                                    </div>
                                                    {inventoryNavItems.map((item) => {
                                                        const isActive = pathname === item.href
                                                        const Icon = item.icon
                                                        return (
                                                            <Link
                                                                key={item.href}
                                                                href={item.href}
                                                                onClick={() => setOpen(false)}
                                                                className={cn(
                                                                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                                                                    isActive
                                                                        ? "bg-blue-50 text-blue-700"
                                                                        : "text-muted-foreground hover:bg-slate-50 hover:text-foreground"
                                                                )}
                                                            >
                                                                <Icon className="w-4 h-4" />
                                                                {item.label}
                                                            </Link>
                                                        )
                                                    })}
                                                </>
                                            )}
                                        </div>
                                    </SheetContent>
                                </Sheet>
                            ) : (
                                <Button variant="ghost" size="icon">
                                    <Menu className="h-6 w-6" />
                                </Button>
                            )}
                        </div>

                        {/* Logo - Mobile & Desktop */}
                        <div className="flex-shrink-0 flex items-center gap-4 h-full">
                            {/* Desktop: Full Logo */}
                            <div className="relative w-32 h-8 hidden md:block">
                                <Image
                                    src="/assets/logo.svg"
                                    alt="Quinite Vantage"
                                    fill
                                    className="object-contain object-left"
                                    priority
                                />
                            </div>

                            {/* Mobile: Logo Icon Only */}
                            <div className="relative w-28 h-10 md:hidden">
                                <Image
                                    src="/assets/logo.svg"
                                    alt="Quinite Vantage"
                                    fill
                                    className="object-contain object-left"
                                    priority
                                />
                            </div>

                            {/* Vertical Separator */}
                            <div className="hidden md:block h-6 w-px bg-slate-200"></div>

                            {/* Desktop Nav */}
                            <nav className="hidden md:flex items-end h-full">
                                {navItems.map((item) => {
                                    // Determine if this nav item is active based on the current path
                                    let isActive = false

                                    if (item.label === 'Overview') {
                                        // Overview is active only on exact match
                                        isActive = pathname === '/dashboard/admin'
                                    } else if (item.label === 'CRM') {
                                        // CRM is active for any path starting with /dashboard/admin/crm
                                        isActive = pathname?.startsWith('/dashboard/admin/crm')
                                    } else if (item.label === 'Inventory') {
                                        // Inventory is active for any path starting with /dashboard/admin/inventory
                                        isActive = pathname?.startsWith('/dashboard/admin/inventory')
                                    } else if (item.label === 'Analytics') {
                                        // Analytics is active for exact match (not CRM or Inventory analytics)
                                        isActive = pathname === '/dashboard/admin/analytics'
                                    }

                                    const Icon = item.icon

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={cn(
                                                "relative flex items-center gap-2 px-5 text-sm font-medium transition-all duration-300 rounded-t-lg", // Thinner font, smoother roundness
                                                /* Height calculation: Full height minus top margin. Natural feel = floating slightly off top */
                                                "h-[calc(100%-12px)] mb-0",
                                                isActive
                                                    ? "text-blue-600 bg-[#f5f8fb]" // Clean, no shadow, no border. Just color.
                                                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50/50 h-[calc(100%-18px)] mb-1.5 rounded-md"
                                            )}
                                        >
                                            {/* Top Gradient Border */}
                                            {isActive && (
                                                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-lg" />
                                            )}

                                            <Icon className={cn(
                                                "w-4 h-4 mb-0.5",
                                                isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                                            )} />
                                            {item.label}
                                        </Link>
                                    )
                                })}
                            </nav>
                        </div>
                    </div>

                    {/* Right Section: Search & Actions */}
                    <div className="flex items-center gap-4">
                        {/* Global Search */}
                        <div className="hidden lg:block">
                            <GlobalSearch />
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Quick Actions (System Status) */}
                            <SystemStatus />

                            {/* Notifications */}
                            <NotificationBell />

                            {/* Help / QL */}
                            <HelpMenu />

                            <div className="h-4 w-px bg-slate-200 mx-1"></div>

                            {/* User Profile */}
                            {isMounted ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="relative h-8 w-8 rounded-full ring-offset-background focus:ring-0 hover:bg-transparent p-0">
                                            <Avatar className="h-8 w-8 border border-slate-200">
                                                <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
                                                <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
                                                    {profile?.full_name?.[0] || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56" align="end" forceMount>
                                        <DropdownMenuLabel className="font-normal">
                                            <div className="flex flex-col space-y-1">
                                                <p className="text-sm font-medium leading-none text-foreground">{profile?.full_name}</p>
                                                <p className="text-xs leading-none text-muted-foreground">
                                                    {user?.email}
                                                </p>
                                            </div>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => router.push('/dashboard/admin/profile')}>
                                            <User className="mr-2 h-4 w-4" />
                                            <span>Profile</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => router.push('/dashboard/admin/settings')}>
                                            <Settings className="mr-2 h-4 w-4" />
                                            <span>Settings</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                            <LogOut className="mr-2 h-4 w-4" />
                                            <span>Log out</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full ring-offset-background focus:ring-0 hover:bg-transparent p-0">
                                    <Avatar className="h-8 w-8 border border-slate-200">
                                        <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
                                        <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
                                            {profile?.full_name?.[0] || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}
