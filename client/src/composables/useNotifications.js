import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const API = '/api/notifications'

async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  if (!res.ok) throw new Error(`Notifications ${res.status}`)
  return res.json()
}

const TYPE_META = {
  lobby_invite: { label: 'Lobby invite', icon: 'bi-envelope' },
  lobby_joined_via_link: { label: 'Lobby', icon: 'bi-link-45deg' },
  lobby_member_responded: { label: 'Lobby reply', icon: 'bi-chat-dots' },
  lobby_event_pitched: { label: 'Event pitched', icon: 'bi-megaphone' },
  group_register: { label: 'Registered', icon: 'bi-check2-circle' },
  lobby_left_out: { label: 'Missed signup', icon: 'bi-exclamation-circle' },
  lobby_plan_another: { label: 'Lobby', icon: 'bi-arrow-repeat' },
  lobby_removed: { label: 'Lobby', icon: 'bi-person-dash' },
  lobby_deleted: { label: 'Lobby', icon: 'bi-trash' },
  event_reminder: { label: 'Reminder', icon: 'bi-alarm' },
  upcoming_event: { label: 'Upcoming', icon: 'bi-calendar-event' },
  group_free_slot: { label: 'Free time', icon: 'bi-clock' },
  group_recommendation: { label: 'For your group', icon: 'bi-stars' },
  rsvp_update: { label: 'RSVP', icon: 'bi-bookmark-check' },
}

// 1. ADD DEMO DATA HERE (Fallback for when backend is offline or empty)
const DEMO_ITEMS = [
  {
    _id: 'demo-1',
    title: 'Harshitha invited you to a Lobby',
    message: 'Join the Study Buddies group.',
    type: 'lobby_invite',
    isRead: false,
    createdAt: new Date().toISOString(),
    lobbyId: 'study-buddies-123'
  },
  {
    _id: 'demo-2',
    title: 'Event Reminder',
    message: 'Quarterly sync starts in 30 minutes.',
    type: 'event_reminder',
    isRead: true,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    eventId:'quarterly-sync-456'
  },
]

export function useNotifications() {
  // Pre-fill with DEMO_ITEMS so it shows up instantly during your demo
  const items = ref(DEMO_ITEMS)
  const unreadCount = ref(DEMO_ITEMS.filter(i => !i.isRead).length)
  const loading = ref(false)
  const open = ref(false)

  const hasUnread = computed(() => unreadCount.value > 0)

  function timeAgo(date) {
    const ms = Date.now() - new Date(date).getTime()
    const mins = Math.floor(ms / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
  }

  function meta(type) {
    return TYPE_META[type] || { label: 'Update', icon: 'bi-bell' }
  }

  async function load() {
    loading.value = true
    try {
      const data = await request('?limit=15')
      // If backend returns items, use them. Otherwise fallback to demo items.
      items.value = data.items?.length ? data.items : DEMO_ITEMS
      unreadCount.value = data.unreadCount ?? DEMO_ITEMS.filter(i => !i.isRead).length
    } catch (err) {
      // If backend is not connected yet, catch the error and keep showing demo items gracefully
      console.warn('Backend not connected, using demo notifications:', err.message)
      items.value = DEMO_ITEMS
      unreadCount.value = DEMO_ITEMS.filter(i => !i.isRead).length
    } finally {
      loading.value = false
    }
  }

  async function markRead(item) {
    if (item.isRead) return
    // If it's a demo item, just update locally so it doesn't throw a fetch error
    if (item._id.startsWith('demo-')) {
      item.isRead = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
      return
    }

    await request(`/${item._id}/read`, { method: 'PATCH' })
    item.isRead = true
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  }

  async function markAllRead() {
    // If they are demo items, just update locally
    if (items.value.some(i => i._id.startsWith('demo-'))) {
      items.value.forEach((n) => { n.isRead = true })
      unreadCount.value = 0
      return
    }

    await request('/read-all', { method: 'PATCH' })
    items.value.forEach((n) => { n.isRead = true })
    unreadCount.value = 0
  }

  function toggle() {
    open.value = !open.value
    if (open.value) load()
  }

  function close() {
    open.value = false
  }

  let poll
  onMounted(() => {
    load()
    poll = setInterval(load, 30000)
  })
  onBeforeUnmount(() => clearInterval(poll))

  return {
    items, unreadCount, hasUnread, loading, open,
    timeAgo, meta, load, markRead, markAllRead, toggle, close,
  }
}