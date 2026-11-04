<!--
  Lobby.vue  (Vue 3, <script setup>)
  Every lobby you host or belong to, searchable and filterable.
  The header (title, create button, search, filters, event dropdown) stays pinned while the cards scroll.
  Emits: open(lobbyId), create, open-calendar
-->
<template>
  <div v-if="lobby" class="app">
    <header class="head">
      <!-- row 1: back link + actions -->
      <div class="head-bar">
        <button class="back-link" type="button" @click="$emit('back')">
          <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true">
            <path d="M17 6H2M6 1 1 6l5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"
              stroke-linejoin="round" />
          </svg>
          <span>My lobbies</span>
        </button>

        <div v-if="isHost && !editing" class="head-actions">
          <BaseButton class="theme-green head-btn" type="button" aria-label="Edit lobby details" @click="startEdit">Edit</BaseButton>
          <BaseButton class="theme-orange head-btn" type="button" aria-label="Delete lobby"
            @click="confirmingDelete = true">Delete</BaseButton>
        </div>
        <div v-if="!isHost && !registered" class="head-actions">
          <BaseButton class="theme-orange head-btn" type="button" aria-label="Leave lobby"
            @click="confirmingLeave = true">Leave lobby</BaseButton>
        </div>
      </div>

      <!-- row 2: name / description / status (collapsed by default) -->
      <div class="head-info">
        <form v-if="editing" class="edit" @submit.prevent="saveEdit">
          <label class="field">
            <span>Lobby name</span>
            <input v-model="draft.name" maxlength="40" required />
          </label>
          <label class="field">
            <span>Description</span>
            <textarea v-model="draft.description" maxlength="200" rows="2"></textarea>
          </label>
          <div class="edit-actions">
            <BaseButton class="theme-green btn-small" type="submit" :disabled="!draft.name.trim()">Save</BaseButton>
            <BaseButton class="btn-light btn-small" type="button" @click="editing = false">Cancel</BaseButton>
          </div>
        </form>

        <template v-else>
          <button class="info-toggle" :class="{ open: infoOpen }" type="button" :aria-expanded="infoOpen"
            aria-controls="lobby-info-more" :aria-label="infoOpen ? 'Hide lobby details' : 'Show lobby details'"
            @click="infoOpen = !infoOpen">
            <svg class="info-chev" width="12" height="8" viewBox="0 0 12 8" aria-hidden="true">
              <path d="M1 1.5 6 6.5l5-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
          </button>

          <h2 class="page-title">{{ lobby.name }}</h2>

          <div v-show="infoOpen" id="lobby-info-more" class="info-more">
            <p class="lobby-desc">{{ lobby.description || 'No description yet.' }}</p>
            <p class="lobby-meta">
              {{ isHost ? 'Hosted by you.' : `Hosted by ${hostName}.` }} Active {{ timeAgo(lobby.lastActiveAt) }}.
              <span v-if="inactive && isHost" class="badge-pill pill-warn">Inactive</span>
            </p>
          </div>
        </template>
      </div>
    </header>

    <main class="stage">
      <FolderTabs :key="folderKey" :tabs="tabs" :default-active="tab" @tab-change="tab = $event">
        <template #invite>
          <div class="pane">
            <section class="section-wrapper">
              <h3 class="section-title">Invite friends</h3>
              <p v-if="!friends.length" class="section-sub">
                No friends yet. <RouterLink to="/friends" style="color:#fff">Add some</RouterLink>
              </p>
              <div v-else class="scroll" v-auto-scrollbar>
                <ul class="people">
                  <li v-for="f in friends" :key="f.id" class="person">
                    <span class="avatar" :style="{ background: f.color }">{{ initials(f.name) }}<AvatarPic :path="f.avatar" /></span>
                    <span class="who">{{ f.name }}</span>
                    <span v-if="statusOf(f.id) && statusOf(f.id) !== 'declined'" class="badge-pill"
                      :class="`pill-${statusOf(f.id)}`">{{ statusLabel[statusOf(f.id)] }}</span>
                    <button v-else class="badge-pill pill-invite" type="button" :disabled="registered"
                      @click="invite(f)">Invite</button>
                  </li>
                </ul>
              </div>
            </section>
          </div>
        </template>

        <template #roster>
          <div class="pane">
            <section class="section-wrapper">
              <div class="section-head">
                <h3 class="section-title">Who's in</h3>
                <span class="live">
                  <i class="live-dot"></i>
                  <span class="live-text">Live Update</span>
                </span>
              </div>
              <p v-if="members.length === 1" class="section-sub">No one invited yet. Add friends from the Invite tab.</p>

              <div class="scroll" v-auto-scrollbar>
                <TransitionGroup name="roster" tag="ul" class="people" aria-live="polite">
                  <li v-for="m in uniqueMembers" :key="m.id" class="person"
                    :class="{ flash: flashIds.has(m.id), asking: removingId === m.id }">
                    <template v-if="removingId === m.id">
                      <span class="who">Remove {{ m.name.split(' ')[0] }}?</span>
                      <button class="badge-pill pill-danger" type="button"
                        @click="removeMember(m.id); removingId = null">Yes, remove</button>
                      <button class="badge-pill pill-grey" type="button" @click="removingId = null">Cancel</button>
                    </template>

                    <template v-else>
                      <span class="avatar" :style="{ background: m.color || 'var(--color-white)' }">{{ initials(m.name) }}<AvatarPic :path="m.avatar" /></span>
                      <span class="who">
                        {{ m.name }}
                      </span>
                      <span v-if="m.id === lobby.hostId" class="badge-pill pill-host">Host</span>
                      <span v-else class="badge-pill" :class="`pill-${m.status}`">{{ statusLabel[m.status] }}</span>

                      <button v-if="isHost && m.id !== lobby.hostId && !registered" class="remove-x" type="button"
                        :aria-label="`Remove ${m.name}`" :title="`Remove ${m.name}`"
                        @click="removingId = m.id"><span class="x-text">X</span></button>
                    </template>
                  </li>
                </TransitionGroup>
              </div>
            </section>
          </div>
        </template>

        <template #register>
          <div class="pane" :class="{ 'pane-fill': isHost && !registered }">
            <template v-if="registered">
              <section class="section-wrapper">
                <h3 class="section-title">Group registered</h3>
                <p class="section-sub">{{ lastRegEvent?.title }} on {{ lastRegEvent?.date }}. These people are signed
                  up:</p>
                <ul class="names">
                  <li v-for="n in lastRegNames" :key="n">{{ n }}</li>
                </ul>
              </section>
              <section v-if="isHost">
                <h3 class="section-title">Same group, another event?</h3>
                <p class="section-sub">Keep this lobby and pick a new event. Everyone will be asked to confirm again.
                </p>
                <BaseButton class="theme-green" type="button" @click="planAnother">Plan another event</BaseButton>
              </section>
            </template>

            <section v-else-if="!isHost">
              <h3 class="section-title">Pitched event</h3>
              <br>
              <div v-if="selectedEvent" class="event-body">
                <strong>{{ selectedEvent.title }}</strong>
                <span>{{ selectedEvent.date }}</span>
                <span>{{ selectedEvent.venue }}</span>
                <span class="event-meta">{{ selectedEvent.limitsText }}</span>
              </div>
              <p v-else class="section-sub">{{ hostName }} hasn't picked an event yet.</p>
              <br>
              <p class="section-sub">{{ hostName }} registers the group once enough people have accepted.</p>
            </section>

            <section v-else class="fill">
              <h3 class="section-title">Pitch an event</h3>
              <p class="section-sub">Friends can still accept or decline while you choose.</p>

              <div class="filter-row" role="group" aria-label="Which events to show">
                <button type="button" class="pitch-chip" :class="{ on: pitchMode === 'interested' }"
                        :aria-pressed="pitchMode === 'interested'" @click="pitchPick = 'interested'">
                  <span v-if="pitchMode === 'interested'" aria-hidden="true">✓</span>
                  Interested <b>{{ interestedUpcoming.length }}</b>
                </button>
                <button type="button" class="pitch-chip" :class="{ on: pitchMode === 'all' }"
                        :aria-pressed="pitchMode === 'all'" @click="pitchPick = 'all'">
                  <span v-if="pitchMode === 'all'" aria-hidden="true">✓</span>
                  All events <b>{{ upcomingEvents.length }}</b>
                </button>
              </div>

              <div v-if="!pitchable.length" class="empty-note">
                <p v-if="pitchMode === 'interested'">
                  None of your upcoming events are marked as interested. Mark some on the Discover page, or show all events.
                </p>
                <p v-else>No upcoming events to pitch right now.</p>
                <BaseButton v-if="pitchMode === 'interested'" class="theme-green" type="button" @click="pitchPick = 'all'">Show all events</BaseButton>
              </div>

              <div v-else class="scroll" v-auto-scrollbar>
                <div class="events" role="radiogroup" aria-label="Events">
                  <label v-for="e in pitchable" :key="e.id" class="event" :class="{ used: usedEventIds.has(e.id) }">
                    <input class="sr" type="radio" name="event" :value="e.id" v-model="selectedEventId"
                          :disabled="usedEventIds.has(e.id)" />
                    <span class="event-body">
                      <span class="event-details">
                        <strong>{{ e.title }}</strong>
                        <span>{{ e.date }}</span>
                        <span>{{ e.venue }}</span>
                      </span>
                      <span class="event-meta">{{ e.limitsText }}</span>
                      <span v-if="usedEventIds.has(e.id)" class="badge-pill pill-accepted">Already registered</span>
                    </span>
                  </label>
                </div>
              </div>
            </section>
          </div>
        </template>

        <template #calendar>
          <div class="pane calendar-pane section-wrapper">
            <LobbyCalendar ref="calendarEl" :lobby-id="lobbyId" :user-id="userId" @select-day="selectedDay = $event" />
          </div>
        </template>
      </FolderTabs>

      <div v-if="tab === 'register' && !registered && isHost" class="register-bar">
        <div class="progress" v-if="selectedEvent">
          <div class="meter" role="progressbar" :aria-valuenow="acceptedMembers.length" aria-valuemin="0"
            :aria-valuemax="selectedEvent.minGroup">
            <i :style="{ width: progress + '%' }"></i>
          </div>
          <p class="hint">{{ registerHint }}</p>
        </div>
        <p v-else class="hint">Choose an event to start.</p>

        <BaseButton class="theme-green" type="button" :disabled="!canRegister" @click="registerGroup">Register
          group</BaseButton>
      </div>
    </main>

    <aside v-if="tab === 'calendar'" class="panel-wrap" aria-label="Selected day">
      <div class="side-panel day-panel" v-auto-scrollbar>
        <PlanForm v-if="showPlanForm" :user-id="userId" :lobby-id="lobbyId" :date="selectedDay?.date || ''"
          @close="showPlanForm = false" @created="calendarEl?.reload()" />

        <template v-else>
          <h3 class="panel-title">Selected day</h3>

          <div class="ev">
            <template v-if="selectedDay">
              <span class="ev-title">{{ selectedDayLabel }}</span>
              <ul v-if="selectedDay.chips.length" class="day-chips">
                <li v-for="(chip, i) in selectedDay.chips" :key="i" class="chip" :class="{ 'chip-lobby': chip.lobby }"
                  :style="chip.colour ? { background: chip.colour } : null">{{ chip.text }}</li>
              </ul>
              <p v-else class="ev-meta">Everyone's free</p>
            </template>
            <p v-else class="ev-meta">Pick a day on the calendar to see what's on.</p>
          </div>

          <BaseButton class="theme-green add-plan" type="button" @click="showPlanForm = true">Add plan</BaseButton>
        </template>
      </div>
    </aside>

    <aside v-else class="panel-wrap" aria-label="Registered events">
      <div class="side-panel side-panel-split">
        <h3 class="panel-title">Registered events</h3>

        <div class="side-scroll" v-auto-scrollbar>
        <ul v-if="eventRows.length" class="evlist">
          <li v-for="(r, i) in eventRows" :key="r.key" class="ev">
            <button class="ev-head" type="button" :aria-expanded="isOpen(r, i)" :aria-controls="`ev-${r.key}`"
              @click="toggleEvent(r, i)">
              <span class="ev-title">{{ r.title }}</span>
              <span class="chev" :class="{ open: isOpen(r, i) }" aria-hidden="true"></span>
            </button>
            <span v-if="r.pitched" class="badge-pill pill-grey ev-tag">Pitched, not registered yet</span>
            <p class="ev-meta">{{ r.date }}<br />{{ r.venue }}</p>

            <div v-show="isOpen(r, i)" :id="`ev-${r.key}`" class="stats">
              <div class="stat stat-pending"><span>Pending</span><b>{{ r.pending }}</b></div>
              <div class="stat stat-declined"><span>Declined</span><b>{{ r.declined }}</b></div>
              <div class="stat stat-accepted"><span>Accepted</span><b>{{ r.accepted }}</b></div>
            </div>
          </li>
        </ul>

        <div v-else class="ev-empty">
          <p>No events yet. Pitch one to your group.</p>
          <BaseButton v-if="isHost" class="theme-green" @click="goTo('register')">Choose event</BaseButton>
        </div>
       </div>
      </div>
    </aside>

    <Transition name="fade">
      <div v-if="viewingMember" class="overlay" v-auto-scrollbar role="dialog" aria-modal="true" aria-label="Invitation"
        @click.self="viewingId = null">
        <LobbyInvite :lobby-name="lobby.name" :description="lobby.description" :host-name="hostName"
          :event="selectedEvent" :members="inviteeMembers" :via="viewingMember.via === 'link' ? 'link' : 'invitation'"
          :my-status="viewingMember.status" :me-id="viewingMember.id" :locked="registered" @respond="onRespond"
          @close="viewingId = null" />
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="confirmingDelete" class="overlay" v-auto-scrollbar role="alertdialog" aria-modal="true" aria-labelledby="del-title"
        @click.self="confirmingDelete = false">
        <div class="dialog">
          <h3 id="del-title" class="dialog-title">Delete "{{ lobby.name }}"?</h3>
          <p v-if="inactive">Nothing has happened here for {{ daysIdle }} days, so it's safe to clear out.</p>
          <p v-else>
            This lobby is still active. If it's the same group of friends, keep it and plan another event instead.
          </p>
          <p>Deleting removes the lobby and its roster for everyone. Events you've already registered for are not
            cancelled.
          </p>
          <div class="dialog-actions">
            <BaseButton class="btn-ghost" type="button" @click="confirmingDelete = false">Keep lobby</BaseButton>
            <BaseButton v-if="registered" class="theme-purple" type="button"
              @click="confirmingDelete = false; planAnother()">Plan another event</BaseButton>
            <BaseButton class="theme-red" type="button" @click="deleteLobby">Delete lobby</BaseButton>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="confirmingLeave" class="overlay" v-auto-scrollbar role="alertdialog" aria-modal="true" aria-labelledby="leave-title"
          @click.self="confirmingLeave = false">
        <div class="dialog">
          <h3 id="leave-title" class="dialog-title">Leave "{{ lobby.name }}"?</h3>
          <p>You'll be marked as declined and won't be signed up for events. {{ hostName }} can invite you again.</p>
          <div class="dialog-actions">
            <BaseButton class="btn-ghost" type="button" @click="confirmingLeave = false">Stay</BaseButton>
            <BaseButton class="theme-red" type="button" @click="leaveLobby">Leave lobby</BaseButton>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import FolderTabs from '../components/FolderTabs.vue'
