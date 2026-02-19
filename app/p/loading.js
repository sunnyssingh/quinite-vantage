import { Loader2 } from 'lucide-react'

export default function Loading() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-white">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-slate-500 font-medium animate-pulse">Loading website...</p>
            </div>
        </div>
    )
}
