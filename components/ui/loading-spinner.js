import { Loader2 } from "lucide-react"

export function LoadingSpinner({ fullScreen = false, className = "" }) {
    if (fullScreen) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-50/50">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className={`h-10 w-10 animate-spin text-blue-600 ${className}`} />
                    <p className="text-sm text-gray-500 font-medium animate-pulse">Loading...</p>
                </div>
            </div>
        )
    }

    return (
        <div className={`flex w-full items-center justify-center py-8 ${className}`}>
            <div className="flex flex-col items-center gap-2">
                <Loader2 className={`h-8 w-8 animate-spin text-blue-600 ${className}`} />
            </div>
        </div>
    )
}
