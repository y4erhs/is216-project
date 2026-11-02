// How the logged-in user appears in the sidebar and top bar
const API_URL = 'http://localhost:8000'

export function userName(user) {
    return user?.displayName || user?.fullName || user?.username || ''
}

export function userInitials(user) {
    return userName(user).trim().split(/\s+/).map(word => word[0]).slice(0, 2).join('').toUpperCase()
}

// The default image is a placeholder for "no picture", so it counts as none
export const DEFAULT_IMAGE = '/uploads/default.png'

export function userImageUrl(path) {
    if (!path || path === DEFAULT_IMAGE) return ''
    return path.startsWith('/') ? API_URL + path : path
}

export function userAvatarUrl(user) {
    return userImageUrl(user?.avatar)
}

// e.g. "Software Engineering · Y2". Older accounts store the year as 2, newer ones as "Year 2".
export function userSubtitle(user) {
    const course = (user?.major || user?.school || '').replace(/\s*\(.*\)$/, '')
    const year = String(user?.year ?? '').match(/\d+/)?.[0]
    return [course, year && `Y${year}`].filter(Boolean).join(' · ')
}
