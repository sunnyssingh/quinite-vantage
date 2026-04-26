export function formatRelativeTime(dateString) {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHr  = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHr  / 24)
    const diffMon = Math.floor(diffDay / 30)
    const diffYr  = Math.floor(diffMon / 12)

    if (diffSec < 60)  return 'just now'
    if (diffMin < 60)  return `${diffMin}m ago`
    if (diffHr  < 24)  return `${diffHr}h ago`
    if (diffDay < 30)  return `${diffDay}d ago`
    if (diffMon < 12)  return `${diffMon}mo ago`
    return `${diffYr}y ago`
}

export function formatDateTime(dateString) {
    if (!dateString) return ''
    return new Date(dateString).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })
}

export function formatDate(dateString) {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
    })
}
