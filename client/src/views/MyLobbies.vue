<!--
  MyLobbies.vue  (Vue 3, <script setup>)
  Every lobby you host or belong to, searchable and filterable.
  The header (title, create button, search, filters, event dropdown) stays pinned while the cards scroll.
  Emits: open(lobbyId), create, open-calendar
-->
<template>
  <div class="app">
    <!-- Pinned header: stays visible while the cards scroll underneath -->
    <header class="sticky">
      <div class="heading">
        <h2 class="page-title">My lobbies</h2>
        <BaseButton class="theme-green" @click="$emit('create')">+ Create lobby</BaseButton>
      </div>

      <section class="toolbar" aria-label="Find a lobby">
        <label class="search">
          <span class="sr">Search lobbies</span>
          <input v-model="q" type="search" placeholder="Search by name, event, or friend" />
        </label>

        <div class="chips" role="group" aria-label="Filter lobbies">
          <button v-for="c in chips" :key="c.id" type="button" class="chip"
            :class="[`chip-${c.id}`, { on: filter === c.id }]" :aria-pressed="filter === c.id" @click="filter = c.id">
            {{ c.label }} <b>{{ c.count }}</b>
          </button>
        </div>

        <BaseInput v-model="eventFilter" class="event-select" type="select" :options="eventOptions" />
      </section>
    </header>

    <p class="sr" aria-live="polite">{{ rows.length }} lobbies shown</p>

    <!-- Scrollable Content Area -->
    <div class="content-scroll-area">
      <!-- Lobby cards -->
      <ul v-if="rows.length" class="grid">
        <li v-for="l in rows" :key="l.id">
          <button class="lobby" type="button" @click="$emit('open', l.id)">
            <span class="lobby-info">
              <span class="top">
                <span class="name">{{ l.name }}</span>
                <span class="badge-pill" :class="roleClass(l)">{{ roleLabel(l) }}</span>
              </span>
              <span v-if="store.needsReply(l)" class="badge-pill badge-reply">Reply needed. {{ store.hostName(l) }}
                invited
                you.</span>
              <span class="events">
                <span v-for="line in eventLines(l)" :key="line" class="event-line">{{ line }}</span>
              </span>
              <span class="desc">{{ l.description || 'No description.' }}</span>
            </span>

            <span class="foot">
              <span class="stack" aria-hidden="true">
                <i v-for="m in activeMembers(l).slice(0, 4)" :key="m.id"
                  :style="{ background: m.color || 'var(--color-white)' }">{{
                    initials(m.name) }}
                  <AvatarPic :path="m.avatar" />
                </i>
              </span>
              <span class="meta">{{ metaText(l) }}</span>
              <span v-if="store.isInactive(l) && store.isHost(l)" class="badge-pill badge-warn">Inactive</span>
            </span>
          </button>
        </li>
      </ul>

      <!-- Empty states -->
      <div v-else-if="!lobbies.length" class="empty">
        <h3>You're not in any lobbies yet</h3>
        <p>Create one to plan events with your friends, or wait for an invite.</p>
        <BaseButton class="theme-green" @click="$emit('create')">+ Create lobby</BaseButton>
      </div>
      <div v-else class="empty">
        <h3>No lobbies match</h3>
        <p>Try a different search or clear the filters.</p>
        <BaseButton variant="outline-main" @click="clear">Clear filters</BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import BaseInput from '../components/BaseInput.vue'
import { useLobbies, timeAgo } from '../composables/useLobbies.js'
import BaseButton from '../components/BaseButton.vue';
import AvatarPic from '../components/AvatarPic.vue'

defineEmits(['open', 'create', 'open-calendar'])

const store = useLobbies()
const lobbies = store.lobbies
const events = store.events

const q = ref('')
const filter = ref('all')
const eventFilter = ref('all')

const eventTitle = (id) => events.find((e) => e.id === id)?.title ?? 'Event'
const initials = (name) => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

const eventOptions = computed(() => {
  const ids = new Set(
    lobbies.flatMap((l) => [...l.history.map((h) => h.eventId), l.pitchedEventId]).filter(Boolean)
  )
  return [
    { label: 'All events', value: 'all' },
    ...events.filter((e) => ids.has(e.id)).map((e) => ({ label: e.title, value: e.id })),
    { label: 'No event yet', value: 'none' },
  ]
})

const roleLabel = (l) => (store.needsReply(l) ? 'Needs Reply' : store.isHost(l) ? 'Host' : 'Member')
const roleClass = (l) => (store.needsReply(l) ? 'pill-pending' : store.isHost(l) ? 'pill-host' : 'pill-member')

