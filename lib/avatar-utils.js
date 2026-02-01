/**
 * Avatar utility functions
 * Provides consistent avatar assignment across the application
 */

const AVATAR_STYLES = [
    '/assets/avatar/Male/avatar-male-1.svg',
    '/assets/avatar/Male/avatar-male-2.svg',
    '/assets/avatar/Male/avatar-male-3.svg',
    '/assets/avatar/Male/avatar-male-4.svg',
    '/assets/avatar/Male/avatar-male-5.svg',
    '/assets/avatar/Female/avatar-female-1.svg',
    '/assets/avatar/Female/avatar-female-2.svg',
    '/assets/avatar/Female/avatar-female-3.svg',
    '/assets/avatar/Female/avatar-female-4.svg',
    '/assets/avatar/Female/avatar-female-5.svg'
]

/**
 * Get a consistent default avatar based on a seed string
 * @param {string} seed - Unique identifier (e.g., user ID, email, or name)
 * @returns {string} Avatar URL
 */
export function getDefaultAvatar(seed = '') {
    if (!seed) {
        // Return random avatar if no seed provided
        return AVATAR_STYLES[Math.floor(Math.random() * AVATAR_STYLES.length)]
    }

    // Use seed to consistently pick the same avatar for the same seed
    const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const index = hash % AVATAR_STYLES.length
    return AVATAR_STYLES[index]
}

/**
 * Get all available avatar options
 * @returns {string[]} Array of avatar URLs
 */
export function getAllAvatars() {
    return [...AVATAR_STYLES]
}
