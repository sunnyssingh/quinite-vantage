
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation' // [NEW] Use hook
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Loader2, CheckCircle } from 'lucide-react'
import { toast, Toaster } from 'react-hot-toast'

export default function PublicFormPage() {
    const params = useParams()
    const formId = params?.formId
    const [form, setForm] = useState(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchForm = async () => {
            try {
                const res = await fetch(`/api/forms/${formId}`)
                const data = await res.json()

                if (!res.ok) {
                    throw new Error(data.error || 'Failed to load form')
                }

                setForm(data.form)
            } catch (e) {
                setError(e.message)
            } finally {
                setLoading(false)
            }
        }

        fetchForm()
    }, [formId])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)

        const formData = new FormData(e.target)
        const submissionData = {}

        // Extract data based on schema
        form.schema.forEach(field => {
            if (field.type === 'header') return

            const val = formData.get(field.id)
            if (val) submissionData[field.id] = val
        })

        try {
            const res = await fetch('/api/forms/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    formId,
                    data: submissionData
                })
            })

            if (!res.ok) throw new Error('Submission failed')

            setSubmitted(true)
        } catch (e) {
            toast.error(e.message)
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>

    if (error) return (
        <div className="h-screen flex flex-col items-center justify-center p-4 bg-slate-50">
            <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                <h1 className="text-xl font-bold text-red-600 mb-2">Form Error</h1>
                <p className="text-slate-600">{error}</p>
            </div>
        </div>
    )

    if (submitted) return (
        <div className="h-screen flex flex-col items-center justify-center p-4 bg-slate-50">
            <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Thank You!</h1>
                <p className="text-slate-600">Your information has been submitted successfully.</p>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <Toaster />
            <div className="max-w-xl mx-auto bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="px-8 py-6 border-b bg-slate-50">
                    <h1 className="text-2xl font-bold text-slate-900">{form.name}</h1>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {form.schema.map(field => {
                        // Render Section Header
                        if (field.type === 'header') {
                            return (
                                <h3 key={field.id} className="text-lg font-semibold text-slate-800 pt-4 border-b pb-2">
                                    {field.label}
                                </h3>
                            )
                        }

                        // Render Fields
                        return (
                            <div key={field.id} className="space-y-2">
                                <Label className="text-base font-medium text-slate-700">
                                    {field.label} {field.required && <span className="text-red-500">*</span>}
                                </Label>

                                {field.type === 'textarea' ? (
                                    <Textarea
                                        name={field.id}
                                        placeholder={field.placeholder}
                                        required={field.required}
                                        className="min-h-[100px]"
                                    />
                                ) : field.type === 'checkbox' ? (
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id={field.id} name={field.id} required={field.required} />
                                        <label
                                            htmlFor={field.id}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            {field.placeholder || "Yes"}
                                        </label>
                                    </div>
                                ) : field.type === 'select' ? (
                                    <Select name={field.id} required={field.required}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={field.placeholder || "Select an option"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {field.options?.map((opt, i) => (
                                                <SelectItem key={i} value={opt}>{opt}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : field.type === 'radio' ? (
                                    <RadioGroup name={field.id} required={field.required}>
                                        {field.options?.map((opt, i) => (
                                            <div key={i} className="flex items-center space-x-2">
                                                <RadioGroupItem value={opt} id={`${field.id}-${i}`} />
                                                <Label htmlFor={`${field.id}-${i}`} className="font-normal">{opt}</Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                ) : (
                                    <Input
                                        type={field.type}
                                        name={field.id}
                                        placeholder={field.placeholder}
                                        required={field.required}
                                    />
                                )}
                            </div>
                        )
                    })}

                    <div className="pt-4">
                        <Button type="submit" className="w-full h-11 text-base" disabled={submitting}>
                            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Submit
                        </Button>
                    </div>
                </form>

                <div className="px-8 py-4 bg-slate-50 border-t text-center">
                    <p className="text-xs text-slate-400">Powered by Quinite Vantage</p>
                </div>
            </div>
        </div>
    )
}
