import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function QuickActionCard({
    title,
    description,
    href,
    icon: Icon,
    color = 'blue'
}) {
    return (
        <Link href={href}>
            <Card className="group hover:shadow-lg hover:border-blue-500 transition-all cursor-pointer h-full">
                <CardContent className="p-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-start justify-between">
                            <div className={`p-3 bg-${color}-50 rounded-lg group-hover:bg-${color}-100 transition-colors`}>
                                <Icon className={`w-5 h-5 text-${color}-600`} />
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {title}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                                {description}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}
