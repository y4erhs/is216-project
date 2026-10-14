<!--
  EventLobby.vue  (Vue 3, <script setup>)
  Lobby-style invitation system for Campus Compass.

  Flow:  Invite (friends list / share link)  ->  Roster (live statuses)  ->  Register (pitch event + one-click Register Group)

  Replace the DEMO parts (marked "DEMO") with your real backend / websocket.
-->
<template>
  <div class="app">
    <!-- ───────────── Page heading ───────────── -->
    <div class="heading">
      <h2 class="page-title">Lobby</h2>
      <button class="btn btn-navy" type="button">View my calendar</button>
    </div>

    <!-- ───────────── Folder (main stage) ───────────── -->
    <main class="stage">
      <div class="tabs" role="tablist" aria-label="Lobby steps" @keydown="onTabKey">
        <button v-for="t in tabs" :key="t.id" :id="`tab-${t.id}`" role="tab" type="button"
                class="tab" :class="[`tab-${t.id}`, { 'tab-active': tab === t.id }]"
                :aria-selected="tab === t.id" :aria-controls="`pane-${t.id}`"
                :tabindex="tab === t.id ? 0 : -1" @click="tab = t.id">
          {{ t.label }}
        </button>
      </div>

      <div class="folder">
        <!-- ===== Invite ===== -->
        <section v-show="tab === 'invite'" id="pane-invite" class="pane" role="tabpanel" aria-labelledby="tab-invite">
          <div class="cols">
            <div class="card">
              <h3 class="card-title">Invite friends</h3>
              <p class="card-sub">Pick people from your friends list.</p>
              <ul class="list">
                <li v-for="f in friends" :key="f.id" class="row">
                  <span class="chip-avatar" :style="{ background: f.color }">{{ initials(f.name) }}</span>
                  <span class="grow">{{ f.name }}</span>
                  <button class="btn btn-small" type="button" :disabled="isInvited(f.id) || locked"
                          @click="invite(f)">
                    {{ isInvited(f.id) ? 'Invited' : 'Invite' }}
                  </button>
                </li>
              </ul>
            </div>

            <div class="card">
              <h3 class="card-title">Share an invite link</h3>
              <p class="card-sub">Anyone with the link can join the lobby and reply.</p>
              <div class="link-box">
                <input class="link-input" readonly :value="inviteLink" aria-label="Invite link" @focus="$event.target.select()" />
                <button class="btn btn-small" type="button" @click="copyLink">{{ copied ? 'Copied' : 'Copy' }}</button>
              </div>

              <!-- DEMO: remove in production. Simulates someone opening the link. -->
              <button v-if="demo" class="btn btn-ghost btn-small demo-btn" type="button" :disabled="locked" @click="demoLinkJoin">
                Demo: someone opens the link
              </button>
            </div>
          </div>
          <div class="pane-actions">
            <button class="btn btn-navy" type="button" @click="tab = 'roster'">See who's in</button>
          </div>
        </section>

        <!-- ===== Roster ===== -->
        <section v-show="tab === 'roster'" id="pane-roster" class="pane" role="tabpanel" aria-labelledby="tab-roster">
          <div class="card">
            <div class="card-head">
              <h3 class="card-title">Who's in</h3>
              <span class="live"><i class="live-dot"></i>Updates live</span>
            </div>

            <TransitionGroup name="roster" tag="ul" class="list" aria-live="polite">
              <li v-for="m in members" :key="m.id" class="row" :class="{ flash: flashIds.has(m.id) }">
                <span class="chip-avatar" :style="{ background: m.color || '#fdebd0' }">{{ initials(m.name) }}</span>
                <span class="grow">
                  {{ m.name }}
                  <small v-if="m.host" class="tag">Host</small>
                  <small v-else-if="m.via === 'link'" class="tag">Via link</small>
                </span>
                <span class="status" :class="`status-${m.status}`">
                  <span aria-hidden="true">{{ statusIcon[m.status] }}</span>{{ statusLabel[m.status] }}
                </span>
                <!-- DEMO: opens the screen this person sees -->
                <button v-if="demo && !m.host" class="btn btn-ghost btn-small" type="button" @click="viewingId = m.id">Their view</button>
                <button v-if="!m.host && !locked" class="icon-btn" type="button"
                        :aria-label="`Remove ${m.name}`" @click="removeMember(m.id)">✕</button>
              </li>
            </TransitionGroup>

            <p v-if="members.length === 1" class="empty">No one invited yet. Add friends or share the link.</p>
          </div>
          <div class="pane-actions">
            <button class="btn btn-ghost" type="button" @click="tab = 'invite'">Invite more</button>
            <button class="btn btn-navy" type="button" @click="tab = 'register'">Pitch an event</button>
          </div>
        </section>

        <!-- ===== Register ===== -->
        <section v-show="tab === 'register'" id="pane-register" class="pane" role="tabpanel" aria-labelledby="tab-register">
          <div v-if="registered" class="card done">
            <h3 class="card-title">Group registered</h3>
            <p class="card-sub">{{ selectedEvent.title }} on {{ selectedEvent.date }}. These people are signed up:</p>
            <ul class="names">
              <li v-for="m in acceptedMembers" :key="m.id">{{ m.name }}</li>
            </ul>
          </div>

          <template v-else>
            <div class="card">
              <h3 class="card-title">Pitch an event to the lobby</h3>
              <p class="card-sub">Friends can still accept or decline while you choose.</p>
              <div class="events" role="radiogroup" aria-label="Events">
                <label v-for="e in events" :key="e.id" class="event">
                  <input class="sr" type="radio" name="event" :value="e.id" v-model="selectedEventId" />
                  <span class="event-body">
                    <strong>{{ e.title }}</strong>
                    <span>{{ e.date }} at {{ e.venue }}</span>
                    <span class="event-meta">{{ e.slotsLeft }} slots left. Groups of {{ e.minGroup }} to {{ e.maxGroup }}.</span>
                  </span>
                </label>
              </div>
            </div>

            <div class="register-bar">
              <div class="progress" v-if="selectedEvent">
                <div class="meter" role="progressbar" :aria-valuenow="acceptedMembers.length"
                     aria-valuemin="0" :aria-valuemax="selectedEvent.minGroup">
                  <i :style="{ width: progress + '%' }"></i>
                </div>
                <p class="hint">{{ registerHint }}</p>
              </div>
              <p v-else class="hint">Choose an event to start.</p>

              <button class="btn btn-navy btn-big" type="button" :disabled="!canRegister" @click="registerGroup">
                Register group
              </button>
            </div>
          </template>
        </section>
      </div>
    </main>

    <!-- ───────────── Right panel ───────────── -->
    <aside class="side-panel" aria-label="Lobby status">
      <h3 class="panel-title">Lobby status</h3>

      <div class="pitch" v-if="selectedEvent">
        <p class="pitch-label">Pitched event</p>
        <strong>{{ selectedEvent.title }}</strong>
        <span>{{ selectedEvent.date }}</span>
        <span>{{ selectedEvent.venue }}</span>
      </div>
      <div class="pitch pitch-empty" v-else>
        <p>No event pitched yet.</p>
        <button class="btn btn-small" type="button" @click="tab = 'register'">Choose event</button>
      </div>

      <dl class="counts">
        <div class="count count-accepted"><dt>Accepted</dt><dd>{{ acceptedMembers.length }}</dd></div>
        <div class="count count-pending"><dt>Pending</dt><dd>{{ counts.pending }}</dd></div>
        <div class="count count-declined"><dt>Declined</dt><dd>{{ counts.declined }}</dd></div>
      </dl>
    </aside>

    <!-- What an invited friend (or someone opening the link) sees -->
    <Transition name="fade">
      <div v-if="viewingMember" class="overlay" role="dialog" aria-modal="true" aria-label="Invitation"
           @click.self="viewingId = null">
        <LobbyInvite :host-name="hostName" :event="selectedEvent" :members="inviteeMembers"
                     :via="viewingMember.via === 'link' ? 'link' : 'invitation'"
                     :my-status="viewingMember.status" :me-id="viewingMember.id" :locked="registered"
                     @respond="onRespond" @close="viewingId = null" />
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import LobbyInvite from './LobbyInvite.vue'

