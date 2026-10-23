<!--
  MyLobbies.vue  (Vue 3, <script setup>)
  Every lobby you host or belong to, searchable and filterable.
  The header (title, create button, search, filters, event dropdown) stays pinned while the cards scroll.
  Emits: open(lobbyId), create, open-calendar
-->
<template>
  <div class="app theme-blue">
    <!-- Pinned header: stays visible while the cards scroll underneath -->
    <header class="sticky">
      <div class="heading">
        <h2 class="page-title">My lobbies</h2>
        <button class="btn btn-lime" type="button" @click="$emit('create')">+ Create lobby</button>
      </div>

      <section class="toolbar" aria-label="Find a lobby">
        <label class="search">
          <span class="sr">Search lobbies</span>
          <input v-model="q" type="search" placeholder="Search by name, event, or friend" />
        </label>

        <div class="chips" role="group" aria-label="Filter lobbies">
          <button v-for="c in chips" :key="c.id" type="button" class="chip" :class="[`chip-${c.id}`, { on: filter === c.id }]"
                  :aria-pressed="filter === c.id" @click="filter = c.id">
            {{ c.label }} <b>{{ c.count }}</b>
          </button>
        </div>

        <BaseInput v-model="eventFilter" class="event-select" type="select" :options="eventOptions" />
      </section>
    </header>

    <p class="sr" aria-live="polite">{{ rows.length }} lobbies shown</p>

    <!-- Lobby cards -->
    <ul v-if="rows.length" class="grid">
      <li v-for="l in rows" :key="l.id">
        <button class="lobby" type="button" @click="$emit('open', l.id)">
          <span class="top">
            <span class="name">{{ l.name }}</span>
            <span class="badge-pill" :class="roleClass(l)">{{ roleLabel(l) }}</span>
          </span>

          <span v-if="store.needsReply(l)" class="badge-pill badge-reply">Reply needed. {{ store.hostName(l) }} invited you.</span>

          <span class="events">
            <span v-for="line in eventLines(l)" :key="line" class="event-line">{{ line }}</span>
          </span>

          <span class="desc">{{ l.description || 'No description.' }}</span>

          <span class="foot">
            <span class="stack" aria-hidden="true">
              <i v-for="m in l.members.slice(0, 4)" :key="m.id" :style="{ background: m.color || '#fdebd0' }">{{ initials(m.name) }}</i>
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
      <button class="btn btn-lime" type="button" @click="$emit('create')">+ Create lobby</button>
    </div>
    <div v-else class="empty">
      <h3>No lobbies match</h3>
      <p>Try a different search or clear the filters.</p>
      <button class="btn btn-ghost" type="button" @click="clear">Clear filters</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import BaseInput from '../components/BaseInput.vue'
import { useLobbies, EVENTS, timeAgo } from '../components/useLobbies'

defineEmits(['open', 'create', 'open-calendar'])

const store = useLobbies()
const lobbies = store.lobbies
const events = EVENTS

const q = ref('')
const filter = ref('all')
const eventFilter = ref('all')

const eventTitle = (id) => events.find((e) => e.id === id)?.title ?? 'Event'
const initials = (name) => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

/* options for the BaseInput dropdown */
const eventOptions = [
  { label: 'All events', value: 'all' },
  ...events.map((e) => ({ label: e.title, value: e.id })),
  { label: 'No event yet', value: 'none' },
]

/* card pill: Pending (invite waiting for you) / Host / Member, same colours as the filters */
const roleLabel = (l) => (store.needsReply(l) ? 'Needs Reply' : store.isHost(l) ? 'Host' : 'Member')
const roleClass = (l) => (store.needsReply(l) ? 'pill-pending' : store.isHost(l) ? 'pill-host' : 'pill-member')

function metaText(l) {
  const n = `${l.members.length} ${l.members.length === 1 ? 'member' : 'members'}`
  return store.isHost(l) ? `${n}, active ${timeAgo(l.lastActiveAt)}` : n
}

/* plain text event lines, like the design */
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

const chips = computed(() => [
  { id: 'all', label: 'All', count: lobbies.length },
  { id: 'hosting', label: 'Hosting', count: lobbies.filter(store.isHost).length },
  { id: 'joined', label: 'Joined', count: lobbies.filter((l) => !store.isHost(l)).length },
  { id: 'reply', label: 'Needs Reply', count: lobbies.filter(store.needsReply).length },
])

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

