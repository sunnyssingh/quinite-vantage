import { format, parseISO, isToday, isTomorrow, isPast, differenceInDays } from 'date-fns'

function toDate(value) {
    if (!value) return null
    if (value instanceof Date) return value
    try { return parseISO(value) } catch { return null }
}

// "25 Apr 2026, 2:30 PM"
export function formatIndianDateTime(value) {
    const d = toDate(value)
    if (!d) return ''
    return format(d, 'd MMM yyyy, h:mm a')
}

// "25 Apr 2026"
export function formatIndianDate(value) {
    const d = toDate(value)
    if (!d) return ''
    return format(d, 'd MMM yyyy')
}

// "2:30 PM"
export function formatIndianTime(value) {
    const d = toDate(value)
    if (!d) return ''
    return format(d, 'h:mm a')
}

// Smart relative label for task due dates: "Overdue · 3d", "Today · 2:30 PM", "Tomorrow", "25 Apr"
export function formatTaskDueLabel(due_date, due_time) {
    if (!due_date) return null
    const dateStr = due_time ? `${due_date.split('T')[0]}T${due_time}` : due_date
    const d = toDate(dateStr)
    if (!d) return null

    if (isPast(d) && !isToday(d)) {
        const days = differenceInDays(new Date(), d)
        return { label: days === 1 ? '1d overdue' : `${days}d overdue`, variant: 'overdue' }
    }
    if (isToday(d)) {
        return { label: due_time ? format(d, 'h:mm a') : 'Today', variant: 'today' }
    }
    if (isTomorrow(d)) {
        return { label: due_time ? `Tomorrow · ${format(d, 'h:mm a')}` : 'Tomorrow', variant: 'tomorrow' }
    }
    const days = differenceInDays(d, new Date())
    if (days <= 7) {
        return { label: due_time ? format(d, 'EEE · h:mm a') : format(d, 'EEE, d MMM'), variant: 'soon' }
    }
    return { label: due_time ? format(d, 'd MMM · h:mm a') : format(d, 'd MMM yyyy'), variant: 'future' }
}
