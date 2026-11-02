// The interests a user can pick, which are also the only tags an event can have.
// Users and events store the id; the app shows the label.
// Keep the ids in sync with ALLOWED_TAGS in server/src/services/telegramParserService.js
export const INTERESTS = [
    { id: 'tech', label: 'Tech' },
    { id: 'arts', label: 'Arts' },
    { id: 'culture', label: 'Cultural Clubs' },
    { id: 'community-service', label: 'Community Service' },
    { id: 'sports-outdoors', label: 'Sports and Outdoors' },
    { id: 'career', label: 'Career' },
    { id: 'overseas', label: 'Overseas Activities' },
    { id: 'networking', label: 'Networking Event' },
    { id: 'workshops', label: 'Skills Upgrading Workshop' },
    { id: 'food', label: 'Food' },
    { id: 'wellness', label: 'Wellness' },
    { id: 'talks', label: 'Guest Lectures' }
]

// The colour of an interest's Discover tab and pill
const INTEREST_THEMES = {
    'tech': 'theme-green',
    'arts': 'theme-orange',
    'culture': 'theme-yellow',
    'community-service': 'theme-purple',
    'sports-outdoors': 'theme-red',
    'career': 'theme-purple',
    'overseas': 'theme-orange',
    'networking': 'theme-green',
    'workshops': 'theme-purple',
    'food': 'theme-red',
    'wellness': 'theme-green',
    'talks': 'theme-yellow'
}

// Each interest gets a Discover tab, and only this many fit
export const MAX_INTERESTS = 5

export function interestTheme(id) {
    return INTEREST_THEMES[id] || 'theme-grey'
}

export function interestLabel(id) {
    return INTERESTS.find(i => i.id === id)?.label || id
}
