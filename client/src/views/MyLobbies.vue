<!--
  MyLobbies.vue  (Vue 3, <script setup>)
  Every lobby you host or belong to, searchable and filterable.
  Emits: open(lobbyId), create, open-calendar
-->
<template>
  <div class="app theme-blue">
    <div class="heading">
      <div>
        <h2 class="page-title">My lobbies</h2>
        <p class="sub">{{ lobbies.length }} {{ lobbies.length === 1 ? 'lobby' : 'lobbies' }} across your events.</p>
      </div>
      <div class="heading-actions">
        <button class="btn btn-light" type="button" @click="$emit('open-calendar')">View my calendar</button>
        <button class="btn btn-navy" type="button" @click="$emit('create')">+ Create lobby</button>
      </div>
    </div>

    <!-- Find -->
    <section class="toolbar" aria-label="Find a lobby">
      <label class="search">
        <span class="sr">Search lobbies</span>
        <input v-model="q" type="search" placeholder="Search by name, event or friend" />
      </label>

      <div class="chips" role="group" aria-label="Filter lobbies">
        <button v-for="c in chips" :key="c.id" type="button" class="chip" :class="{ on: filter === c.id }"
                :aria-pressed="filter === c.id" @click="filter = c.id">
          {{ c.label }} <b>{{ c.count }}</b>
        </button>
      </div>

      <label class="select">
        <span class="sr">Filter by event</span>
        <select v-model="eventFilter">
          <option value="all">All events</option>
          <option v-for="e in events" :key="e.id" :value="e.id">{{ e.title }}</option>
          <option value="none">No event yet</option>
        </select>
      </label>
    </section>

    <p class="sr" aria-live="polite">{{ rows.length }} lobbies shown</p>

    <!-- Lobby cards -->
    <ul v-if="rows.length" class="grid">
      <li v-for="l in rows" :key="l.id">
        <button class="lobby" :class="{ reply: store.needsReply(l) }" type="button" @click="$emit('open', l.id)">
          <span class="top">
            <span class="name">{{ l.name }}</span>
            <span class="tag">{{ store.isHost(l) ? 'Host' : 'Member' }}</span>
          </span>

          <span v-if="store.needsReply(l)" class="badge badge-reply">Reply needed. {{ store.hostName(l) }} invited you.</span>

          <span class="desc">{{ l.description || 'No description.' }}</span>

          <span class="events">
            <template v-if="l.history.length">
              <span v-for="h in l.history" :key="h.id" class="event-chip done">✓ {{ eventTitle(h.eventId) }}</span>
            </template>
            <span v-else-if="l.pitchedEventId" class="event-chip">Pitched: {{ eventTitle(l.pitchedEventId) }}</span>
            <span v-else class="event-chip none">No event yet</span>
          </span>

          <span class="foot">
            <span class="stack" aria-hidden="true">
              <i v-for="m in l.members.slice(0, 4)" :key="m.id" :style="{ background: m.color || '#fdebd0' }">{{ initials(m.name) }}</i>
            </span>
            <span class="meta">
              {{ l.members.length }} {{ l.members.length === 1 ? 'member' : 'members' }}
              <template v-if="store.isHost(l)">, active {{ timeAgo(l.lastActiveAt) }}</template>
            </span>
            <span v-if="store.isInactive(l) && store.isHost(l)" class="badge badge-warn">Inactive</span>
          </span>
        </button>
      </li>
    </ul>

    <!-- Empty states -->
    <div v-else-if="!lobbies.length" class="empty">
      <h3>You're not in any lobbies yet</h3>
      <p>Create one to plan events with your friends, or wait for an invite.</p>
      <button class="btn btn-navy" type="button" @click="$emit('create')">+ Create lobby</button>
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

