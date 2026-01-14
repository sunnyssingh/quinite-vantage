export default function BillingPage() {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Billing & Subscription</h1>

            {/* Current Plan */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Plan</h2>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-2xl font-bold text-gray-900">Free Plan</p>
                        <p className="text-gray-600">$0/month</p>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Upgrade Plan
                    </button>
                </div>
            </div>

            {/* Available Plans */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow p-6 border-2 border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Free</h3>
                    <p className="text-3xl font-bold text-gray-900 mb-4">$0<span className="text-sm text-gray-600">/month</span></p>
                    <ul className="space-y-2 mb-6">
                        <li className="text-gray-600">✓ Up to 100 leads</li>
                        <li className="text-gray-600">✓ 5 users</li>
                        <li className="text-gray-600">✓ Basic analytics</li>
                    </ul>
                    <button className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">
                        Current Plan
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-2 border-blue-500">
                    <div className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded mb-2 inline-block">
                        POPULAR
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Pro</h3>
                    <p className="text-3xl font-bold text-gray-900 mb-4">$49<span className="text-sm text-gray-600">/month</span></p>
                    <ul className="space-y-2 mb-6">
                        <li className="text-gray-600">✓ Unlimited leads</li>
                        <li className="text-gray-600">✓ 25 users</li>
                        <li className="text-gray-600">✓ Advanced analytics</li>
                        <li className="text-gray-600">✓ Priority support</li>
                    </ul>
                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Upgrade to Pro
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-2 border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Enterprise</h3>
                    <p className="text-3xl font-bold text-gray-900 mb-4">Custom</p>
                    <ul className="space-y-2 mb-6">
                        <li className="text-gray-600">✓ Everything in Pro</li>
                        <li className="text-gray-600">✓ Unlimited users</li>
                        <li className="text-gray-600">✓ Custom integrations</li>
                        <li className="text-gray-600">✓ Dedicated support</li>
                    </ul>
                    <button className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900">
                        Contact Sales
                    </button>
                </div>
            </div>

            {/* Billing History */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Billing History</h2>
                <p className="text-gray-600">No billing history available</p>
            </div>
        </div>
    )
}
