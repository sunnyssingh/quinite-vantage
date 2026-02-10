/**
 * Example: CSV Export with Feature Gating
 * This shows how to implement feature gating for CSV export functionality
 */

'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { FeatureGate } from '@/hooks/useFeatureGate'
import { toast } from 'react-hot-toast'

export default function ExportButton({ data, filename }) {
    const handleExport = () => {
        // Convert data to CSV
        const csv = convertToCSV(data)

        // Create download link
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename || 'export.csv'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast.success('CSV exported successfully')
    }

    const convertToCSV = (data) => {
        if (!data || data.length === 0) return ''

        const headers = Object.keys(data[0])
        const rows = data.map(row =>
            headers.map(header => {
                const value = row[header]
                // Escape quotes and wrap in quotes if contains comma
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`
                }
                return value
            }).join(',')
        )

        return [headers.join(','), ...rows].join('\n')
    }

    return (
        <FeatureGate feature="csv_export">
            <Button onClick={handleExport} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
            </Button>
        </FeatureGate>
    )
}

/**
 * Usage Example:
 * 
 * import ExportButton from '@/components/ExportButton'
 * 
 * <ExportButton 
 *   data={leads} 
 *   filename="leads-export.csv" 
 * />
 */
