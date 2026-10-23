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

export function useNotifications() {
  const items = ref([])
  const unreadCount = ref(0)
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
      items.value = data.items || []
      unreadCount.value = data.unreadCount || 0
    } finally {
      loading.value = false
    }
  }

  async function markRead(item) {
    if (item.isRead) return
    await request(`/${item._id}/read`, { method: 'PATCH' })
    item.isRead = true
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  }

  async function markAllRead() {
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