/* ---------- props / emits ---------- */
const props = defineProps({
  /** DEMO: auto-simulates friends replying. Set to false when wired to a real backend!!! */
  demo: { type: Boolean, default: true },
  /** Name invited friends see as the lobby host. */
  hostName: { type: String, default: 'Alex Chen' },
  friends: {
    type: Array,
    default: () => [
      { id: 'f1', name: 'Aisha Rahman', color: '#C9EB6C' },
      { id: 'f2', name: 'Daniel Tan', color: '#D98BF5' },
      { id: 'f3', name: 'Mei Ling Koh', color: '#F2B16B' },
      { id: 'f4', name: 'Ravi Menon', color: '#9fd3ff' },
      { id: 'f5', name: 'Sofia Lim', color: '#ffb3a7' },
      { id: 'f6', name: 'Zach Ong', color: '#C9EB6C' },
    ],
  },
  events: {
    type: Array,
    default: () => [
      { id: 'e1', title: 'Pottery Night', date: 'Fri 23 Oct, 6:30 PM', venue: 'SMU Connexion', slotsLeft: 6, minGroup: 3, maxGroup: 5 },
      { id: 'e2', title: 'Resume Clinic', date: 'Tue 27 Oct, 4:00 PM', venue: 'SOE/SCIS GSR 2-1', slotsLeft: 4, minGroup: 2, maxGroup: 4 },
      { id: 'e3', title: 'Hack the Campus', date: 'Sat 31 Oct, 10:00 AM', venue: 'Li Ka Shing Library', slotsLeft: 8, minGroup: 4, maxGroup: 6 },
    ],
  },
})
const emit = defineEmits(['invite', 'remove', 'register', 'respond'])

