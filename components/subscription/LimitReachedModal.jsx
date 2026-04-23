'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { X, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * LimitReachedModal
 * Props:
 *   open       - boolean, controls dialog visibility
 *   onClose    - function, called when dialog should close
 *   resource   - 'projects' | 'leads' | 'campaigns' | 'users'
 *   current    - number, current usage count
 *   limit      - number, plan limit
 *   active     - number, active (non-archived) count  (projects/leads/campaigns only)
 *   archived   - number, archived count               (projects/leads/campaigns only)
 */
export default function LimitReachedModal({ open, onClose, resource, current, limit, active, archived }) {
    const resourceLabel = resource
        ? resource.charAt(0).toUpperCase() + resource.slice(1)
        : 'Resource'

    const showActiveArchived = resource && resource !== 'users'

    return (
        <Dialog.Root open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose?.() }}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">

                    {/* Close button */}
                    <Dialog.Close asChild>
                        <button
                            className="absolute right-4 top-4 rounded-md p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label="Close"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </Dialog.Close>

                    {/* Icon + Title */}
                    <div className="flex items-start gap-3 mb-4">
                        <div className="flex-shrink-0 rounded-full bg-red-100 p-2">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <Dialog.Title className="text-lg font-semibold text-gray-900">
                                {resourceLabel} Limit Reached
                            </Dialog.Title>
                            <Dialog.Description className="mt-1 text-sm text-gray-500">
                                You have used all {limit} {resource} on your current plan.
                            </Dialog.Description>
                        </div>
                    </div>

                    {/* Stats row */}
                    <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 mb-4">
                        {showActiveArchived ? (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">
                                    <span className="font-medium text-gray-800">Active:</span> {active ?? '—'}
                                </span>
                                <span className="text-gray-400">|</span>
                                <span className="text-gray-600">
                                    <span className="font-medium text-gray-800">Archived:</span> {archived ?? '—'}
                                </span>
                                <span className="text-gray-400">|</span>
                                <span className="text-gray-600">
                                    <span className="font-medium text-gray-800">Total:</span>{' '}
                                    <span className="text-red-600 font-semibold">{current}</span>
                                    <span className="text-gray-500"> / {limit}</span>
                                </span>
                            </div>
                        ) : (
                            <div className="text-sm text-gray-600">
                                <span className="font-medium text-gray-800">Total:</span>{' '}
                                <span className="text-red-600 font-semibold">{current}</span>
                                <span className="text-gray-500"> / {limit}</span>
                            </div>
                        )}
                    </div>

                    {/* Archive note */}
                    {showActiveArchived && (
                        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-5">
                            Archived {resource} count toward your plan limit.
                        </p>
                    )}

                    {/* CTA */}
                    <div className="flex items-center gap-3">
                        <Button
                            asChild
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <a href="mailto:support@quinite.in">
                                Contact us to upgrade your plan
                            </a>
                        </Button>
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="flex-shrink-0"
                        >
                            Close
                        </Button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
