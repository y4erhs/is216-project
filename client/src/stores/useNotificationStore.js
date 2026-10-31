import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000

const TYPE_META = {
  upcoming_event: { label: 'Upcoming', icon: 'bi-calendar-event' },
  event_reminder: { label: 'Reminder', icon: 'bi-alarm' },
  lobby_invite: { label: 'Lobby invite', icon: 'bi-envelope' },
  lobby_joined_via_link: { label: 'Lobby', icon: 'bi-link-45deg' },
  lobby_member_responded: { label: 'Lobby reply', icon: 'bi-chat-dots' },
  lobby_event_pitched: { label: 'Event pitched', icon: 'bi-megaphone' },
  lobby_status: { label: 'Lobby Status', icon: 'bi-info-circle' },
  group_register: { label: 'Registered', icon: 'bi-check2-circle' },
  lobby_left_out: { label: 'Missed signup', icon: 'bi-exclamation-circle' },
  lobby_plan_another: { label: 'Lobby', icon: 'bi-arrow-repeat' },
  lobby_removed: { label: 'Lobby', icon: 'bi-person-dash' },
  lobby_deleted: { label: 'Lobby', icon: 'bi-trash' },
  group_free_slot: { label: 'Free time', icon: 'bi-clock' },
  group_recommendation: { label: 'For your group', icon: 'bi-stars' },
  rsvp_update: { label: 'RSVP', icon: 'bi-bookmark-check' },
  friend_request: { label: 'Friend Request', icon: 'bi-person-plus' },
}

const DEMO_ITEMS = [
  {
    _id: 'demo-1',
    title: 'Lobby invitation',
    message: 'Harshitha invited you to Study Buddies. Accept or decline to confirm.',
    type: 'lobby_invite',
    isRead: false,
    createdAt: new Date().toISOString(),
    lobbyId: { _id: 'study-buddies-123', name: 'Study Buddies' }
  },
  {
    _id: 'demo-2',
    title: 'Reminder: Quarterly sync',
    message: 'Quarterly sync starts soon.',
    type: 'event_reminder',
    isRead: true,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    eventId: { _id: 'quarterly-sync-456', title: 'Quarterly sync' }
  },
  {
    _id: 'demo-3',
    title: 'Friend Request',
    message: 'Batman sent you a friend request.',
    type: 'friend_request',
    isRead: false,
    createdAt: new Date().toISOString(),
    metadata: { friendshipId: 'friendship-123' }
  },
]

export const useNotificationStore = defineStore('notifications', () => {
  const rawItems = ref(DEMO_ITEMS)
  const total = ref(0)
  const loading = ref(false)
  const open = ref(false)
  let pollInterval = null

  // Filter out notifications older than 1 week on the client side
  const items = computed(() => {
    const now = Date.now()
    return rawItems.value.filter(item => {
      const itemTime = new Date(item.createdAt || item.updatedAt || Date.now()).getTime()
      return now - itemTime <= ONE_WEEK_MS
    })
  })

  const unreadCount = computed(() => items.value.filter(i => !i.isRead).length)
  const hasUnread = computed(() => unreadCount.value > 0)

  function timeAgo(date) {
    if (!date) return ''
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
    console.log('LOAD FUNCTION WAS CALLED')
    loading.value = true
    try {
      const response = await axios.get('/api/notifications?limit=15')
      console.log('AXIOS SUCCESS RESPONSE:', response)
      console.log('AXIOS RESPONSE DATA:', response.data)
      rawItems.value = response.data.items ?? DEMO_ITEMS
      total.value = response.data.total ?? rawItems.value.length
    } catch (err) {
      console.warn('Backend not connected, using demo notifications:', err.message)
      rawItems.value = DEMO_ITEMS
      total.value = rawItems.value.length
    } finally {
      loading.value = false
    }
  }

  async function markRead(item) {
    if (item.isRead) return
    const target = rawItems.value.find(i => i._id === item._id)
    if (!target) return

    if (item._id.toString().startsWith('demo-')) {
      target.isRead = true
      return
    }

    try {
      await axios.patch(`/api/notifications/${item._id}/read`)
      target.isRead = true
    } catch (err) {
      console.error('Failed to mark notification as read', err)
    }
  }

  async function markAllRead() {
    if (rawItems.value.some(i => i._id.toString().startsWith('demo-'))) {
      rawItems.value.forEach((n) => { n.isRead = true })
      return
    }

    try {
      await axios.patch('/api/notifications/read-all')
      rawItems.value = rawItems.value.map(n => ({ ...n, isRead: true }))
    } catch (err) {
      console.error('Failed to mark all notifications as read', err)
    }
  }

  async function deleteItem(item) {
    const targetIndex = rawItems.value.findIndex(i => i._id === item._id)
    if (targetIndex === -1) return

    if (item._id.toString().startsWith('demo-')) {
      rawItems.value.splice(targetIndex, 1)
      return
    }

    try {
      await axios.delete(`/api/notifications/${item._id}`)
      rawItems.value.splice(targetIndex, 1)
    } catch (err) {
      console.error('Failed to delete notification', err)
    }
  }

  // --- FRIEND REQUEST ACTIONS ---
  async function acceptFriend(item) {
    // Safely check metadata or direct property for friendshipId
    const friendshipId = item.metadata?.friendshipId || item.friendshipId
    
    // If it's a demo item, just mark it read locally
    if (item._id.toString().startsWith('demo-')) {
      await markRead(item)
      return
    }

    if (!friendshipId) {
      console.error('Missing friendshipId', item)
      return
    }

    try {
      // Calls: router.put('/:friendshipId/accept', friendsController.acceptFriendRequest)
      await axios.put(`/api/friends/${friendshipId}/accept`)
      await markRead(item)
    } catch (err) {
      console.error('Error accepting friend request:', err)
    }
  }

  async function rejectFriend(item) {
    const { requesterId, receiverId } = item.metadata || {}
    
    // If it's a demo item, just delete or mark read locally
    if (item._id.toString().startsWith('demo-')) {
      await markRead(item)
      return
    }

    try {
      if (requesterId && receiverId) {
        // Calls: router.delete('/remove', friendsController.removeFriend)
        await axios.delete('/api/friends/remove', {
          data: { requesterId, receiverId }
        })
      }
      await markRead(item)
    } catch (err) {
      console.error('Error rejecting friend request:', err)
    }
  }

  function toggle() {
    open.value = !open.value
    if (open.value) load()
  }

  function close() {
    open.value = false
  }

  function startPolling() {
    load()
    if (!pollInterval) {
      pollInterval = setInterval(load, 30000)
    }
  }

  function stopPolling() {
    if (pollInterval) {
      clearInterval(pollInterval)
      pollInterval = null
    }
  }

  return {
    items,
    total,
    unreadCount,
    hasUnread,
    loading,
    open,
    timeAgo,
    meta,
    load,
    markRead,
    markAllRead,
    deleteItem,
    acceptFriend,
    rejectFriend,
    toggle,
    close,
    startPolling,
    stopPolling,
  }
})