/* invites you still need to answer first, then most recently active */
const rows = computed(() =>
  lobbies
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
/* Design-system rules: outer boxes 25px, inner boxes 15px, 15px padding, title 25px, text 11px. */
.app {
  --ink: var(--color-black, #1f2a44);
  --grey: var(--color-grey, #dde3f1);
  --white: var(--color-white, #ffffff);
  --blue: #5d6be4;
  --dark-blue: var(--color-dark-blue, #3f48cc);
  --lime: #c9eb6c;
  --orange: #ee8559;
  --purple: #c777f0;

  position: relative;
  max-height: 100vh;
  max-height: 100dvh;
  overflow-y: auto;
  padding: 0 15px 15px;          /* no top padding: the pinned header supplies it */
  border-radius: 25px;
  text-align: left;
  background: var(--blue);       /* fallback; theme-blue provides this in the design system */
  color: var(--ink);
  font-family: 'TextFont', sans-serif;
  font-size: 11px;
  box-sizing: border-box;
}
.app *, .app *::before, .app *::after { box-sizing: border-box; }
.app button, .app input { font-family: inherit; }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
:focus-visible { outline: 3px solid var(--ink); outline-offset: 2px; }

/* ── Pinned header ── */
.sticky {
  position: sticky; top: 0; z-index: 10;
  display: grid; gap: 15px;
  padding: 15px 0;
  background: var(--blue);       /* solid, so cards scroll underneath it */
}
.heading { display: flex; align-items: center; justify-content: space-between; gap: 15px; flex-wrap: wrap; }
.page-title { margin: 0; color: #fff; font: 400 25px/1.1 'HeaderFont', sans-serif; letter-spacing: 0.02em; text-transform: uppercase; }

/* ── Buttons ── */
.btn {
  --nudge: 2px;   /* pushes the label down so it sits in the middle; tune to your font */
  padding: calc(14px + var(--nudge)) 28px calc(14px - var(--nudge));
  border: 0; border-radius: 999px; cursor: pointer;
  font: 700 11px/1 'TextFont', sans-serif; letter-spacing: 0.14em; text-transform: uppercase;
  background: var(--dark-blue); color: #fff; transition: transform 0.15s;
}
.btn:hover { transform: translateY(-1px); }
.btn-lime { background: var(--lime); color: var(--ink); }
.btn-ghost { background: transparent; color: var(--ink); box-shadow: inset 0 0 0 2px var(--ink); }

/* ── Search, filter pills, event dropdown ── */
.toolbar {
  display: flex; flex-wrap: wrap; align-items: center; gap: 10px;
  padding: 15px; border-radius: 25px; background: rgba(255, 255, 255, 0.14);
}
.search { flex: 1 1 200px; }
.search input {
  width: 100%; height: 35px; padding: 3px 16px 0; border: 1px solid transparent; border-radius: 999px;
  background: var(--grey); color: var(--ink); font-size: 11px;
}
.search input::placeholder { color: var(--ink); opacity: 0.6; }
.search input:focus { background: #fff; border-color: var(--dark-blue); outline: none; }

.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip {
  display: inline-flex; align-items: center; gap: 8px; height: 35px; padding: 3px 8px 0 16px;
  border: 0; border-radius: 999px; cursor: pointer;
  background: var(--grey); color: #566080;
  font: 700 11px/1 'TextFont', sans-serif; letter-spacing: 0.1em; text-transform: uppercase;
  transition: background 0.15s, color 0.15s;
}
.chip b {
  display: grid; place-items: center; width: 20px; height: 20px; padding-top: 2px;
  border-radius: 50%; background: var(--dark-blue); color: #fff; font-weight: 700;
}
/* active: each filter has its own colour, matching the card pills */
.chip.on { color: #fff; }
.chip.on b { background: rgba(0, 0, 0, 0.28); }
.chip-all.on { background: var(--purple); }
.chip-hosting.on { background: var(--dark-blue); }
.chip-joined.on { background: var(--lime); color: var(--ink); }
.chip-reply.on { background: var(--orange); }

/* the BaseInput dropdown, restyled to match the toolbar */
.event-select { flex: 0 0 190px; }
.toolbar .event-select :deep(.base-field) { border-radius: 999px; min-height: 35px; padding: 3px 16px 0; font-size: 11px; }
.toolbar .event-select :deep(.dropdown-trigger) { text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; }
.toolbar .event-select :deep(.dropdown-options-menu) {
  position: absolute; top: 100%; left: 0; right: 0; margin-top: 6px;   /* float over the cards instead of pushing them */
  z-index: 30; text-transform: uppercase; letter-spacing: 0.08em;
}
.toolbar .event-select :deep(.dropdown-option-item) { font-size: 11px; }

/* ── Pills (one style for every badge) ── */
.badge-pill {
  display: inline-block;
  height: 22px;
  border-radius: 9999px;
  background-color: var(--grey);
  padding: 5px 12px 8px 12px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
}
.pill-host { background: var(--dark-blue); color: #fff; }
.pill-member { background: var(--lime); }
.pill-pending { background: var(--orange); color: #fff; }
.badge-reply { height: auto; min-height: 22px; background: var(--purple); color: #fff; white-space: normal; letter-spacing: 0.04em; text-transform: none; }
.badge-warn { background: red; color: #fff; }

/* ── Cards ── */
.grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 15px; }
.lobby {
  display: flex; flex-direction: column; align-items: flex-start; gap: 10px; width: 100%; height: 100%;
  padding: 15px; border: 0; border-radius: 25px; background: var(--white); color: var(--ink);
  text-align: left; cursor: pointer; font-size: 11px; transition: transform 0.15s;
}
.lobby:hover { transform: translateY(-2px); }
.top { display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; }
.name { font: 400 20px/1.1 'HeaderFont', sans-serif; letter-spacing: 0.03em; text-transform: uppercase; overflow-wrap: anywhere; }
.events { display: grid; gap: 2px; }
.event-line { font-size: 13px; letter-spacing: 0.04em; }
.desc {
  flex: none; margin-bottom: 6px;
  display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  line-height: 1.4; min-height: 2.8em; opacity: 0.85;
}
.foot {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap; width: 100%;
  margin-top: auto; padding-top: 12px; border-top: 2px dashed rgba(31, 42, 68, 0.2);
}
.stack { display: flex; }
.stack i {
  display: grid; place-items: center; width: 30px; height: 30px; margin-left: -8px;
  border: 2px solid var(--white); border-radius: 50%; font-style: normal; font-weight: 700; font-size: 11px;
}
.stack i:first-child { margin-left: 0; }
.meta { flex: 1; letter-spacing: 0.04em; }

.empty { display: grid; justify-items: center; gap: 8px; padding: 30px 15px; border-radius: 25px; background: var(--white); text-align: center; }
.empty h3 { margin: 0; font: 400 16px/1.2 'HeaderFont', sans-serif; }
.empty p { margin: 0 0 6px; }

@media (prefers-reduced-motion: reduce) { .btn, .lobby, .chip { transition: none; } }
</style>