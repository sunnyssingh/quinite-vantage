export const COUNTRIES = [
    { name: 'India', code: 'IN', currency: 'INR', symbol: '₹' },
    { name: 'Australia', code: 'AU', currency: 'AUD', symbol: 'A$' },
    { name: 'Belgium', code: 'BE', currency: 'EUR', symbol: '€' },
    { name: 'Brazil', code: 'BR', currency: 'BRL', symbol: 'R$' },
    { name: 'Canada', code: 'CA', currency: 'CAD', symbol: 'C$' },
    { name: 'China', code: 'CN', currency: 'CNY', symbol: '¥' },
    { name: 'Denmark', code: 'DK', currency: 'DKK', symbol: 'kr' },
    { name: 'France', code: 'FR', currency: 'EUR', symbol: '€' },
    { name: 'Germany', code: 'DE', currency: 'EUR', symbol: '€' },
    { name: 'Indonesia', code: 'ID', currency: 'IDR', symbol: 'Rp' },
    { name: 'Ireland', code: 'IE', currency: 'EUR', symbol: '€' },
    { name: 'Italy', code: 'IT', currency: 'EUR', symbol: '€' },
    { name: 'Japan', code: 'JP', currency: 'JPY', symbol: '¥' },
    { name: 'Netherlands', code: 'NL', currency: 'EUR', symbol: '€' },
    { name: 'Nigeria', code: 'NG', currency: 'NGN', symbol: '₦' },
    { name: 'Philippines', code: 'PH', currency: 'PHP', symbol: '₱' },
    { name: 'Poland', code: 'PL', currency: 'PLN', symbol: 'zł' },
    { name: 'Saudi Arabia', code: 'SA', currency: 'SAR', symbol: '﷼' },
    { name: 'Singapore', code: 'SG', currency: 'SGD', symbol: 'S$' },
    { name: 'South Korea', code: 'KR', currency: 'KRW', symbol: '₩' },
    { name: 'Spain', code: 'ES', currency: 'EUR', symbol: '€' },
    { name: 'Sweden', code: 'SE', currency: 'SEK', symbol: 'kr' },
    { name: 'Switzerland', code: 'CH', currency: 'CHF', symbol: 'CHF' },
    { name: 'United Arab Emirates', code: 'AE', currency: 'AED', symbol: 'د.إ' },
    { name: 'United Kingdom', code: 'GB', currency: 'GBP', symbol: '£' },
    { name: 'United States', code: 'US', currency: 'USD', symbol: '$' },
    { name: 'Vietnam', code: 'VN', currency: 'VND', symbol: '₫' }
]

export const getCurrencySymbol = (currencyCode) => {
    const country = COUNTRIES.find(c => c.currency === currencyCode)
    return country ? country.symbol : '$'
}
