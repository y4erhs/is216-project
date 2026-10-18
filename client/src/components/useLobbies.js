// src/components/useLobbies.js
// Shared lobby state for every page (My lobbies, Create lobby, Lobby, Invite).
// Module-level reactive state = one source of truth. Swap the bodies of the actions
// for API calls when you connect a backend; the pages don't need to change.
import { reactive } from 'vue'

export const ME_ID = 'me'
export const ME_NAME = 'Steph'
export const INACTIVE_DAYS = 14

export const FRIENDS = [
  { id: 'f1', name: 'Len', color: '#C9EB6C' },
  { id: 'f2', name: 'Giselle', color: '#D98BF5' },
  { id: 'f3', name: 'Wai Linn', color: '#F2B16B' },
  { id: 'f4', name: 'Harshitha', color: '#9fd3ff' },
  { id: 'f5', name: 'Shreya', color: '#ffb3a7' },
  { id: 'f6', name: 'Lay Foo', color: '#C9EB6C' },
]

export const EVENTS = [
  { id: 'e1', title: 'Pottery Night', date: 'Fri 23 Oct, 6:30 PM', venue: 'SMU Connexion', slotsLeft: 6, minGroup: 3, maxGroup: 5 },
  { id: 'e2', title: 'Resume Clinic', date: 'Tue 27 Oct, 4:00 PM', venue: 'SOE/SCIS GSR 2-1', slotsLeft: 4, minGroup: 2, maxGroup: 4 },
  { id: 'e3', title: 'Hack the Campus', date: 'Sat 31 Oct, 10:00 AM', venue: 'Li Ka Shing Library', slotsLeft: 8, minGroup: 4, maxGroup: 6 },
]

const DAY = 86400000
export const daysAgo = (ts) => Math.floor((Date.now() - ts) / DAY)
export const timeAgo = (ts) => {
  const d = daysAgo(ts)
  return d <= 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`
}

const f = (id) => FRIENDS.find((x) => x.id === id)
const me = (status = 'accepted') => ({ id: ME_ID, name: ME_NAME, color: '#9fd3ff', status })
const member = (id, status) => ({ ...f(id), status })
const ago = (d) => Date.now() - d * DAY

const state = reactive({
  lobbies: [
    {
      id: 'l1', name: 'Weekend Warriors', description: 'Our regular crew for Friday workshops and hackathons.',
      hostId: ME_ID, createdAt: ago(40), lastActiveAt: ago(1),
      members: [me(), member('f1', 'accepted'), member('f2', 'accepted'), member('f3', 'accepted')],
      pitchedEventId: 'e3', registered: true,
      history: [{ id: 'h1', eventId: 'e3', memberIds: [ME_ID, 'f1', 'f2', 'f3'], at: ago(1) }],
    },
    {
      id: 'l2', name: 'Study Buddies', description: 'Resume clinics and career talks, together.',
      hostId: 'f4', createdAt: ago(12), lastActiveAt: ago(0),
      members: [member('f4', 'accepted'), me('pending'), member('f1', 'accepted'), member('f5', 'declined')],
      pitchedEventId: 'e2', registered: false, history: [],
    },
    {
      id: 'l3', name: 'Hack Squad', description: 'Trying to put a team together for the next hackathon.',
      hostId: ME_ID, createdAt: ago(45), lastActiveAt: ago(32),
      members: [me(), member('f5', 'pending'), member('f6', 'pending')],
      pitchedEventId: null, registered: false, history: [],
    },
    {
      id: 'l4', name: 'Pottery Club', description: '',
      hostId: 'f2', createdAt: ago(20), lastActiveAt: ago(6),
      members: [member('f2', 'accepted'), me(), member('f3', 'accepted'), member('f6', 'accepted')],
      pitchedEventId: 'e1', registered: true,
      history: [{ id: 'h2', eventId: 'e1', memberIds: ['f2', ME_ID, 'f3', 'f6'], at: ago(6) }],
    },
  ],
})

const get = (id) => state.lobbies.find((l) => l.id === id)
const touch = (l) => { l.lastActiveAt = Date.now() }

export function useLobbies() {
  return {
    lobbies: state.lobbies,
    get,
    isHost: (l) => l.hostId === ME_ID,
    hostName: (l) => l.members.find((m) => m.id === l.hostId)?.name ?? 'Host',
    myStatus: (l) => l.members.find((m) => m.id === ME_ID)?.status ?? 'pending',
    needsReply: (l) => l.hostId !== ME_ID && !l.registered && l.members.find((m) => m.id === ME_ID)?.status === 'pending',
    isInactive: (l) => daysAgo(l.lastActiveAt) >= INACTIVE_DAYS,

    /** -> POST /lobbies */
    createLobby({ name, description }) {
      const id = `l${Date.now().toString(36)}`
      state.lobbies.unshift({
        id, name: name.trim(), description: (description || '').trim(),
        hostId: ME_ID, createdAt: Date.now(), lastActiveAt: Date.now(),
        members: [me()], pitchedEventId: null, registered: false, history: [],
      })
      return id
    },
    /** -> PATCH /lobbies/:id */
    updateLobby(id, { name, description }) {
      const l = get(id); if (!l) return
      l.name = name.trim(); l.description = (description || '').trim(); touch(l)
    },
    /** -> DELETE /lobbies/:id  (host only) */
    deleteLobby(id) {
      const i = state.lobbies.findIndex((l) => l.id === id)
      if (i > -1) state.lobbies.splice(i, 1)
    },
    addMember(id, person) {
      const l = get(id); if (!l || l.registered || l.members.some((m) => m.id === person.id)) return
      l.members.push({ ...person, status: 'pending' }); touch(l)
    },
    removeMember(id, memberId) {
      const l = get(id); if (!l) return
      l.members = l.members.filter((m) => m.id !== memberId); touch(l)
    },
    setStatus(id, memberId, status) {
      const l = get(id); const m = l?.members.find((x) => x.id === memberId)
      if (!m || l.registered) return
      m.status = status; touch(l)
    },
    pitchEvent(id, eventId) {
      const l = get(id); if (!l || l.registered) return
      l.pitchedEventId = eventId; touch(l)
    },
    /** One click signs up everyone who accepted. -> POST /lobbies/:id/register */
    registerGroup(id) {
      const l = get(id); if (!l || !l.pitchedEventId) return
      l.history.push({
        id: `h${Date.now()}`, eventId: l.pitchedEventId, at: Date.now(),
        memberIds: l.members.filter((m) => m.status === 'accepted').map((m) => m.id),
      })
      l.registered = true; touch(l)
    },
    /** Same group, next event: keeps the lobby and asks everyone to confirm again. */
    planNext(id) {
      const l = get(id); if (!l) return
      l.registered = false; l.pitchedEventId = null
      l.members.forEach((m) => { if (m.id !== l.hostId) m.status = 'pending' })
      touch(l)
    },
  }
}