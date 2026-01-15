'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient as createClientSupabaseClient } from '@/lib/supabase/client'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Menu, LogOut, Building2 } from 'lucide-react'

export default function MobileNav({ navItems, role, userEmail }) {
    const router = useRouter()
    const pathname = usePathname()
    const [open, setOpen] = useState(false)

    const handleLogout = async () => {
        const supabase = createClientSupabaseClient()
        await supabase.auth.signOut()
        router.push('/')
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
                <div className="flex flex-col h-full bg-white">
                    {/* Header */}
                    {/* Header */}
                    <SheetHeader className="p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-600 rounded-lg">
                                <Building2 className="w-6 h-6 text-white" />
                            </div>
                            <div className="overflow-hidden text-left">
                                <SheetTitle className="text-lg font-bold text-gray-900 truncate">Quinite Vantage</SheetTitle>
                                <p className="text-xs text-gray-500 capitalize font-normal">{role?.replace('_', ' ') || 'Dashboard'}</p>
                            </div>
                        </div>
                    </SheetHeader>

                    {/* Navigation Links */}
                    <div className="flex-1 overflow-y-auto p-4">
                        <nav className="space-y-1">
                            {navItems.map((item, index) => {
                                const Icon = item.icon
                                const isActive = pathname === item.href

                                return (
                                    <Link
                                        key={index}
                                        href={item.href}
                                        onClick={() => setOpen(false)}
                                        className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                      ${isActive
                                                ? 'bg-blue-50 text-blue-600 font-medium'
                                                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                            }
                    `}
                                    >
                                        <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                                        <span>{item.label}</span>
                                    </Link>
                                )
                            })}
                        </nav>
                    </div>

                    {/* Footer / User Info */}
                    <div className="p-4 border-t border-gray-200 bg-gray-50">
                        {userEmail && (
                            <div className="mb-4 px-2">
                                <p className="text-sm font-medium text-gray-900 truncate">{userEmail}</p>
                                <p className="text-xs text-gray-500">Signed in</p>
                            </div>
                        )}
                        <Button
                            variant="outline"
                            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            onClick={handleLogout}
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