/* ---------- static UI data ---------- */
const tabs = [
  { id: 'invite', label: 'Invite' },
  { id: 'roster', label: 'Roster' },
  { id: 'register', label: 'Register' },
]
const statusLabel = { pending: 'Pending', accepted: 'Accepted', declined: 'Declined' }
const statusIcon = { pending: '…', accepted: '✓', declined: '✕' }

/* ---------- lobby state ---------- */
const tab = ref('invite')
const lobbyCode = Math.random().toString(36).slice(2, 8)
const inviteLink = `https://campuscompass.app/lobby/${lobbyCode}`
const copied = ref(false)
const registered = ref(false)
const selectedEventId = ref(null)

const members = ref([{ id: 'me', name: 'You', host: true, status: 'accepted' }])
const flashIds = reactive(new Set())

/* invitee screen (what a friend sees when they open the invite) */
const viewingId = ref(null)
const viewingMember = computed(() => members.value.find((m) => m.id === viewingId.value) || null)
const inviteeMembers = computed(() => members.value.map((m) => ({ ...m, name: m.host ? props.hostName : m.name })))
function onRespond(status) {
  if (!viewingMember.value || registered.value) return
  setStatus(viewingMember.value.id, status)
  emit('respond', { memberId: viewingMember.value.id, status }) // -> PATCH /lobbies/:id/members/:memberId
}

const locked = computed(() => registered.value)
const selectedEvent = computed(() => props.events.find((e) => e.id === selectedEventId.value) || null)
const acceptedMembers = computed(() => members.value.filter((m) => m.status === 'accepted'))
const counts = computed(() => ({
  pending: members.value.filter((m) => m.status === 'pending').length,
  declined: members.value.filter((m) => m.status === 'declined').length,
}))

/* How many accepted members the chosen event can take */
const capacity = computed(() => (selectedEvent.value ? Math.min(selectedEvent.value.maxGroup, selectedEvent.value.slotsLeft) : 0))
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
  if (n < ev.minGroup) {
    const need = ev.minGroup - n
    return `Waiting for ${need} more to accept.`
  }
  const pending = counts.value.pending
  return pending
    ? `Ready. ${n} will be signed up and ${pending} still pending will be left out.`
    : `Ready. All ${n} accepted members will be signed up.`
})