import LobbyCalendar from '../components/LobbyCalendar.vue'
import PlanForm from '../components/PlanForm.vue'
import BaseButton from '../components/BaseButton.vue'
import AvatarPic from '../components/AvatarPic.vue'
import LobbyInvite from '../views/LobbyInvite.vue'
import { useAuth } from '../composables/useAuth'
import { useLobbies, daysAgo, timeAgo, INACTIVE_DAYS } from '../composables/useLobbies'
import { useActivities } from '../composables/useActivities'
import { vAutoScrollbar } from '../directives/autoScrollbar'

const props = defineProps({
  lobbyId: { type: String, required: true },
})
const emit = defineEmits(['back', 'deleted', 'invite', 'remove', 'register'])

const store = useLobbies()
const { userId } = useAuth()
const friends = computed(() => store.friends)
const events = computed(() => store.events)
const lobby = computed(() => store.get(props.lobbyId))
const isHost = computed(() => !!lobby.value && store.isHost(lobby.value))
const members = computed(() => lobby.value?.members ?? [])
// Deduplicate members by ID
const uniqueMembers = computed(() => {
  const map = new Map()
  lobby.value?.members?.forEach(m => {
    map.set(m.id, m)
  })
  return Array.from(map.values())
})
const registered = computed(() => !!lobby.value?.registered)
const hostName = computed(() => (lobby.value ? store.hostName(lobby.value) : ''))
const daysIdle = computed(() => (lobby.value ? daysAgo(lobby.value.lastActiveAt) : 0))
const inactive = computed(() => daysIdle.value >= INACTIVE_DAYS)

