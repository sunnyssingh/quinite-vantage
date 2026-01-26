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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { FileText, UserPlus, Upload, Database, LayoutTemplate, Megaphone, Smartphone, Building2 } from 'lucide-react'
import LeadForm from './LeadForm'
import { toast } from 'react-hot-toast'
import FormBuilder from './FormBuilder' // [NEW] moved up

export default function LeadSourceDialog({ open, onOpenChange, projectId, projects }) {
    const [activeTab, setActiveTab] = useState('manual')
    const [importProjectId, setImportProjectId] = useState(projectId || 'none')
    const [previewData, setPreviewData] = useState(null) // [NEW] Preview State

    const connectorCards = [
        { id: 'mb', name: 'MagicBricks', icon: BuildingIcon, color: 'text-foreground', bg: 'bg-muted/50' },
        { id: '99', name: '99Acres', icon: BuildingIcon, color: 'text-foreground', bg: 'bg-muted/50' },
        { id: 'meta', name: 'Meta Ads', icon: Megaphone, color: 'text-foreground', bg: 'bg-muted/50' },
        { id: 'google', name: 'Google Ads', icon: SearchIcon, color: 'text-foreground', bg: 'bg-muted/50' },
    ]

    const downloadSampleCSV = () => {
        const headers = ['Name', 'Phone', 'Email', 'Project', 'Notes']
        const rows = [
            ['John Doe', '9876543210', 'john@example.com', 'Project A', 'Interested in 2BHK'],
            ['Jane Smith', '+91 9999988888', 'jane@test.com', 'Project B', 'Budget 50L'],
            ['Bob Wilson', '07777766666', 'bob@demo.com', 'Project A', 'Call after 6 PM']
        ]
        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "leads_sample.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    const handleFileUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = async (event) => {
            const text = event.target.result
            const rows = text.split('\n').map(row => row.split(','))
            const headers = rows[0].map(h => h.trim().toLowerCase())

            const leads = rows.slice(1).filter(r => r.length > 1).map(row => {
                const data = {}
                headers.forEach((h, i) => {
                    data[h] = row[i]?.trim()
                })

                // Try to resolve project name from CSV to ID
                let pid = null
                const pNameLike = Object.keys(data).find(k => k.includes('project'))
                if (pNameLike && data[pNameLike]) {
                    const found = projects.find(p => p.name.toLowerCase() === data[pNameLike].toLowerCase())
                    if (found) pid = found.id
                }

                // If Import context project is set (and not none), it overrides/defaults
                if (importProjectId && importProjectId !== 'none') {
                    pid = importProjectId
                }

                if (pid) data.project_id = pid

                return data
            })

            setPreviewData(leads)
            e.target.value = null // Reset input
        }
        reader.readAsText(file)
    }

    const handlePreviewUpdate = (index, field, value) => {
        const newData = [...previewData]
        newData[index] = { ...newData[index], [field]: value }
        setPreviewData(newData)
    }

    const handleBulkProjectApply = (pid) => {
        setImportProjectId(pid)
        if (pid === 'none') return

        const newData = previewData.map(row => ({
            ...row,
            project_id: pid
        }))
        setPreviewData(newData)
    }

    const handleFinalImport = async () => {
        try {
            const res = await fetch('/api/leads/ingest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source: 'csv_manual',
                    data: previewData,
                    map_project_id: null // We mapped in preview already
                })
            })

            const result = await res.json()
            if (result.success) {
                toast.success(`Imported ${result.summary.processed} leads!`)
                onOpenChange(false)
                setPreviewData(null)
            } else {
                toast.error(`Import failed: ${result.message}`)
            }
        } catch (err) {
            toast.error("Upload failed")
            console.error(err)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0 overflow-hidden sm:rounded-xl">
                <div className="p-6 border-b border-border flex items-center justify-between bg-background">
                    <div>
                        <DialogTitle className="text-lg font-semibold tracking-tight">Add New Leads</DialogTitle>
                        <DialogDescription className="text-muted-foreground mt-1">Choose a method to bring leads into your pipeline.</DialogDescription>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                    <div className="px-6 pt-4 bg-background">
                        <TabsList className="grid grid-cols-4 w-full max-w-2xl bg-muted/50 p-1">
                            <TabsTrigger value="manual" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-xs">
                                <UserPlus className="w-3.5 h-3.5 mr-2" /> Manual
                            </TabsTrigger>
                            <TabsTrigger value="builder" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-xs">
                                <LayoutTemplate className="w-3.5 h-3.5 mr-2" /> Form Builder
                            </TabsTrigger>
                            <TabsTrigger value="import" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-xs">
                                <Upload className="w-3.5 h-3.5 mr-2" /> CSV Import
                            </TabsTrigger>
                            <TabsTrigger value="connect" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-xs">
                                <Database className="w-3.5 h-3.5 mr-2" /> Integrations
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 bg-muted/10">
                        <TabsContent value="manual" className="mt-0 h-full">
                            <Card className="max-w-2xl mx-auto border-0 shadow-none bg-transparent">
                                <CardHeader className="px-0 pt-0">
                                    <CardTitle className="text-base font-medium">Single Lead Entry</CardTitle>
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

                        <TabsContent value="import" className="mt-0 h-full flex flex-col min-h-0">
                            {!previewData ? (
                                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 m-1">
                                    <div className="p-4 bg-white rounded-full shadow-sm">
                                        <Upload className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-semibold text-slate-900">Upload CSV File</h3>
                                        <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">
                                            Drag and drop your spreadsheet here or browse to upload.
                                        </p>
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <Button variant="outline" onClick={() => document.getElementById('csv-upload').click()}>
                                            Select File
                                        </Button>
                                        <Button variant="ghost" className="text-slate-500" onClick={downloadSampleCSV}>
                                            Download Template
                                        </Button>
                                    </div>
                                    <input
                                        id="csv-upload"
                                        type="file"
                                        accept=".csv"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col h-full gap-4">
                                    {/* Preview Header / Controls */}
                                    <div className="flex items-center justify-between bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                                        <div className="flex items-center gap-4">
                                            <div className="space-y-1">
                                                <Label className="text-xs font-semibold text-yellow-800">Bulk Assign Project</Label>
                                                <div className="flex items-center gap-2">
                                                    <Select
                                                        value={importProjectId}
                                                        onValueChange={handleBulkProjectApply}
                                                    >
                                                        <SelectTrigger className="h-8 w-[200px] bg-white border-yellow-200">
                                                            <SelectValue placeholder="Select Project for All" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none">Mixed / From CSV</SelectItem>
                                                            {projects.map(p => (
                                                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="h-8 w-px bg-yellow-200 mx-2" />
                                            <div className="text-sm text-yellow-700">
                                                <span className="font-bold">{previewData.length}</span> leads found
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => setPreviewData(null)}>
                                                Cancel
                                            </Button>
                                            <Button size="sm" onClick={handleFinalImport}>
                                                Import Leads
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Data Table */}
                                    <div className="flex-1 border rounded-lg overflow-hidden bg-white shadow-sm flex flex-col">
                                        <div className="overflow-auto flex-1">
                                            <table className="w-full text-sm text-left">
                                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 z-10 shadow-sm">
                                                    <tr>
                                                        <th className="px-4 py-3 font-medium">Name</th>
                                                        <th className="px-4 py-3 font-medium">Phone</th>
                                                        <th className="px-4 py-3 font-medium">Email</th>
                                                        <th className="px-4 py-3 font-medium w-[250px]">Project Assigment</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {previewData.map((row, i) => (
                                                        <tr key={i} className="hover:bg-slate-50/50">
                                                            <td className="px-4 py-2 font-medium text-slate-700">{row.name || '-'}</td>
                                                            <td className="px-4 py-2 text-slate-600 font-mono">{row.phone || <span className="text-red-500 font-bold">Missing</span>}</td>
                                                            <td className="px-4 py-2 text-slate-600">{row.email || '-'}</td>
                                                            <td className="px-4 py-2">
                                                                <Select
                                                                    value={row.project_id || 'none'}
                                                                    onValueChange={(val) => handlePreviewUpdate(i, 'project_id', val === 'none' ? null : val)}
                                                                >
                                                                    <SelectTrigger className={`h-7 text-xs w-full ${!row.project_id ? 'border-red-300 bg-red-50 text-red-600' : ''}`}>
                                                                        <SelectValue placeholder="Select Project" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="none" className="text-muted-foreground">No Project</SelectItem>
                                                                        {projects.map(p => (
                                                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="connect" className="mt-0 h-full">
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                                {connectorCards.map(c => (
                                    <Card key={c.id} className="cursor-pointer hover:border-primary transition-all group border-border bg-card shadow-sm">
                                        <CardHeader className="p-4">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${c.bg}`}>
                                                <c.icon className={`w-5 h-5 ${c.color}`} />
                                            </div>
                                            <CardTitle className="text-sm font-medium">{c.name}</CardTitle>
                                            <CardDescription className="text-xs">Auto-sync leads</CardDescription>
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
