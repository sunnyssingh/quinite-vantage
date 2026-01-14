export default function IntegrationsPage() {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Integrations</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Plivo Integration */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Plivo</h3>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                            Connected
                        </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                        Voice and SMS communication platform
                    </p>
                    <button className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                        Configure
                    </button>
                </div>

                {/* OpenAI Integration */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">OpenAI</h3>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                            Connected
                        </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                        AI-powered voice agent and analytics
                    </p>
                    <button className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                        Configure
                    </button>
                </div>

                {/* Stripe Integration */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Stripe</h3>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded">
                            Not Connected
                        </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                        Payment processing and billing
                    </p>
                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Connect
                    </button>
                </div>

                {/* Zapier Integration */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Zapier</h3>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded">
                            Not Connected
                        </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                        Connect with 5000+ apps
                    </p>
                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Connect
                    </button>
                </div>

                {/* Slack Integration */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Slack</h3>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded">
                            Not Connected
                        </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                        Team notifications and alerts
                    </p>
                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Connect
                    </button>
                </div>

                {/* Google Calendar */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Google Calendar</h3>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded">
                            Not Connected
                        </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                        Sync meetings and appointments
                    </p>
                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Connect
                    </button>
                </div>
            </div>
        </div>
    )
}