/* ---------- actions ---------- */
const initials = (name) => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
const isInvited = (friendId) => members.value.some((m) => m.id === friendId)

function invite(friend) {
  if (isInvited(friend.id)) return
  members.value.push({ id: friend.id, name: friend.name, color: friend.color, status: 'pending' })
  emit('invite', friend.id) // -> POST /lobbies/:id/invites
}
function removeMember(id) {
  members.value = members.value.filter((m) => m.id !== id)
  emit('remove', id)
}
async function copyLink() {
  try {
    await navigator.clipboard.writeText(inviteLink)
  } catch {
    /* clipboard blocked: the input is selectable as a fallback */
  }
  copied.value = true
  setTimeout(() => (copied.value = false), 1800)
}

/** Call this from your websocket / snapshot listener whenever a reply comes in. */
function setStatus(id, status) {
  const m = members.value.find((x) => x.id === id)
  if (!m || m.status === status) return
  m.status = status
  flashIds.add(id)
  setTimeout(() => flashIds.delete(id), 1200)
}

function registerGroup() {
  if (!canRegister.value) return
  // One call signs up everyone who accepted:  POST /lobbies/:id/register
  emit('register', {
    eventId: selectedEvent.value.id,
    memberIds: acceptedMembers.value.map((m) => m.id),
  })
  registered.value = true
}

/* ---------- tabs keyboard support ---------- */
function onTabKey(e) {
  const i = tabs.findIndex((t) => t.id === tab.value)
  if (e.key === 'ArrowRight') tab.value = tabs[(i + 1) % tabs.length].id
  else if (e.key === 'ArrowLeft') tab.value = tabs[(i + tabs.length - 1) % tabs.length].id
  else return
  e.preventDefault()
  document.getElementById(`tab-${tab.value}`)?.focus()
}

/* ---------- DEMO helpers (delete when wired up) ---------- */
let timer
const guests = ['Jia Hui', 'Marcus Teo', 'Priya Nair', 'Ethan Goh']
let guestN = 0
function demoLinkJoin() {
  const name = guests[guestN++ % guests.length]
  const id = `guest-${guestN}`
  members.value.push({ id, name, via: 'link', color: '#fdebd0', status: 'pending' })
  viewingId.value = id // show the screen they land on
}
function onEsc(e) { if (e.key === 'Escape') viewingId.value = null }
onMounted(() => {
  window.addEventListener('keydown', onEsc)
  if (!props.demo) return
  timer = setInterval(() => {
    if (registered.value) return
    const pending = members.value.filter((m) => m.status === 'pending' && m.id !== viewingId.value)
    if (!pending.length) return
    const pick = pending[Math.floor(Math.random() * pending.length)]
    setStatus(pick.id, Math.random() < 0.75 ? 'accepted' : 'declined')
  }, 3500)
})
onBeforeUnmount(() => {
  clearInterval(timer)
  window.removeEventListener('keydown', onEsc)
})

defineExpose({ setStatus })
</script>

<style scoped>
.app {
  --blue: #567de6;
  --paper: #f0f1f7;
  --paper-deep: #d3d9ea;
  --ink: #1f2a44;
  --navy: #3f48cc;
  --clay: #c4623d;
  --orange: #ee8559;
  --tile: #f2b16b;
  --cream: #fdebd0;
  --lime: #c9eb6c;
  --violet: #d98bf5;

  --font-display: 'Lilita One', 'Arial Rounded MT Bold', 'Trebuchet MS', sans-serif;
  --font-body: 'Sniglet', 'Trebuchet MS', system-ui, sans-serif;

  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  grid-template-rows: auto auto;
  align-content: start;
  grid-template-areas:
    'head head'
    'stage panel';
  gap: 16px 36px;
  min-height: 100vh;
  padding: 24px;
  background: var(--blue);
  color: var(--ink);
  font-family: var(--font-body);
  box-sizing: border-box;
  border-radius: 20px;
}
.app *, .app *::before, .app *::after { box-sizing: border-box; }
.app button, .app input { font-family: inherit; }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
:focus-visible { outline: 3px solid var(--ink); outline-offset: 2px; }

