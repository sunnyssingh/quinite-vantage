export const COUNTRIES = [
    { name: 'India', code: 'IN', currency: 'INR', symbol: '₹', locale: 'en-IN' },
    { name: 'Australia', code: 'AU', currency: 'AUD', symbol: 'A$', locale: 'en-AU' },
    { name: 'Belgium', code: 'BE', currency: 'EUR', symbol: '€', locale: 'nl-BE' },
    { name: 'Brazil', code: 'BR', currency: 'BRL', symbol: 'R$', locale: 'pt-BR' },
    { name: 'Canada', code: 'CA', currency: 'CAD', symbol: 'C$', locale: 'en-CA' },
    { name: 'China', code: 'CN', currency: 'CNY', symbol: '¥', locale: 'zh-CN' },
    { name: 'Denmark', code: 'DK', currency: 'DKK', symbol: 'kr', locale: 'da-DK' },
    { name: 'France', code: 'FR', currency: 'EUR', symbol: '€', locale: 'fr-FR' },
    { name: 'Germany', code: 'DE', currency: 'EUR', symbol: '€', locale: 'de-DE' },
    { name: 'Indonesia', code: 'ID', currency: 'IDR', symbol: 'Rp', locale: 'id-ID' },
    { name: 'Ireland', code: 'IE', currency: 'EUR', symbol: '€', locale: 'en-IE' },
    { name: 'Italy', code: 'IT', currency: 'EUR', symbol: '€', locale: 'it-IT' },
    { name: 'Japan', code: 'JP', currency: 'JPY', symbol: '¥', locale: 'ja-JP' },
    { name: 'Netherlands', code: 'NL', currency: 'EUR', symbol: '€', locale: 'nl-NL' },
    { name: 'Nigeria', code: 'NG', currency: 'NGN', symbol: '₦', locale: 'en-NG' },
    { name: 'Philippines', code: 'PH', currency: 'PHP', symbol: '₱', locale: 'en-PH' },
    { name: 'Poland', code: 'PL', currency: 'PLN', symbol: 'zł', locale: 'pl-PL' },
    { name: 'Saudi Arabia', code: 'SA', currency: 'SAR', symbol: '﷼', locale: 'ar-SA' },
    { name: 'Singapore', code: 'SG', currency: 'SGD', symbol: 'S$', locale: 'en-SG' },
    { name: 'South Korea', code: 'KR', currency: 'KRW', symbol: '₩', locale: 'ko-KR' },
    { name: 'Spain', code: 'ES', currency: 'EUR', symbol: '€', locale: 'es-ES' },
    { name: 'Sweden', code: 'SE', currency: 'SEK', symbol: 'kr', locale: 'sv-SE' },
    { name: 'Switzerland', code: 'CH', currency: 'CHF', symbol: 'CHF', locale: 'de-CH' },
    { name: 'United Arab Emirates', code: 'AE', currency: 'AED', symbol: 'د.إ', locale: 'ar-AE' },
    { name: 'United Kingdom', code: 'GB', currency: 'GBP', symbol: '£', locale: 'en-GB' },
    { name: 'United States', code: 'US', currency: 'USD', symbol: '$', locale: 'en-US' },
    { name: 'Vietnam', code: 'VN', currency: 'VND', symbol: '₫', locale: 'vi-VN' }
]

export const getCurrencySymbol = (currencyCode) => {
    const country = COUNTRIES.find(c => c.currency === currencyCode)
    return country ? country.symbol : '$'
}
