export default function SettingsPage() {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <a
                    href="/dashboard/admin/settings/organization"
                    className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
                >
                    <div className="text-4xl mb-4">🏢</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Organization</h3>
                    <p className="text-gray-600">
                        Manage your organization details and preferences
                    </p>
                </a>

                <a
                    href="/dashboard/admin/settings/billing"
                    className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
                >
                    <div className="text-4xl mb-4">💳</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Billing</h3>
                    <p className="text-gray-600">
                        View plans, billing history, and payment methods
                    </p>
                </a>

                <a
                    href="/dashboard/admin/settings/integrations"
                    className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
                >
                    <div className="text-4xl mb-4">🔌</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Integrations</h3>
                    <p className="text-gray-600">
                        Connect with third-party services and tools
                    </p>
                </a>
            </div>
        </div>
    )
}
