'use client'

import InventorySidebar from '@/components/admin/InventorySidebar'

export default function InventoryLayout({ children }) {
    return (
        <div className="flex">
            <InventorySidebar />
            <div className="flex-1 w-full min-w-0 p-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
                {children}
            </div>
        </div>
    )
}
