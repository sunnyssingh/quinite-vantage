import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, UserPlus, Upload, Database, LayoutTemplate, Megaphone, Smartphone, Building2 } from 'lucide-react'
import LeadForm from './LeadForm'
import { toast } from 'react-hot-toast'
import FormBuilder from './FormBuilder' // [NEW] moved up

export default function LeadSourceDialog({ open, onOpenChange, projectId, projects }) {
    const [activeTab, setActiveTab] = useState('manual')

    const connectorCards = [
        { id: 'mb', name: 'MagicBricks', icon: BuildingIcon, color: 'text-red-600', bg: 'bg-red-50' },
        { id: '99', name: '99Acres', icon: BuildingIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
        { id: 'meta', name: 'Meta Ads', icon: Megaphone, color: 'text-blue-500', bg: 'bg-blue-50' },
        { id: 'google', name: 'Google Ads', icon: SearchIcon, color: 'text-green-600', bg: 'bg-green-50' },
    ]

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
                <div className="p-6 border-b flex items-center justify-between">
                    <div>
                        <DialogTitle className="text-xl">Add New Leads</DialogTitle>
                        <DialogDescription>Choose a method to bring leads into your pipeline.</DialogDescription>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                    <div className="px-6 pt-4">
                        <TabsList className="grid grid-cols-4 w-full max-w-2xl bg-slate-100">
                            <TabsTrigger value="manual" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">
                                <UserPlus className="w-4 h-4 mr-2" /> Manual
                            </TabsTrigger>
                            <TabsTrigger value="builder" className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm">
                                <LayoutTemplate className="w-4 h-4 mr-2" /> Form Builder
                            </TabsTrigger>
                            <TabsTrigger value="import" className="data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:shadow-sm">
                                <Upload className="w-4 h-4 mr-2" /> CSV Import
                            </TabsTrigger>
                            <TabsTrigger value="connect" className="data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm">
                                <Database className="w-4 h-4 mr-2" /> Integrations
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                        <TabsContent value="manual" className="mt-0 h-full">
                            <Card className="max-w-2xl mx-auto border-0 shadow-none bg-transparent">
                                <CardHeader className="px-0 pt-0">
                                    <CardTitle>Single Lead Entry</CardTitle>
                                    <CardDescription>Manually enter lead details for immediate follow-up.</CardDescription>
                                </CardHeader>
                                <CardContent className="px-0">
                                    <LeadForm
                                        projects={projects}
                                        initialData={{ project_id: projectId }}
                                        onSubmit={async (data) => {
                                            try {
                                                const res = await fetch('/api/leads', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify(data)
                                                })
                                                if (res.ok) {
                                                    toast.success("Lead added!")
                                                    onOpenChange(false)
                                                } else {
                                                    toast.error("Failed")
                                                }
                                            } catch (e) {
                                                console.error(e)
                                            }
                                        }}
                                        onCancel={() => onOpenChange(false)}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="builder" className="mt-0 h-full">
                            <FormBuilder />
                        </TabsContent>

                        <TabsContent value="import" className="mt-0 h-full">
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 border-2 border-dashed border-slate-200 rounded-xl bg-white">
                                <div className="p-4 bg-green-50 rounded-full">
                                    <Upload className="w-12 h-12 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900">Upload CSV</h3>
                                    <p className="text-slate-500">Drag and drop your spreadsheet here or browse files.</p>
                                </div>
                                <Button variant="outline">Browse Files</Button>
                            </div>
                        </TabsContent>

                        <TabsContent value="connect" className="mt-0 h-full">
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                                {connectorCards.map(c => (
                                    <Card key={c.id} className="cursor-pointer hover:border-blue-500 transition-all group">
                                        <CardHeader>
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${c.bg}`}>
                                                <c.icon className={`w-6 h-6 ${c.color}`} />
                                            </div>
                                            <CardTitle className="text-base">{c.name}</CardTitle>
                                            <CardDescription>Auto-sync leads</CardDescription>
                                        </CardHeader>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}

function BuildingIcon(props) {
    return <Building2 {...props} />
}
function SearchIcon(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
        </svg>
    )
}