/* ── Heading ── */
.heading { grid-area: head; display: flex; align-items: center; justify-content: space-between; }
.page-title { margin: 0; font: 400 44px/1 var(--font-display); letter-spacing: 0.02em; text-transform: uppercase; color: #fff; }

/* ── Buttons ── */
.btn {
  border: 0; border-radius: 999px; padding: 12px 22px; cursor: pointer;
  font: 800 14px/1 var(--font-body); letter-spacing: 0.14em; text-transform: uppercase;
  background: var(--ink); color: #fff; transition: transform 0.15s, background 0.15s;
}
.btn:hover:not(:disabled) { transform: translateY(-1px); }
.btn:disabled { opacity: 0.45; cursor: not-allowed; }
.btn-navy { background: var(--navy); }
.heading .btn-navy { padding: 22px 44px; font-size: 16px; background: #3a43c4; }
.btn-ghost { background: transparent; color: var(--ink); box-shadow: inset 0 0 0 2px var(--ink); }
.btn-small { padding: 9px 16px; font-size: 12px; }
.btn-big { padding: 20px 38px; font-size: 16px; }

/* ── Folder + tabs ── */
.stage { grid-area: stage; display: flex; flex-direction: column; min-width: 0; }
.tabs { display: flex; align-items: flex-end; padding-left: 4px; position: relative; z-index: 1; margin-bottom: -2px; }
.tab {
  position: relative; margin-right: -16px; padding: 10px 40px 14px;
  border: 0; border-radius: 26px 26px 0 0; cursor: pointer;
  background: var(--tab); color: var(--ink);
  font: 800 13px/1 var(--font-body); letter-spacing: 0.14em; text-transform: uppercase;
}
/* each tab keeps its own colour, whichever one is selected */
.tab-invite { --tab: var(--lime); }
.tab-roster { --tab: var(--orange); }
.tab-register { --tab: var(--violet); }
/* selected tab: taller, on top, and joined to the folder frame */
.tab-active { z-index: 3; padding: 16px 40px 16px; box-shadow: 0 9px 0 var(--tab); }

.folder {
  flex: 1; min-height: 560px; padding: 9px;
  display: flex; flex-direction: column;
  border-radius: 12px 40px 40px 40px;
  background: var(--orange);
}
.pane {
  display: flex; flex-direction: column; gap: 20px; flex: 1;
  padding: 28px; border-radius: 32px; background: var(--clay);
}
.pane-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: auto; }
.cols { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }

/* ── Cards (the "tiles") ── */
.card { padding: 22px 24px; border-radius: 24px; background: var(--tile); }
.card-head { display: flex; align-items: center; justify-content: space-between; }
.card-title { margin: 0 0 4px; font: 400 24px/1.1 var(--font-display); letter-spacing: 0.03em; }
.card-sub { margin: 0 0 12px; font-size: 15px; }
.list { list-style: none; margin: 0; padding: 0; }
.row { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; padding: 12px 6px; border-top: 3px dashed rgba(31, 42, 68, 0.25); }
.row:first-child { border-top: 0; }
.grow { flex: 1; min-width: 0; font-weight: 800; letter-spacing: 0.04em; }
.chip-avatar { display: grid; place-items: center; width: 40px; height: 40px; flex: none; border-radius: 50%; font-weight: 800; font-size: 14px; }
.tag { margin-left: 8px; padding: 3px 9px; border-radius: 999px; background: var(--cream); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; }
.empty { margin: 12px 0 0; }

.link-box { display: flex; gap: 10px; }
.link-input { flex: 1; min-width: 0; padding: 0 16px; height: 44px; border: 0; border-radius: 999px; background: var(--cream); color: var(--ink); font: inherit; font-size: 14px; }
.demo-btn { margin-top: 16px; }

/* ── Status chips ── */
.status { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 999px; font-weight: 800; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; }
.status-pending { background: var(--cream); }
.status-accepted { background: var(--lime); }
.status-declined { background: var(--violet); }
.icon-btn { width: 30px; height: 30px; border: 0; border-radius: 50%; background: rgba(31, 42, 68, 0.12); color: var(--ink); cursor: pointer; }
.icon-btn:hover { background: rgba(31, 42, 68, 0.25); }

.live { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 800; }
.live-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--navy); animation: pulse 1.8s infinite; }

