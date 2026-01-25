'use client'

import CrmSidebar from '@/components/admin/CrmSidebar'

export default function CrmLayout({ children }) {
    return (
        <div className="flex">
            <CrmSidebar />
            <div className="flex-1 w-full min-w-0 p-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
                {children}
            </div>
        </div>
    )
}
