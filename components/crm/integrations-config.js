
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

export const INTEGRATIONS = [
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
