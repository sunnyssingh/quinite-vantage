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
    User
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
        { label: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
        { label: 'CRM', href: '/dashboard/admin/crm', icon: KanbanSquare },
        { label: 'Inventory', href: '/dashboard/admin/inventory', icon: Building },
    ]

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo & Nav */}
                    <div className="flex items-center gap-8">
                        {/* Logo */}
                        <div className="flex-shrink-0 flex items-center gap-2">
                            <div className="p-1.5 bg-blue-600 rounded-lg">
                                <Building2 className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-gray-900 hidden md:block">Quinite Vantage</span>
                        </div>

                        {/* Simple Navigation (Desktop) */}
                        <nav className="hidden md:flex space-x-1">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href || (item.href !== '/dashboard/admin' && pathname.startsWith(item.href))
                                const Icon = item.icon

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`
                                            flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
                                            ${isActive
                                                ? 'bg-blue-50 text-blue-600'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
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
                            <span className="text-sm text-gray-500 mr-4 font-medium hidden md:inline-block">
                                {profile?.organization?.name}
                            </span>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
                                        <AvatarFallback className="bg-blue-100 text-blue-600">
                                            {profile?.full_name?.[0] || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{profile?.full_name}</p>
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
                                <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600 focus:bg-red-50">
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
