export const formatCurrency = (amount, currency = 'INR', locale = 'en-IN') => {
    if (amount === null || amount === undefined || isNaN(amount)) return '0'

    const num = Number(amount)
    const symbol = getCurrencySymbol(currency, locale)

    // Special handling for Indian Numbering System (Lakhs/Crores) if locale is en-IN
    if (locale === 'en-IN') {
        if (num >= 10000000) { // 1 Crore
            return `${symbol}${(num / 10000000).toFixed(2)} Crores`
        }
        if (num >= 100000) { // 1 Lakh
            return `${symbol}${(num / 100000).toFixed(2)} Lacs`
        }
    } else {
        // Standard compact notation for other locales (K/M/B)
        if (num >= 1000000) {
            return new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: currency,
                notation: 'compact',
                maximumFractionDigits: 2
            }).format(num)
        }
    }

    // Standard formatting for smaller numbers
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        maximumFractionDigits: 0
    }).format(num)
}

export const getCurrencySymbol = (currency, locale = 'en-US') => {
    return (0).toLocaleString(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).replace(/\d/g, '').trim()
}