const allTabs = [
  { id: 'invite', label: 'INVITE', theme: 'theme-green' },
  { id: 'roster', label: 'ROSTER', theme: 'theme-orange' },
  { id: 'register', label: 'REGISTER', theme: 'theme-purple' },
  { id: 'calendar', label: 'SHARED CALENDAR', theme: 'theme-yellow' },
]
const tabs = computed(() => (isHost.value ? allTabs : allTabs.filter((t) => t.id !== 'invite')))
const tab = ref(isHost.value ? 'invite' : 'roster')
const selectedDay = ref(null)
const selectedDayLabel = computed(() => selectedDay.value &&
  new Date(`${selectedDay.value.date}T00:00`).toLocaleDateString('en-SG', { weekday: 'long', day: 'numeric', month: 'long' }))
const showPlanForm = ref(false)
const calendarEl = ref(null)
const dayPanelEl = ref(null)

// On narrow screens the panel sits under the calendar, so bring it into view
function showDayPanel() {
  if (window.matchMedia('(max-width: 900px)').matches) {
    nextTick(() => dayPanelEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
}
const folderKey = ref(0)
function goTo(id) {
  tab.value = id
  folderKey.value++
}

const statusLabel = { pending: 'Pending', accepted: 'Accepted', declined: 'Declined' }

const editing = ref(false)
const infoOpen = ref(false) // name stays visible, description + status are collapsed by default
const draft = reactive({ name: '', description: '' })
function startEdit() {
  draft.name = lobby.value.name
  draft.description = lobby.value.description
  editing.value = true
}

function saveEdit() {
  if (!draft.name.trim()) return
  store.updateLobby(lobby.value.id, draft)
  editing.value = false
}

const confirmingDelete = ref(false)
function deleteLobby() {
  const id = lobby.value.id
  confirmingDelete.value = false
  store.deleteLobby(id)
  emit('deleted', id)
}

const confirmingLeave = ref(false)

async function leaveLobby() {
  confirmingLeave.value = false
  try {
    await store.removeMember(props.lobbyId, store.meId())
  } catch (err) {
    console.error("Failed to leave lobby:", err)
  }
  emit('back')
}

const inviteLink = computed(() => `${window.location.origin}/lobby/${props.lobbyId}`)
const copied = ref(false)
const flashIds = reactive(new Set())
const removingId = ref(null)

const selectedEventId = computed({
  get: () => lobby.value?.pitchedEventId ?? null,
  set: (id) => store.pitchEvent(props.lobbyId, id),
})
const selectedEvent = computed(() => events.value.find((e) => e.id === selectedEventId.value) || null)
/* ---------- which events to offer when pitching ---------- */
const { activities, loadActivities } = useActivities()
const actsLoaded = ref(false)

const upcomingEvents = computed(() => events.value.filter((e) => e.upcoming))
const interestedIds = computed(
  () => new Set(activities.value.filter((a) => a.interested && a.event).map((a) => String(a.event._id)))
)
const interestedUpcoming = computed(() => upcomingEvents.value.filter((e) => interestedIds.value.has(e.id)))

const pitchPick = ref(null)   // null = automatic, until the host presses a button
const pitchMode = computed(
  () => pitchPick.value ?? (actsLoaded.value && interestedUpcoming.value.length ? 'interested' : 'all')
)
const pitchable = computed(() =>
  pitchMode.value === 'all'
    ? upcomingEvents.value
    // keep the event that's already pitched visible, even if it isn't marked interested
    : upcomingEvents.value.filter((e) => interestedIds.value.has(e.id) || e.id === selectedEventId.value)
)
const acceptedMembers = computed(() => members.value.filter((m) => m.status === 'accepted'))
const counts = computed(() => ({
  pending: members.value.filter((m) => m.status === 'pending').length,
  declined: members.value.filter((m) => m.status === 'declined').length,
}))
const statusOf = (id) => members.value.find((m) => m.id === id)?.status ?? null

const history = computed(() => lobby.value?.history ?? [])
const usedEventIds = computed(() => new Set(history.value.map((h) => h.eventId)))
const eventById = (id) => events.value.find((e) => e.id === id)
const lastReg = computed(() => history.value[history.value.length - 1])
const lastRegEvent = computed(() => (lastReg.value ? eventById(lastReg.value.eventId) : null))
const lastRegNames = computed(() =>
  (lastReg.value?.memberIds ?? []).map((id) => members.value.find((m) => m.id === id)?.name).filter(Boolean)
)

const eventRows = computed(() => {
  const rows = []
  if (!registered.value && selectedEvent.value) {
    const e = selectedEvent.value
    rows.push({
      key: 'pitched', pitched: true, title: e.title, date: e.date, venue: e.venue,
      pending: counts.value.pending, declined: counts.value.declined, accepted: acceptedMembers.value.length,
    })
  }
  ;[...history.value].reverse().forEach((h) => {
    const e = eventById(h.eventId)
    rows.push({
      key: h.id, pitched: false, title: e?.title ?? 'Event', date: e?.date ?? '', venue: e?.venue ?? '',
      pending: 0, declined: 0, accepted: h.memberIds.length,
    })
  })
  return rows
})
const openMap = reactive({})
const isOpen = (r, i) => openMap[r.key] ?? i === 0
const toggleEvent = (r, i) => { openMap[r.key] = !isOpen(r, i) }

const capacity = computed(() => selectedEvent.value?.capacity ?? 0)
const progress = computed(() =>
  selectedEvent.value ? Math.min(100, (acceptedMembers.value.length / selectedEvent.value.minGroup) * 100) : 0
)
const canRegister = computed(() => {
  const ev = selectedEvent.value
  if (!ev || registered.value) return false
  const n = acceptedMembers.value.length
  return n >= ev.minGroup && n <= capacity.value
})
const registerHint = computed(() => {
  const ev = selectedEvent.value
  if (!ev) return ''
  const n = acceptedMembers.value.length
  if (n > capacity.value) return `Too many accepted. This event takes ${capacity.value} at most.`
  if (n < ev.minGroup) return `Waiting for ${ev.minGroup - n} more to accept.`
  const pending = counts.value.pending
  return pending
    ? `Ready. ${n} will be signed up and ${pending} still pending will be left out.`
    : `Ready. All ${n} accepted members will be signed up.`
})

const viewingId = ref(null)
const viewingMember = computed(() => members.value.find((m) => m.id === viewingId.value) || null)
const inviteeMembers = computed(() => members.value.map((m) => ({ ...m, host: m.id === lobby.value.hostId })))
function onRespond(status) {
  if (!viewingMember.value || registered.value) return
  store.setStatus(props.lobbyId, viewingMember.value.id, status)
  emit('respond', { memberId: viewingMember.value.id, status })
}

const initials = (name) => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

function invite(friend) {
  store.addMember(props.lobbyId, friend)
  emit('invite', friend.id)
}
function removeMember(id) {
  store.removeMember(props.lobbyId, id)
  emit('remove', id)
}
async function copyLink() {
  try {
    await navigator.clipboard.writeText(inviteLink.value)
  } catch {}
  copied.value = true
  setTimeout(() => (copied.value = false), 1800)
}
function registerGroup() {
  if (!canRegister.value) return
  emit('register', { eventId: selectedEvent.value.id, memberIds: acceptedMembers.value.map((m) => m.id) })
  store.registerGroup(props.lobbyId)
}
function planAnother() {
  store.planNext(props.lobbyId)
  goTo('register')
}

watch(
  () => members.value.map((m) => `${m.id}:${m.status}`),
  (now, before) => {
    const prev = new Map((before || []).map((s) => s.split(':')))
    now.forEach((s) => {
      const [id, st] = s.split(':')
      if (prev.has(id) && prev.get(id) !== st) {
        flashIds.add(id)
        setTimeout(() => flashIds.delete(id), 1200)
      }
    })
  }
)

function onEsc(e) {
  if (e.key !== 'Escape') return
  viewingId.value = null
  confirmingDelete.value = false
  confirmingLeave.value = false
}

onMounted(async () => {
  window.addEventListener('keydown', onEsc)
  try { await loadActivities() } catch { /* fall back to showing all events */ }
  actsLoaded.value = true
})

onBeforeUnmount(() => window.removeEventListener('keydown', onEsc))
</script>

<style scoped>
.app {
  width: 100%;
  max-width: 1450px;
  height: calc(100vh - 30px);
  max-height: calc(100vh - 30px);
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  grid-template-areas:
    'head panel'
    'stage panel';
  grid-template-rows: auto minmax(0, 1fr);
  gap: 15px;
  overflow: hidden;
  text-align: left;
  font-family: 'TextFont', sans-serif;
  font-size: 13px;
  box-sizing: border-box;
}

.app *,
.app *::before,
.app *::after {
  box-sizing: border-box;
}

.app button,
.app input,
.app textarea {
  font-family: inherit;
}

.sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

:focus-visible {
  outline: 3px solid var(--color-black);
  outline-offset: 2px;
}

.head :focus-visible,
.stage :focus-visible {
  outline-color: #fff;
}

.pitch-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.pitch-header-row .section-title,
.pitch-header-row .section-sub {
  margin-bottom: 0;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 0; 
  justify-content: flex-end;
}

.badge-pill {
  display: inline-flex;
  height: 22px;
  border: 0;
  border-radius: 9999px;
  background-color: var(--color-grey);
  padding: 5px 12px 10px 12px;
  color: var(--color-black);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  white-space: normal;
}

button.badge-pill {
  cursor: pointer;
}

button.badge-pill:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.pill-pending {
  background-color: var(--color-orange);
  color: var(--color-white);
}

.pill-accepted,
.pill-invite {
  background-color: var(--color-green);
  color: var(--color-dark-green);
}

.pill-declined,
.pill-grey {
  background-color: var(--color-grey);
}

.pill-host {
  background-color: var(--color-blue);
  color: var(--color-white);
}

.pill-member,
.pill-accepted,
.pill-invite {
  background-color: var(--color-green);
  color: var(--color-dark-green);
}

.pill-danger,
.pill-warn {
  background-color: var(--color-red);
  color: var(--color-white);
}
.head {
  grid-area: head;
  display: grid;
  gap: 12px;
  min-width: 0;
  flex-shrink: 0;
}

/* row 1: back link + actions */
.head-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  flex-wrap: wrap;
  padding: 8px 0 0 8px;
}

.head-actions {
  display: flex;
  gap: 8px;
  flex: none;
}

/* row 2: name / description / status, collapsible */
.head-info {
  position: relative;
  display: grid;
  justify-items: start;
  gap: 8px;
  min-width: 0;
  padding: 0 0 0 8px;
}

.info-more {
  display: grid;
  justify-items: start;
  gap: 8px;
}

.info-toggle {
  position: absolute;
  top: 0;
  right: 0;
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  color: #fff;
  cursor: pointer;
}

.info-toggle:hover {
  background-color: rgba(255, 255, 255, 0.18);
}

.info-chev {
  transition: transform 0.2s ease;
}

.info-toggle.open .info-chev {
  transform: rotate(180deg);
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  color: #fff;
  font: 400 11px/1 'TextFont', sans-serif;
  text-transform: uppercase;
}

.back-link span {
  text-decoration: underline;
  text-underline-offset: 4px;
}

.page-title {
  margin: 0;
  max-width: calc(100% - 32px); /* keeps long names clear of the arrow */
  color: #fff;
  font: 400 25px/1.1 'HeaderFont', sans-serif;
  text-transform: uppercase;
  overflow-wrap: anywhere;
}

.lobby-desc {
  margin-top: 0;
  margin-bottom: 0;
  max-width: 70ch;
}

.lobby-meta {
  margin: 0;
  max-width: 70ch;
  line-height: 1.5;
}

.edit {
  display: grid;
  gap: 8px;
  width: min(520px, 100%);
}

.field {
  display: grid;
  gap: 4px;
  color: #fff;
  font-weight: 700;
  text-transform: uppercase;
}

.field input,
.field textarea {
  padding: 9px 14px;
  border: 0;
  border-radius: 15px;
  background-color: var(--color-white);
  color: var(--color-black);
  font-size: 13px;
  text-transform: none;
  font-weight: 400;
  resize: vertical;
}

.edit-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.edit-actions > * {
  flex: none;
  width: auto !important;
  min-width: 96px;
  height: 36px;
  white-space: nowrap;
}

.stage {
  grid-area: stage;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.stage :deep(.folder-container) {
  height: 100% !important;
  min-height: 0;
  max-height: 100% !important;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.stage :deep(.folder-body) {
  flex: 1 !important;
  height: 0 !important;
  min-height: 0 !important;
  overflow: hidden !important;
  display: flex;
  flex-direction: column;
}

.stage :deep(.inner-folder) {
  flex: 1 !important;
  height: 100% !important;
  min-height: 0;
  max-height: 100% !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  display: flex;
  flex-direction: column;
}

.register-bar {
  flex: none;
}

.pane {
  display: grid;
  grid-template-columns: minmax(0, 1fr); 
  gap: 20px;
  padding: 15px 0;
  overflow-x: clip;                     
}



.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.section-title {
  margin: 0 0 4px;
  color: #fff;
  font: 400 20px/1.1 'HeaderFont', sans-serif;
  text-transform: uppercase;
}

.section-sub {
  margin: 0 0 12px;
  color: #fff;
  line-height: 1.4;
}

.section-title+.scroll,
.section-head+.scroll {
  margin-top: 9px;
}

.live {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #fff;
  font-weight: 700;
  text-transform: uppercase;
}

.live-text {
  padding-top: 4px;
}

.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--color-green);
  animation: pulse 1.8s infinite;
}


.link-box {
  display: flex;
  align-items: center;
  gap: 10px;
}

.link-input {
  flex: 1;
  min-width: 0;
  height: 35px;
  padding: 3px 16px 0;
  border: 0;
  border-radius: 999px;
  background-color: var(--color-white);
  color: var(--color-black);
  font: inherit;
}

.people {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.person {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  padding: 8px 12px;
  border-radius: 15px;
  background-color: var(--color-white);
  color: var(--color-black);
}

.person.asking {
  background: #fff;
  box-shadow: inset 0 0 0 2px var(--color-red);
}

.avatar {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  flex: none;
  border-radius: 50%;
  font-weight: 700;
  font-size: 13px;
  padding-top: 4px;
  position: relative;
}

.who {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-top: 2px;
}

.via {
  margin-left: 6px;
  opacity: 0.7;
  font-size: 13px;
}

.remove-x {
  display: grid;
  place-items: center;
  flex: none;
  width: 26px;
  height: 26px;
  padding: 2px 0 0;
  border: 0;
  border-radius: 50%;
  background: rgba(31, 42, 68, 0.1);
  color: var(--color-black);
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.x-text {
  padding: 1px 0 0 1px;
}

.remove-x:hover,
.remove-x:focus-visible {
  background-color: var(--color-red);
  color: #fff;
}

.roster-enter-active,
.roster-leave-active {
  transition: all 0.3s ease;
}

.roster-enter-from,
.roster-leave-to {
  opacity: 0;
  transform: translateX(-16px);
}

.flash {
  animation: flash 1.2s ease;
}

@keyframes flash {
  0%,
  60% {
    background: #fff;
  }
  100% {
    background-color: var(--color-white);
  }
}

@keyframes pulse {
  50% {
    opacity: 0.25;
  }
}

.events {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
}

.event {
  position: relative;
  display: block;
  cursor: pointer;
}

.event.used {
  cursor: not-allowed;
}

.event.used .event-body {
  background: rgba(240, 241, 247, 0.6);
}

.event.used .event-body> :not(.badge-pill) {
  opacity: 0.6;
}

.event-body {
  display: flex;
  flex-direction: column;
  gap: 10px; /* Spacing between title, date, venue, limits */
  padding: 16px;
  background-color: var(--color-white);
  border-radius: 15px;
  color: var(--color-black);
}

.event-details {
  gap: 10px;
}

.event-title {
  font-size: 16px;
  font-family: 'HeaderFont', sans-serif;
  text-transform: uppercase;
  margin-bottom: 4px; /* Extra separation below title */
}

.event-date,
.event-venue,
.event-meta {
  font-size: 13px;
  line-height: 1.3;
}

.event-body strong {
  font-size: 15px;
  font-family: 'HeaderFont', sans-serif;
  text-transform: uppercase;
}

.event-body>* {
  min-width: 0;
}

.event-body strong {
  font: 400 14px/1.2 'HeaderFont', sans-serif;
  text-transform: uppercase;
}

.event-meta {
  opacity: 0.8;
}

.event-body .badge-pill {
  margin-top: 4px;
  max-width: 100%;
}

.event input:checked+.event-body {
  border-color: var(--color-green);
  background: #fff;
}

.event input:focus-visible+.event-body {
  outline: 3px solid #fff;
  outline-offset: 2px;
}

.names {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.names li {
  padding: 4px 12px;
  padding-top: 6px;
  border-radius: 999px;
  background-color: var(--color-purple);
  color: var(--color-dark-purple);
  font-weight: 700;
}

.register-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 15px;
  margin-top: 15px;
  padding: 15px;
  border-radius: 15px;
  background-color: var(--color-white);
  color: var(--color-black);
}

.progress {
  flex: 1 1 200px;
  min-width: 0;
  padding: 20px;
  align-items: center;
}

.meter {
  height: 12px;
  border-radius: 999px;
  background: rgba(31, 42, 68, 0.15);
  overflow: hidden;
}

.meter i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background-color: var(--color-dark-blue);
  transition: width 0.4s ease;
}

.hint {
  margin: 8px 0 0;
  font-weight: 700;
}

.panel-wrap {
  grid-area: panel;
  position: relative;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

.side-panel {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  padding: 15px;
  padding-bottom: 0;
  border-radius: 25px;
  background-color: var(--color-grey);
  color: var(--color-black);
}

.panel-title {
  margin: 8px 0 15px;
  text-align: center;
  font: 400 20px/1.1 'HeaderFont', sans-serif;
  text-transform: uppercase;
}

/* Registered events panel: title stays put, only the list scrolls (same as "Coming up" in Activity Tracking) */
.side-panel-split {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.side-panel-split .panel-title {
  flex-shrink: 0;
}

.side-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-gutter: stable both-edges;
}

.evlist {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 12px;
}

.ev {
  display: grid;
  justify-items: start;
  gap: 6px;
  padding: 15px;
  border-radius: 15px;
  background-color: var(--color-white);
}

.ev-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  cursor: pointer;
  text-align: left;
}

.ev-title {
  font: 400 16px/1.15 'HeaderFont', sans-serif;
  text-transform: uppercase;
  overflow-wrap: anywhere;
}

.ev-meta {
  margin: 0;
  line-height: 1.6;
}

.chev {
  flex: none;
  width: 8px;
  height: 8px;
  margin: -3px 4px 0 0;
  border-right: 2px solid var(--color-black);
  border-bottom: 2px solid var(--color-black);
  border-radius: 2px;
  transform: rotate(45deg);
  opacity: 0.7;
  transition: transform 0.2s;
}

.chev.open {
  transform: rotate(-135deg);
  margin-top: 3px;
}

.stats {
  display: grid;
  gap: 8px;
  width: 100%;
  margin-top: 6px;
}

.stat {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 8px 4px 15px;
  border-radius: 999px;
  font-weight: 700;
  text-transform: uppercase;
}

.stat b {
  display: grid;
  place-items: center;
  min-width: 22px;
  height: 22px;
  padding: 3px 1px 0 0;
  margin-bottom: 4px;
  border-radius: 50%;
  color: #fff;
  font-weight: 700;
}

.stat-pending {
  background-color: var(--color-grey);
}

.stat-pending b {
  background-color: var(--color-dark-grey);
}

.stat-declined {
  background-color: var(--color-orange);
  color: var(--color-white);
}

.stat-accepted {
  background-color: var(--color-green);
  color: var(--color-dark-green);
}

.stat-declined b {
  background-color: var(--color-dark-orange);
  color: var(--color-white);
}
.stat-accepted b {
  background-color: var(--color-dark-green);
  color: var(--color-white);
}

.ev-empty {
  display: grid;
  justify-items: start;
  gap: 10px;
  padding: 15px;
  border-radius: 15px;
  background-color: var(--color-white);
}

.ev-empty p {
  margin: 0;
}

.pane-fill {
  flex: 1 1 auto;
  min-height: 0;
  grid-template-rows: minmax(0, 1fr);
}

.fill {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.fill .scroll {
  flex: 1 1 auto;
  min-height: 170px;
  max-height: none;
}

.day-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.day-panel .panel-title {
  margin-bottom: 3px;
}

.add-plan {
  margin-top: auto;
  margin-bottom: 15px;
  align-self: stretch;
}

.day-chips {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 6px;
  width: 100%;
}

.chip {
  padding: 5px 10px 4px;
  border-radius: 999px;
  background-color: var(--color-white);
  color: var(--color-black);
  font-size: 13px;
  overflow-wrap: anywhere;
}

.chip-joined b {
  background-color: var(--color-dark-green) !important;
}

.chip-lobby {
  background-color: var(--color-blue);
  color: var(--color-white);
  font-weight: 700;
}

.overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 15px;
  overflow-y: auto;
  background: rgba(31, 42, 68, 0.65);
}

.dialog {
  display: grid;
  gap: 8px;
  width: min(440px, 100%);
  padding: 15px;
  border-radius: 25px;
  background-color: var(--color-white);
  color: var(--color-black);
}

.dialog-title {
  margin: 0 0 4px;
  font: 400 16px/1.15 'HeaderFont', sans-serif;
}

.dialog p {
  margin: 0;
  line-height: 1.4;
}

.dialog-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.dialog :focus-visible {
  outline-color: var(--color-black);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.calendar-pane {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.filter-row .pitch-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 35px;
  padding: 3px 8px 0 16px;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  background-color: var(--color-purple);
  color: var(--color-dark-purple);
  font: 700 11px/1 'TextFont', sans-serif;
  text-transform: uppercase;
  transition: background-color 0.15s, transform 0.15s;
}

.filter-row .pitch-chip:hover {
  transform: translateY(-1px);
}

.filter-row .pitch-chip b {
  display: grid;
  place-items: center;
  min-width: 20px;
  height: 20px;
  padding: 2px 4px 0;
  border-radius: 50%;
  background-color: var(--color-dark-purple);
  color: var(--color-white);
  font-weight: 700;
}

/* selected: green, same as your accepted pills */
.filter-row .pitch-chip.on {
  background-color: var(--color-green);
  color: var(--color-dark-green);
}

.filter-row .pitch-chip.on b {
  background-color: var(--color-dark-green);
}

.empty-note {
  display: grid;
  justify-items: start;
  gap: 10px;
  padding: 15px;
  border-radius: 15px;
  background-color: var(--color-white);
  color: var(--color-black);
}

.empty-note p {
  margin: 0;
  line-height: 1.4;
}

@media (max-width: 1100px) {
  .app {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas: 'head' 'stage' 'panel';
    grid-template-rows: auto;
  }

  .panel-wrap {
    min-height: 0;
  }

  .side-panel {
    position: static;
    max-height: 480px;
  }

  .stage {
    min-height: 640px;
  }
}

@media (max-width: 720px) {
  .people {
    grid-template-columns: 1fr;
  }

  .head-bar {
    gap: 10px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .live-dot,
  .flash {
    animation: none;
  }

  .roster-enter-active,
  .roster-leave-active,
  .meter i,
  .btn,
  .chev,
  .remove-x {
    transition: none;
  }
}
</style>