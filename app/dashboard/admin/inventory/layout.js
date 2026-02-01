'use client'

import InventorySidebar from '@/components/admin/InventorySidebar'
import CustomBreadcrumbs from '@/components/ui/CustomBreadcrumbs'

export default function InventoryLayout({ children }) {
    return (
        <div className="flex flex-1 h-full min-h-0">
            <InventorySidebar />
            <div className="flex-1 w-full min-w-0 p-4">
                <div className="mb-4">
                    <CustomBreadcrumbs />
                </div>
                {children}
            </div>
        </div>
    )
}
