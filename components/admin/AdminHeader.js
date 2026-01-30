'use client'

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
    Bell,
    HelpCircle
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function AdminHeader({ user, profile }) {
    const router = useRouter()
    const pathname = usePathname()

    const handleSignOut = async () => {
        const supabase = createClientSupabaseClient()
        await supabase.auth.signOut()
        router.push('/')
    }

    const navItems = [
        { label: 'Overview', href: '/dashboard/admin', icon: LayoutDashboard },
        { label: 'CRM', href: '/dashboard/admin/crm', icon: KanbanSquare },
        { label: 'Inventory', href: '/dashboard/admin/inventory', icon: Building },
        { label: 'Analytics', href: '/dashboard/admin/analytics', icon: BarChart3 }

    ]

    const crmNavItems = [
        { label: 'Projects', href: '/dashboard/admin/crm/projects', icon: FolderKanban },
        { label: 'Campaigns', href: '/dashboard/admin/crm/campaigns', icon: Megaphone },
        { label: 'Leads', href: '/dashboard/admin/crm/leads', icon: Users },
        { label: 'Pipeline', href: '/dashboard/admin/crm?tab=pipeline', icon: KanbanSquare },
        { label: 'Analytics', href: '/dashboard/admin/crm/analytics', icon: BarChart3 },
        { label: 'Audit Log', href: '/dashboard/admin/crm/auditlog', icon: FileText },
        { label: 'Settings', href: '/dashboard/admin/crm/settings', icon: Settings },
    ]

    const isCrmModule = pathname?.startsWith('/dashboard/admin/crm')

    return (
        <header className="sticky top-0 z-30 w-full border-b border-border bg-white shadow-sm">
            <div className="w-full px-4 sm:px-6">
                <div className="flex justify-between h-14 items-center">
                    {/* Left Section: Logo & Nav */}
                    <div className="flex items-center gap-6">
                        {/* Mobile Menu */}
                        <div className="md:hidden">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <Menu className="w-5 h-5" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="w-[80%] sm:w-[300px] p-0 overflow-y-auto">
                                    <SheetHeader className="p-6 border-b border-border text-left">
                                        <SheetTitle className="flex items-center gap-2">
                                            <div className="relative w-8 h-8">
                                                <Image
                                                    src="/assets/logo.svg"
                                                    alt="Quinite Vantage"
                                                    fill
                                                    className="object-contain"
                                                />
                                            </div>
                                            <span>Quinite Vantage</span>
                                        </SheetTitle>
                                    </SheetHeader>
                                    <div className="p-4 flex flex-col gap-1">
                                        {navItems.map((item) => {
                                            const isActive = pathname === item.href || (item.href !== '/dashboard/admin' && pathname.startsWith(item.href))
                                            const Icon = item.icon
                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    className={`
                                                        flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors
                                                        ${isActive
                                                            ? 'bg-blue-50 text-blue-700'
                                                            : 'text-muted-foreground hover:bg-slate-50 hover:text-foreground'}
                                                    `}
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
                                                <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                    CRM Module
                                                </div>
                                                {crmNavItems.map((item) => {
                                                    const isActive = pathname === item.href || (item.label === 'Pipeline' && pathname === '/dashboard/admin/crm')
                                                    const Icon = item.icon
                                                    return (
                                                        <Link
                                                            key={item.href}
                                                            href={item.href}
                                                            className={`
                                                                flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors
                                                                ${isActive
                                                                    ? 'bg-blue-50 text-blue-700'
                                                                    : 'text-muted-foreground hover:bg-slate-50 hover:text-foreground'}
                                                            `}
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
                        </div>

                        {/* Logo */}
                        <div className="flex-shrink-0 flex items-center gap-4">
                            <div className="relative w-32 h-8 hidden md:block">
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
                            <nav className="hidden md:flex items-center gap-1">
                                {navItems.map((item) => {
                                    const isActive = pathname === item.href || (item.href !== '/dashboard/admin' && pathname.startsWith(item.href))
                                    const Icon = item.icon

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`
                                                flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200
                                                ${isActive
                                                    ? 'bg-blue-50 text-blue-700'
                                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}
                                            `}
                                        >
                                            <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                            {item.label}
                                        </Link>
                                    )
                                })}
                            </nav>
                        </div>
                    </div>

                    {/* Right Section: Search & Actions */}
                    <div className="flex items-center gap-4">
                        {/* Search Bar */}
                        <div className="relative hidden lg:block w-72">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search leads, projects..."
                                className="w-full h-9 pl-9 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                                <span className="text-[10px] bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-400 font-medium">/</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Quick Actions (Zap) */}
                            <Button variant="ghost" size="icon" className="text-slate-500 hover:bg-blue-50 hover:text-blue-600 w-8 h-8 rounded">
                                <Zap className="w-4 h-4" />
                            </Button>

                            {/* Notifications */}
                            <Button variant="ghost" size="icon" className="text-slate-500 hover:bg-blue-50 hover:text-blue-600 w-8 h-8 rounded relative">
                                <Bell className="w-4 h-4" />
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                            </Button>

                            {/* Help / QL */}
                            <Button variant="ghost" size="icon" className="text-slate-500 hover:bg-blue-50 hover:text-blue-600 w-8 h-8 rounded hidden sm:flex">
                                <HelpCircle className="w-4 h-4" />
                            </Button>

                            <div className="h-4 w-px bg-slate-200 mx-1"></div>

                            {/* User Profile */}
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
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}
