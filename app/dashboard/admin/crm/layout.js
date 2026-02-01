'use client'

import CrmSidebar from '@/components/admin/CrmSidebar'
import CustomBreadcrumbs from '@/components/ui/CustomBreadcrumbs'

export default function CrmLayout({ children }) {
    return (
        <div className="flex h-full w-full overflow-hidden">
            <CrmSidebar />

            {/* Scrollable Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                <div className="flex-1 w-full overflow-y-auto scroll-smooth p-4">
                    <div className="mb-4">
                        <CustomBreadcrumbs />
                    </div>
                    {children}
                </div>
            </div>
        </div>
    )
}
