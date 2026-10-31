// useLobbies.js
// Shared lobby state for every lobby page, now backed by the real API.
import { reactive } from 'vue'
import { useAuth } from './useAuth'

const API_URL = 'http://localhost:8000'
export const INACTIVE_DAYS = 14

const DAY = 86400000
export const daysAgo = (ts) => Math.floor((Date.now() - ts) / DAY)
export const timeAgo = (ts) => {
  const d = daysAgo(ts)
  return d <= 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`
}

// Same person always gets the same colour
const COLORS = ['#C9EB6C', '#D98BF5', '#F2B16B', '#9fd3ff', '#ffb3a7', '#fdebd0']
export function colorFor(id) {
  let sum = 0
  for (const ch of String(id)) sum += ch.charCodeAt(0)
  return COLORS[sum % COLORS.length]
}

const { userId } = useAuth()
const meId = () => userId.value

const state = reactive({ lobbies: [], friends: [], events: [], loading: false, error: '' })

/* ---------- helpers ---------- */
const ts = (d) => (d ? new Date(d).getTime() : Date.now())
const idOf = (x) => (x && x._id ? String(x._id) : x ? String(x) : null)
// Replace an array's contents without replacing the array (pages hold on to it)
const replaceIn = (arr, items) => arr.splice(0, arr.length, ...items)

async function api(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json' },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || data.error || 'Request failed')
  return data
}

/* ---------- backend -> page shape ---------- */
function toLobby(raw) {
  const pitchedEventId = idOf(raw.event)
  const history = (raw.history || []).map((h) => ({
    id: String(h._id),
    eventId: idOf(h.eventId),
    memberIds: (h.memberIds || []).map(idOf),
    at: ts(h.registeredAt),
  }))
  return {
    id: String(raw._id),
    name: raw.name,
    description: raw.description || '',
    hostId: idOf(raw.host),
    createdAt: ts(raw.createdAt),
    lastActiveAt: ts(raw.lastActiveAt),
    members: (raw.members || []).map((m) => ({
      id: String(m.id), name: m.name, status: m.status, color: colorFor(m.id),
    })),
    pitchedEventId,
    // "registered" = the current event is already in the history
    registered: !!pitchedEventId && history.some((h) => h.eventId === pitchedEventId),
    history,
  }
}

const formatDate = (d) => new Date(d).toLocaleString('en-SG', {
  weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
  timeZone: 'Asia/Singapore',
})

function toEvent(raw) {
  const sessions = [...(raw.sessions || [])].sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
  const next = sessions.find((s) => new Date(s.endTime) > Date.now())
  const shown = next || sessions[0]

  const slotsLeft = raw.slots == null ? null : Math.max(0, raw.slots - (raw.signUpCount || 0))
  const minGroup = raw.minGroup || 1
  const maxGroup = raw.maxGroup || null

  const limits = []
  if (raw.minGroup && raw.maxGroup) limits.push(`Groups of ${raw.minGroup} to ${raw.maxGroup}.`)
  else if (raw.minGroup) limits.push(`Groups of at least ${raw.minGroup}.`)
  else if (raw.maxGroup) limits.push(`Up to ${raw.maxGroup} per group.`)
  if (slotsLeft != null) limits.push(`${slotsLeft} slots left.`)

  return {
    id: String(raw._id),
    title: raw.title,
    date: shown ? formatDate(shown.startTime) : 'Date TBC',
    venue: raw.venue || '',
    slotsLeft,
    minGroup,
    maxGroup,
    capacity: Math.min(maxGroup ?? Infinity, slotsLeft ?? Infinity),   // most people who can sign up
    limitsText: limits.join(' ') || 'Any group size.',
    upcoming: !!next,
  }
}

/* ---------- loading ---------- */
async function load() {
  if (!meId()) return
  state.loading = true
  state.error = ''
  try {
    const [lobbies, friends, events] = await Promise.all([
      api(`/api/lobbies/user/${meId()}`),
      api(`/api/friends/${meId()}/accepted`).catch(() => []),   // 404 = no friends yet
      api('/api/events'),
    ])

    replaceIn(state.events, (Array.isArray(events) ? events : events.events || []).map(toEvent))
    replaceIn(state.friends, friends.map((f) => {
      const other = idOf(f.requester) === meId() ? f.receiver : f.requester
      return { id: idOf(other), name: other.username, color: colorFor(idOf(other)) }
    }))
    replaceIn(state.lobbies, lobbies.map(toLobby))
  } catch (err) {
    console.error(err)
    state.error = 'Could not load lobbies.'
  } finally {
    state.loading = false
  }
}

// Re-fetch one lobby after a change (removes it if it no longer exists)
async function refresh(id) {
  const i = state.lobbies.findIndex((l) => l.id === id)
  try {
    const fresh = toLobby(await api(`/api/lobbies/lobby/${id}`))
    if (i > -1) state.lobbies[i] = fresh
    else state.lobbies.unshift(fresh)
  } catch {
    if (i > -1) state.lobbies.splice(i, 1)
  }
}

// Run a request, show any error, then refresh that lobby
async function act(id, request) {
  try {
    await request()
  } catch (err) {
    alert(err.message)
  }
  await refresh(id)
}

const get = (id) => state.lobbies.find((l) => l.id === id)
const myStatus = (l) => l.members.find((m) => m.id === meId())?.status ?? 'pending'

export function useLobbies() {
  return {
    lobbies: state.lobbies,
    friends: state.friends,
    events: state.events,
    state,
    load,
    refresh,
    get,
    meId,
    isHost: (l) => l.hostId === meId(),
    hostName: (l) => l.members.find((m) => m.id === l.hostId)?.name ?? 'Host',
    myStatus,
    needsReply: (l) => l.hostId !== meId() && !l.registered && myStatus(l) === 'pending',
    isInactive: (l) => daysAgo(l.lastActiveAt) >= INACTIVE_DAYS,

    async createLobby({ name, description }) {
      const raw = await api('/api/lobbies', {
        method: 'POST',
        body: { name: name.trim(), description: (description || '').trim(), host: meId() },
      })
      const id = String(raw._id)
      await refresh(id)
      return id
    },
    updateLobby: (id, { name, description }) =>
      act(id, () => api(`/api/lobbies/${id}`, { method: 'PATCH', body: { name, description } })),
    deleteLobby: (id) =>
      act(id, () => api(`/api/lobbies/${id}`, { method: 'DELETE' })),
    addMember: (id, person) =>
      act(id, () => api('/api/lobbies/invite', { method: 'PUT', body: { lobbyId: id, userId: person.id } })),
    removeMember: (id, memberId) =>
      act(id, () => api('/api/lobbies/remove', { method: 'PUT', body: { lobbyId: id, userId: memberId } })),
    setStatus(id, memberId, status) {
      const path = status === 'accepted' ? 'accept' : status === 'declined' ? 'decline' : null
      if (!path) return
      return act(id, () => api(`/api/lobbies/${path}`, { method: 'PUT', body: { lobbyId: id, userId: memberId } }))
    },
    pitchEvent: (id, eventId) =>
      act(id, () => api(`/api/lobbies/${id}/event`, { method: 'PUT', body: { eventId } })),
    async registerGroup(id) {
      await act(id, () => api(`/api/lobbies/${id}/signup`, { method: 'POST' }))
      await load()   // slot counts changed
    },
    planNext: (id) =>
      act(id, () => api(`/api/lobbies/${id}/plan-next`, { method: 'POST' })),
  }
}