function eventLines(l) {
  const lines = []
  if (l.pitchedEventId && !l.registered) lines.push(`Pitched: ${eventTitle(l.pitchedEventId)}`)
  if (l.history.length) {
    const titles = [...new Set(l.history.map((h) => eventTitle(h.eventId)))].join(', ')
    lines.push(`${l.history.length > 1 ? 'Events' : 'Event'}: ${titles}`)
  }
  if (!lines.length) lines.push('No event yet.')
  return lines
}


function matches(l) {
  if (filter.value === 'hosting' && !store.isHost(l)) return false
  if (filter.value === 'joined' && store.isHost(l)) return false
  if (filter.value === 'reply' && !store.needsReply(l)) return false

  const ev = eventFilter.value
  const eventIds = [...l.history.map((h) => h.eventId), l.pitchedEventId].filter(Boolean)
  if (ev === 'none' && eventIds.length) return false
  if (ev !== 'all' && ev !== 'none' && !eventIds.includes(ev)) return false

  const term = q.value.trim().toLowerCase()
  if (!term) return true
  const hay = [l.name, l.description, ...eventIds.map(eventTitle), ...l.members.map((m) => m.name)].join(' ').toLowerCase()
  return hay.includes(term)
}

// Added a helper to get unique, non-declined members for a lobby card
function activeMembers(l) {
  const map = new Map()
  l.members
    ?.filter(m => m.status !== 'declined')
    .forEach(m => map.set(m.id, m))
  return Array.from(map.values())
}

function metaText(l) {
  const members = activeMembers(l)
  const n = `${members.length} ${members.length === 1 ? 'member' : 'members'}`
  return store.isHost(l) ? `${n}, active ${timeAgo(l.lastActiveAt)}` : n
}

const userLobbies = computed(() => {
  return lobbies.filter((l) => {
    if (store.isHost(l)) return true
    const me = l.members.find((m) => m.id === store.meId())
    // Hide lobby completely if user declined
    return me && me.status !== 'declined'
  })
})

const chips = computed(() => [
  { id: 'all', label: 'All', count: userLobbies.value.length },
  { id: 'hosting', label: 'Hosting', count: userLobbies.value.filter(store.isHost).length },
  { id: 'joined', label: 'Joined', count: userLobbies.value.filter((l) => !store.isHost(l)).length },
  { id: 'reply', label: 'Needs Reply', count: userLobbies.value.filter(store.needsReply).length },
])


const rows = computed(() =>
  userLobbies.value
    .filter(matches)
    .slice()
    .sort((a, b) => Number(store.needsReply(b)) - Number(store.needsReply(a)) || b.lastActiveAt - a.lastActiveAt)
)

function clear() {
  q.value = ''
  filter.value = 'all'
  eventFilter.value = 'all'
}
</script>

<style scoped>
.app {
  position: relative;
  width: 100%;
  max-width: 1450px;
  height: 100vh;
  max-height: 100vh;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  text-align: left;
  font-family: 'TextFont', sans-serif;
  font-size: 11px;
  box-sizing: border-box;
}

.app *,
.app *::before,
.app *::after {
  box-sizing: border-box;
}

.app button,
.app input {
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

/* ── Pinned header ── */
.sticky {
  flex-shrink: 0;
  display: grid;
  gap: 15px;
  margin-bottom: 15px;
}

.heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  flex-wrap: wrap;
}

.page-title {
  margin: 0;
  padding-left: 8px;
  color: #fff;
  font: 400 25px/1.1 'HeaderFont', sans-serif;
  text-transform: uppercase;
}

/* ── Scrollable Area for Cards ── */
.content-scroll-area {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px;
  /* Sedikit spasi buat scrollbar */
}

/* ── Search, filter pills, event dropdown ── */
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 15px;
  border-radius: 25px;
  background: var(--color-white);
}

.search {
  flex: 1 1 200px;
}

.search input {
  width: 100%;
  height: 35px;
  padding: 3px 16px 0;
  border: 1px solid transparent;
  border-radius: 999px;
  background-color: var(--color-grey);
  color: var(--color-black);
  font-size: 11px;
}

.search input::placeholder {
  color: var(--color-black);
  opacity: 0.6;
}

