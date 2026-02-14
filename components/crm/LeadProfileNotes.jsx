'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Save } from 'lucide-react'

export default function LeadProfileNotes({ notes, setNotes, onSave, isSaving }) {
    return (
        <Card className="border-0 shadow-sm ring-1 ring-gray-200">
            <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
                <CardDescription>Internal notes and remarks</CardDescription>
            </CardHeader>
            <CardContent>
                <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[200px] resize-none text-base p-4 focus-visible:ring-1 focus-visible:ring-primary/20"
                    placeholder="Start typing..."
                />
                <div className="flex justify-end mt-4">
                    <Button onClick={onSave} disabled={isSaving} size="sm">
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? 'Saving...' : 'Save Notes'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