/* live roster animation: row slides in, changed row flashes */
.roster-enter-active, .roster-leave-active { transition: all 0.3s ease; }
.roster-enter-from, .roster-leave-to { opacity: 0; transform: translateX(-16px); }
.flash { animation: flash 1.2s ease; }
@keyframes flash { 0%, 60% { background: var(--cream); } 100% { background: transparent; } }
@keyframes pulse { 50% { opacity: 0.25; } }

/* ── Register ── */
.events { display: grid; gap: 12px; }
.event { display: block; cursor: pointer; }
.event-body {
  display: grid; gap: 2px; padding: 14px 18px; border-radius: 18px;
  background: var(--cream); border: 3px dashed transparent; font-size: 15px;
}
.event-body strong { font: 400 20px/1.2 var(--font-display); letter-spacing: 0.03em; }
.event-meta { font-size: 13px; opacity: 0.8; }
.event input:checked + .event-body { border-color: var(--ink); background: #fff; }
.event input:focus-visible + .event-body { outline: 3px solid var(--ink); outline-offset: 2px; }

.register-bar {
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 20px;
  margin-top: auto; padding: 18px 22px; border-radius: 24px; background: var(--cream);
}
.progress { flex: 1 1 220px; min-width: 0; }
.meter { height: 14px; border-radius: 999px; background: rgba(31, 42, 68, 0.15); overflow: hidden; }
.meter i { display: block; height: 100%; border-radius: inherit; background: var(--navy); transition: width 0.4s ease; }
.hint { margin: 10px 0 0; color: var(--ink); font-weight: 800; letter-spacing: 0.04em; font-size: 15px; }
.done { text-align: left; }
.names { display: flex; flex-wrap: wrap; gap: 10px; margin: 0; padding: 0; list-style: none; }
.names li { padding: 8px 16px; border-radius: 999px; background: var(--lime); font-weight: 800; }

/* ── Right panel ── */
.side-panel { grid-area: panel; display: flex; flex-direction: column; gap: 18px; padding: 28px 24px; border-radius: 32px; background: var(--paper); }
.panel-title { margin: 0; text-align: center; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; font-size: 18px; }
.pitch { display: grid; gap: 4px; padding: 16px 18px; border-radius: 20px; background: var(--paper-deep); font-size: 14px; }
.pitch strong { font: 400 20px/1.2 var(--font-display); letter-spacing: 0.03em; }
.pitch-label { margin: 0; color: #5d6683; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; }
.pitch-empty { justify-items: start; gap: 10px; }
.pitch-empty p { margin: 0; }
.counts { display: grid; gap: 10px; margin: 0; }
.count { display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; border-radius: 999px; }
.count dt { font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; font-size: 13px; }
.count dd { margin: 0; font: 400 24px/1 var(--font-display); }
.count-accepted { background: var(--lime); }
.count-pending { background: var(--cream); }
.count-declined { background: var(--violet); }

/* ── Invitee overlay ── */
.overlay { position: fixed; inset: 0; z-index: 50; display: grid; place-items: center; padding: 20px; overflow-y: auto; background: rgba(31, 42, 68, 0.65); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ── Responsive ── */
@media (max-width: 1100px) {
  .app {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto;
    grid-template-areas: 'head' 'stage' 'panel';
    gap: 16px;
  }
}
@media (max-width: 720px) {
  .cols { grid-template-columns: 1fr; }
  .tab { padding: 12px 22px 14px; }
  .pane { padding: 18px; }
  .register-bar { flex-direction: column; align-items: stretch; }
  .heading { flex-wrap: wrap; gap: 12px; }
  .heading .btn-navy { padding: 16px 28px; }
}
@media (prefers-reduced-motion: reduce) {
  .live-dot, .flash { animation: none; }
  .roster-enter-active, .roster-leave-active, .meter i, .btn { transition: none; }
}
</style>