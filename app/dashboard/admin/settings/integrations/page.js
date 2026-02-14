"use client"

import { useState, useEffect } from "react"
import { Copy, Check, Upload, AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "react-hot-toast"
import {
    MagicBricksIcon,
    AcresIcon,
    MetaIcon,
    GoogleAdsIcon,
    FacebookIcon,
    GoogleFormsIcon,
    TypeformIcon,
    ZapierIcon,
    WebhookIcon,
    LinkedInIcon,
    WhatsAppIcon,
    ApiIcon
} from "@/components/icons/BrandIcons"

const INTEGRATIONS = [
    {
        id: "magicbricks",
        name: "MagicBricks",
        description: "Receive leads instantly from MagicBricks property listings.",
        icon: MagicBricksIcon,
        color: "bg-red-50 text-red-600",
        status: "available",
        docs: {
            step1: "Contact your MagicBricks Account Manager.",
            step2: "Ask them to enable 'Real-time Webhook Integration'.",
            step3: "Provide the Webhook URL below.",
            payload: `// Expected JSON format (Standard)
{
  "mobile": "9876543210",
  "cust_name": "John Doe",
  "project_name": "Skyline Towers"
}`
        }
    },
    {
        id: "99acres",
        name: "99Acres",
        description: "Sync potential buyer leads from 99Acres automatically.",
        icon: AcresIcon,
        color: "bg-blue-50 text-blue-600",
        status: "available",
        docs: {
            step1: "Login to your 99Acres Advertiser Dashboard.",
            step2: "Navigate to 'Manage Responses' -> 'Settings' -> 'Webhook'.",
            step3: "Paste the URL below.",
            payload: `// Expected JSON format
{
  "contact_details": { 
      "mobile": "9876543210" 
  },
  "name": "Jane Doe"
}`
        }
    },
    {
        id: "meta-ads",
        name: "Meta Ads",
        description: "Auto-sync leads from Meta advertising campaigns.",
        icon: MetaIcon,
        color: "bg-slate-50 text-slate-600",
        status: "coming-soon"
    },
    {
        id: "google-ads",
        name: "Google Ads",
        description: "Auto-sync leads from Google advertising campaigns.",
        icon: GoogleAdsIcon,
        color: "bg-yellow-50 text-yellow-600",
        status: "coming-soon"
    },
    {
        id: "facebook",
        name: "Facebook Leads",
        description: "Connect Meta Lead Forms directly to your dashboard.",
        icon: FacebookIcon,
        color: "bg-indigo-50 text-indigo-600",
        status: "available",
        docs: {
            step1: "Go to Meta Business Suite -> Leads Setup.",
            step2: "Choose 'Webhooks' integration.",
            step3: "Add the URL and Secret Key below.",
            payload: `// Facebook sends complex nested JSON.
// We automatically parse 'field_data' 
// to extract full_name, phone_number, etc.`
        }
    },
    {
        id: "google-forms",
        name: "Google Forms",
        description: "Capture leads from Google Forms submissions.",
        icon: GoogleFormsIcon,
        color: "bg-purple-50 text-purple-600",
        status: "coming-soon"
    },
    {
        id: "typeform",
        name: "Typeform",
        description: "Sync form responses from Typeform automatically.",
        icon: TypeformIcon,
        color: "bg-stone-50 text-stone-600",
        status: "coming-soon"
    },
    {
        id: "zapier",
        name: "Zapier",
        description: "Connect 5000+ apps through Zapier automation.",
        icon: ZapierIcon,
        color: "bg-orange-50 text-orange-600",
        status: "coming-soon"
    },
    {
        id: "webhooks",
        name: "Webhooks",
        description: "Create custom webhook integrations for any platform.",
        icon: WebhookIcon,
        color: "bg-teal-50 text-teal-600",
        status: "coming-soon"
    },
    {
        id: "linkedin",
        name: "LinkedIn Lead Gen",
        description: "Sync leads from LinkedIn advertising campaigns.",
        icon: LinkedInIcon,
        color: "bg-sky-50 text-sky-700",
        status: "coming-soon"
    },
    {
        id: "whatsapp",
        name: "WhatsApp",
        description: "Capture leads from WhatsApp Business conversations.",
        icon: WhatsAppIcon,
        color: "bg-green-50 text-green-700",
        status: "coming-soon"
    },
    {
        id: "custom-api",
        name: "Custom API",
        description: "Build custom integrations using our REST API.",
        icon: ApiIcon,
        color: "bg-gray-50 text-gray-700",
        status: "coming-soon"
    }
]

export default function IntegrationsPage() {
    const [selectedIntegration, setSelectedIntegration] = useState(null)
    const [webhookUrl, setWebhookUrl] = useState("")
    const [copied, setCopied] = useState(false)
    const SECRET_KEY = "vantage-secret-key" // Ideally fetch from API

    useEffect(() => {
        if (typeof window !== "undefined") {
            setWebhookUrl(`${window.location.origin}/api/leads/ingest`)
        }
    }, [])

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        toast.success("Copied to clipboard!")
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="h-full bg-gray-50 overflow-y-auto">
            <div className="p-4 md:p-8 max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
                    <p className="text-gray-500 mt-2">Connect your lead sources and external tools to Vantage.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {INTEGRATIONS.map((tool) => (
                        <div key={tool.id} className="bg-white rounded-xl border hover:shadow-md transition-all p-6 flex flex-col">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`h-16 w-16 flex items-center justify-center rounded-xl border ${tool.color.replace('text-', 'border-').split(' ')[0]} bg-gray-50/50`}>
                                    <tool.icon className="h-10 w-10 object-contain" />
                                </div>
                                {tool.connected ? (
                                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold uppercase rounded-full tracking-wide">
                                        Active
                                    </span>
                                ) : tool.status === 'coming-soon' ? (
                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold uppercase rounded-full tracking-wide">
                                        Coming Soon
                                    </span>
                                ) : (
                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium uppercase rounded-full tracking-wide">
                                        Available
                                    </span>
                                )}
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 mb-2">{tool.name}</h3>
                            <p className="text-gray-600 text-sm mb-6 flex-grow">{tool.description}</p>

                            <Button
                                variant={tool.connected ? "outline" : "default"}
                                className="w-full"
                                disabled={tool.status === 'coming-soon'}
                                onClick={() => {
                                    if (tool.docs) setSelectedIntegration(tool)
                                    else toast.success(`${tool.name} is already configured via Environment Variables.`)
                                }}
                            >
                                {tool.status === 'coming-soon' ? 'Coming Soon' : (tool.connected ? "Configure" : "Connect")}
                            </Button>
                        </div>
                    ))}
                </div>

                {/* Configuration Modal */}
                <Dialog open={!!selectedIntegration} onOpenChange={() => setSelectedIntegration(null)}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                {selectedIntegration && (
                                    <selectedIntegration.icon className="h-8 w-8 object-contain" />
                                )}
                                Setup {selectedIntegration?.name}
                            </DialogTitle>
                            <DialogDescription>
                                Follow these steps to start receiving leads automatically.
                            </DialogDescription>
                        </DialogHeader>

                        {selectedIntegration && (
                            <div className="space-y-6 mt-4">
                                {/* Step 1: Instructions */}
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800 space-y-2">
                                    <p className="font-semibold flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4" /> Setup Instructions:
                                    </p>
                                    <ol className="list-decimal pl-5 space-y-1">
                                        <li>{selectedIntegration.docs.step1}</li>
                                        <li>{selectedIntegration.docs.step2}</li>
                                        <li>{selectedIntegration.docs.step3}</li>
                                    </ol>
                                </div>

                                {/* Step 2: Webhook URL */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Webhook Endpoint URL</label>
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 bg-gray-100 p-3 rounded-lg border text-sm font-mono text-gray-800 break-all">
                                            {webhookUrl}
                                        </code>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => handleCopy(webhookUrl)}
                                        >
                                            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>

                                {/* Step 3: Secret Key */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Secret Key / Token</label>
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 bg-gray-100 p-3 rounded-lg border text-sm font-mono text-gray-800">
                                            {SECRET_KEY}
                                        </code>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => handleCopy(SECRET_KEY)}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        Add this as a query parameter <code>?secret={SECRET_KEY}</code> or in the JSON body.
                                    </p>
                                </div>


                                {/* Step 4: JSON Payload Preview */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-2">Payload Configuration</label>
                                    <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                                        <pre className="text-xs text-green-400 font-mono">
                                            {selectedIntegration.docs.payload}
                                        </pre>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <Button onClick={() => setSelectedIntegration(null)}>Done</Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
                <div className="h-20"></div>
            </div>
        </div>
    )
}
