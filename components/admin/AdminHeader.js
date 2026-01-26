'use client'

import Link from 'next/link'
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
    Megaphone // [NEW]
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
        { label: 'Analytics', href: '/dashboard/admin/analytics', icon: BarChart3 },
        { label: 'Users', href: '/dashboard/admin/users', icon: Users },
        { label: 'Admin', href: '/dashboard/admin/profile', icon: Settings },
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
        <header className="bg-background border-b border-border sticky top-0 z-30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo & Nav */}
                    <div className="flex items-center gap-4 md:gap-8">
                        {/* Mobile Menu */}
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="md:hidden">
                                    <Menu className="w-5 h-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-[80%] sm:w-[300px] p-0 overflow-y-auto">
                                <SheetHeader className="p-6 border-b border-border text-left">
                                    <SheetTitle className="flex items-center gap-2">
                                        <div className="p-1.5 bg-primary/10 rounded-lg">
                                            <Building2 className="w-5 h-5 text-primary" />
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
                                                        ? 'bg-secondary text-foreground'
                                                        : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}
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
                                                                ? 'bg-primary/10 text-primary'
                                                                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}
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

                        {/* Logo */}
                        <div className="flex-shrink-0 flex items-center gap-2">
                            <div className="p-1.5 bg-primary/10 rounded-lg hidden md:block">
                                <Building2 className="w-5 h-5 text-primary" />
                            </div>
                            <span className="font-semibold text-foreground md:block tracking-tight">Quinite Vantage</span>
                        </div>

                        {/* Simple Navigation (Desktop) */}
                        <nav className="hidden md:flex space-x-1">
                            {navItems.filter(i => !['Users', 'Admin'].includes(i.label)).map((item) => { // Filter out extras for desktop if needed, or keep them. I'll keep original 4 for desktop to avoid clutter if that was user intent, or just show all. Let's show original 4 + Users/Settings might be too wide. 
                                // Reverting to original list for Desktop loop to be safe, but mobile gets full list.
                                // Actually, I'll just map the first 4 for desktop as before
                                const isActive = pathname === item.href || (item.href !== '/dashboard/admin' && pathname.startsWith(item.href))
                                const Icon = item.icon

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`
                                            flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                                            ${isActive
                                                ? 'bg-secondary text-foreground shadow-sm'
                                                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}
                                        `}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {item.label}
                                    </Link>
                                )
                            })}
                        </nav>
                    </div>

                    {/* Right Side: User Menu */}
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <span className="text-sm text-muted-foreground mr-4 font-medium hidden md:inline-block">
                                {profile?.organization?.name}
                            </span>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full ring-offset-background focus:ring-0 hover:bg-transparent">
                                    <Avatar className="h-8 w-8 border border-border">
                                        <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
                                        <AvatarFallback className="bg-secondary text-foreground text-xs font-medium">
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
        </header>
    )
}
