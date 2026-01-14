import { Button } from '@/components/ui/button'
import { Download, Plus } from 'lucide-react'

export function PageHeader({
    title,
    description,
    actions = []
}) {
    return (
        <div className="mb-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                    {description && (
                        <p className="text-gray-600 mt-1">{description}</p>
                    )}
                </div>
                {actions.length > 0 && (
                    <div className="flex gap-3">
                        {actions.map((action, index) => {
                            const Icon = action.icon
                            return (
                                <Button
                                    key={index}
                                    variant={action.variant || 'default'}
                                    size={action.size || 'sm'}
                                    onClick={action.onClick}
                                >
                                    {Icon && <Icon className="w-4 h-4 mr-2" />}
                                    {action.label}
                                </Button>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
