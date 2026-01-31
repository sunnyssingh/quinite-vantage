import { Skeleton } from "@/components/ui/skeleton"

export function LoadingSpinner({ fullScreen = false, className = "" }) {
    if (fullScreen) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-50/50">
                <div className="w-full max-w-4xl space-y-6 p-8">
                    {/* Header Skeleton */}
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </div>
                    {/* Navigation Skeleton */}
                    <Skeleton className="h-10 w-full" />
                    {/* Content Skeleton */}
                    <div className="grid grid-cols-3 gap-4">
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                    <div className="space-y-3">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={`flex w-full items-center justify-center py-8 ${className}`}>
            <div className="w-full max-w-2xl space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        </div>
    )
}