const chips = computed(() => [
  { id: 'all', label: 'All', count: lobbies.length },
  { id: 'hosting', label: 'Hosting', count: lobbies.filter(store.isHost).length },
  { id: 'joined', label: 'Joined', count: lobbies.filter((l) => !store.isHost(l)).length },
  { id: 'reply', label: 'Needs reply', count: lobbies.filter(store.needsReply).length },
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
  --paper: var(--color-grey, #f0f1f7);
  --blue: #567de6;
  --tile: #f2b16b;
  --cream: #fdebd0;
  --lime: #c9eb6c;
  --violet: #d98bf5;

  min-height: 100vh;
  max-height: 100vh;
  max-height: 100dvh;
  overflow-y: auto;
  display: grid;
  align-content: start;
  gap: 15px;
  padding: 15px;
  text-align: left;
  background: var(--blue);
  color: var(--ink);
  font-family: 'TextFont', sans-serif;
  font-size: 11px;
  box-sizing: border-box;
}
.app *, .app *::before, .app *::after { box-sizing: border-box; }
.app button, .app input, .app select { font-family: inherit; }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
:focus-visible { outline: 3px solid var(--ink); outline-offset: 2px; }

.btn { border: 0; border-radius: 999px; padding: 10px 20px; cursor: pointer; font: 700 11px/1 'TextFont', sans-serif; letter-spacing: 0.14em; text-transform: uppercase; background: var(--ink); color: #fff; transition: transform 0.15s; }
.btn:hover { transform: translateY(-1px); }
.btn-navy { background: #3f48cc; }
.btn-ghost { background: transparent; color: var(--ink); box-shadow: inset 0 0 0 2px var(--ink); }
.btn-light { background: transparent; color: #fff; box-shadow: inset 0 0 0 2px #fff; }

.heading { display: flex; align-items: center; justify-content: space-between; gap: 15px; flex-wrap: wrap; }
.page-title { margin: 0; color: #fff; font: 400 25px/1.1 'HeaderFont', sans-serif; letter-spacing: 0.02em; text-transform: uppercase; }
.sub { margin: 4px 0 0; color: #fff; }
.heading-actions { display: flex; gap: 8px; flex-wrap: wrap; }

/* find */
.toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; padding: 15px; border-radius: 25px; background: var(--paper); }
.search { flex: 1 1 240px; }
.search input, .select select { width: 100%; height: 34px; padding: 0 14px; border: 0; border-radius: 999px; background: #fff; color: var(--ink); font-size: 11px; }
.select { flex: 0 1 180px; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border: 0; border-radius: 999px; background: #fff; color: var(--ink); cursor: pointer; font: 700 11px/1 'TextFont', sans-serif; letter-spacing: 0.08em; text-transform: uppercase; }
.chip b { padding: 2px 6px; border-radius: 999px; background: rgba(31, 42, 68, 0.12); font-weight: 700; }
.chip.on { background: var(--ink); color: #fff; }
.chip.on b { background: rgba(255, 255, 255, 0.25); }

/* cards */
.grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 15px; }
.lobby {
  display: grid; align-content: start; gap: 8px; width: 100%; height: 100%;
  padding: 15px; border: 0; border-radius: 15px; background: var(--tile); color: var(--ink);
  text-align: left; cursor: pointer; font-size: 11px; transition: transform 0.15s;
}
.lobby:hover { transform: translateY(-2px); }
.lobby.reply { background: var(--cream); box-shadow: inset 0 0 0 3px var(--violet); }
.lobby > span { display: block; }
.top { display: flex !important; align-items: center; justify-content: space-between; gap: 8px; }
.name { font: 400 16px/1.15 'HeaderFont', sans-serif; letter-spacing: 0.03em; overflow-wrap: anywhere; }
.tag { padding: 2px 8px; border-radius: 999px; background: var(--cream); font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; flex: none; }
.lobby.reply .tag { background: var(--tile); }
.desc { display: -webkit-box !important; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.4; min-height: 2.8em; }
.events { display: flex !important; flex-wrap: wrap; gap: 6px; }
.event-chip { padding: 4px 10px; border-radius: 999px; background: #fff; font-weight: 700; letter-spacing: 0.04em; }
.event-chip.done { background: var(--lime); }
.event-chip.none { background: transparent; box-shadow: inset 0 0 0 2px rgba(31, 42, 68, 0.3); font-weight: 400; }
.badge { display: inline-block !important; width: fit-content; padding: 4px 10px; border-radius: 999px; font-weight: 700; letter-spacing: 0.04em; }
.badge-reply { background: var(--violet); }
.badge-warn { background: #ffd9a8; }
.foot { display: flex !important; align-items: center; gap: 8px; margin-top: 4px; padding-top: 8px; border-top: 2px dashed rgba(31, 42, 68, 0.25); flex-wrap: wrap; }
.stack { display: flex !important; }
.stack i { display: grid; place-items: center; width: 24px; height: 24px; margin-left: -6px; border: 2px solid var(--tile); border-radius: 50%; font-style: normal; font-weight: 700; font-size: 11px; }
.lobby.reply .stack i { border-color: var(--cream); }
.stack i:first-child { margin-left: 0; }
.meta { flex: 1; }

.empty { display: grid; justify-items: center; gap: 8px; padding: 30px 15px; border-radius: 25px; background: var(--paper); text-align: center; }
.empty h3 { margin: 0; font: 400 16px/1.2 'HeaderFont', sans-serif; }
.empty p { margin: 0 0 6px; }

@media (prefers-reduced-motion: reduce) { .btn, .lobby { transition: none; } }
</style>