.search input:focus {
  background: #fff;
  border-color: var(--color-dark-blue);
  outline: none;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 35px;
  padding: 5px 8px 0 16px;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  background-color: var(--color-grey);
  color: #566080;
  font: 700 11px/1 'TextFont', sans-serif;
  text-transform: uppercase;
  transition: background 0.15s, color 0.15s;
}

.chip b {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  padding-top: 3px;
  margin-bottom: 5px;
  border-radius: 50%;
  background-color: var(--color-dark-grey);
  color: #fff;
  font-weight: 700;
}

.chip.on {
  color: var(--color-white);
}

.chip-all.on b {
  background-color: var(--color-dark-purple);
  color: var(--color-white);
}

.chip-hosting.on b {
  background-color: var(--color-dark-blue);
  color: var(--color-white);
}

.chip-joined.on b {
  background-color: var(--color-dark-green);
  color: var(--color-white);
}

.chip-reply.on b {
  background-color: var(--color-dark-orange);
  color: var(--color-white);
}

.chip-all.on {
  background-color: var(--color-purple);
  color: var(--color-dark-purple);
}

.chip-hosting.on {
  background-color: var(--color-blue);
}

.chip-joined.on {
  background-color: var(--color-green);
  color: var(--color-dark-green);
}

.chip-reply.on {
  background-color: var(--color-orange);
}

.event-select {
  flex: 0 0 190px;
}

.toolbar .event-select :deep(.base-field) {
  border-radius: 999px;
  min-height: 35px;
  padding: 3px 16px 0;
  font-size: 11px;
}

.toolbar .event-select :deep(.dropdown-trigger) {
  text-transform: uppercase;
  font-weight: 700;
}

.toolbar .event-select :deep(.dropdown-options-menu) {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 6px;
  z-index: 30;
  text-transform: uppercase;
}

.toolbar .event-select :deep(.dropdown-option-item) {
  font-size: 11px;
}

.badge-pill {
  display: inline-block;
  height: 22px;
  border-radius: 9999px;
  background-color: var(--color-grey);
  padding: 5px 12px 8px 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  white-space: nowrap;
}

.pill-host {
  background-color: var(--color-blue);
  color: #fff;
}

.pill-member {
  background-color: var(--color-green);
  color: var(--color-black);
}

.pill-pending {
  background-color: var(--color-orange);
  color: #fff;
}

.badge-reply {
  height: auto;
  min-height: 22px;
  background-color: var(--color-purple);
  color: #fff;
  white-space: normal;
  text-transform: none;
}

.badge-warn {
  background-color: var(--color-red);
  color: #fff;
}

/* ── Cards Grid ── */
.grid {
  list-style: none;
  margin: 0 0 20px 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 15px;
}

.lobby {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  height: 100%;
  padding: 15px;
  border: 0;
  border-radius: 25px;
  background-color: var(--color-white);
  color: var(--color-black);
  text-align: left;
  cursor: pointer;
  font-size: 11px;
  transition: transform 0.15s;
}

.lobby-info {
  margin: 10px;
  margin-bottom: 0;
}

.lobby:hover {
  transform: translateY(-2px);
}

.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  margin-bottom: 10px;
}

.name {
  font: 400 20px/1.1 'HeaderFont', sans-serif;
  text-transform: uppercase;
  overflow-wrap: anywhere;
}

.events {
  display: grid;
  gap: 2px;
}

.event-line {
  font-size: 13px;
  margin-bottom: 10px;
}

.desc {
  flex: none;
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
  min-height: 2.8em;
  opacity: 0.85;
}

.foot {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  width: 100%;
  margin-top: auto;
  padding-top: 12px;
  border-top: 2px dashed rgba(31, 42, 68, 0.2);
}

.stack {
  display: flex;
}

.stack i {
  position: relative;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  margin-left: -8px;
  border: 2px solid var(--color-white);
  border-radius: 50%;
  font-style: normal;
  font-weight: 700;
  font-size: 11px;
  padding-top: 4px;
}

.stack i:first-child {
  margin-left: 0;
}

.meta {
  flex: 1;
}

.empty {
  display: grid;
  justify-items: center;
  gap: 8px;
  padding: 30px 15px;
  border-radius: 25px;
  background-color: var(--color-white);
  color: var(--color-dark-grey);
  text-align: center;
}

.empty h3 {
  margin: 0;
  font: 400 16px/1.2 'HeaderFont', sans-serif;
}

.empty p {
  margin: 0 0 6px;
}

@media (prefers-reduced-motion: reduce) {

  .btn,
  .lobby,
  .chip {
    transition: none;
  }
}
</style>