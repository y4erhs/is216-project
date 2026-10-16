<!--
  EventLobby.vue  (Vue 3, <script setup>)
  Lobby-style invitation system. Built on the design-system FolderTabs + theme.css (import theme.css once, globally, in main.js).
-->
<template>
  <div class="app theme-blue">
    <!-- ───── Page heading ───── -->
    <div class="heading">
      <h2 class="page-title">Lobby</h2>
      <button class="btn btn-navy" type="button" @click="$emit('open-calendar')">View my calendar</button>
    </div>

    <!-- ───── Folder (main stage) ───── -->
    <main class="stage">
      <!-- :key lets the Roster / Register shortcut buttons switch tabs (FolderTabs only takes defaultActive) -->
      <FolderTabs :key="folderKey" :tabs="tabs" :default-active="tab" @tab-change="tab = $event">
        <!-- ===== Invite ===== -->
        <template #invite>
          <div class="pane">
            <div class="cols">
              <div class="card">
                <h3 class="card-title">Invite friends</h3>
                <p class="card-sub">Pick people from your friends list.</p>
                <ul class="list">
                  <li v-for="f in friends" :key="f.id" class="row">
                    <span class="chip-avatar" :style="{ background: f.color }">{{ initials(f.name) }}</span>
                    <span class="grow">{{ f.name }}</span>
                    <button class="btn btn-small" type="button" :disabled="isInvited(f.id) || locked" @click="invite(f)">
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
                <button v-if="demo" type="button" class="btn btn-ghost demo-btn" :disabled="locked" @click="demoLinkJoin">
                  Demo: someone opens the link
                </button>
              </div>
            </div>
            <div class="pane-actions">
              <button class="btn btn-navy" type="button" @click="goTo('roster')">See who's in</button>
            </div>
          </div>
        </template>

        <!-- ===== Roster ===== -->
        <template #roster>
          <div class="pane">
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
                  <button class="btn btn-small" type="button" v-if="demo && !m.host" @click="viewingId = m.id">Their view</button>
                  <button v-if="!m.host && !locked" class="icon-btn" type="button"
                          :aria-label="`Remove ${m.name}`" @click="removeMember(m.id)">✕</button>
                </li>
              </TransitionGroup>

              <p v-if="members.length === 1" class="empty">No one invited yet. Add friends or share the link.</p>
            </div>
            <div class="pane-actions">
              <button class="btn btn-ghost" type="button" @click="goTo('invite')">Invite more</button>
              <button class="btn btn-navy" type="button" @click="goTo('register')">Pitch an event</button>
            </div>
          </div>
        </template>

        <!-- ===== Register ===== -->
        <template #register>
          <div class="pane">
            <div v-if="registered" class="card">
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
            </template>
          </div>
        </template>
      </FolderTabs>
              <div v-if="tab === 'register' && !registered" class="register-bar">
                <div class="progress" v-if="selectedEvent">
                  <div class="meter" role="progressbar" :aria-valuenow="acceptedMembers.length"
                      aria-valuemin="0" :aria-valuemax="selectedEvent.minGroup">
                    <i :style="{ width: progress + '%' }"></i>
                  </div>
                  <p class="hint">{{ registerHint }}</p>
                </div>
                <p v-else class="hint">Choose an event to start.</p>

                <button class="btn btn-navy" type="button" :disabled="!canRegister" @click="registerGroup">Register group</button>
              </div>
    </main>

    <!-- ───── Right panel ───── -->
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
        <button class="btn btn-small" type="button" @click="goTo('register')">Choose event</button>
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
import FolderTabs from '../components/FolderTabs.vue'
import LobbyInvite from '../views/LobbyInvite.vue' // adjust paths to wherever you put these files

/* ---------- props / emits ---------- */
const props = defineProps({
  /** DEMO: auto-simulates friends replying. Set to false when wired to a real backend. */
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
const emit = defineEmits(['invite', 'remove', 'register', 'respond', 'open-calendar'])

/* ---------- FolderTabs ---------- */
const tabs = [
  { id: 'invite', label: 'INVITE', theme: 'theme-green' },
  { id: 'roster', label: 'ROSTER', theme: 'theme-orange' },
  { id: 'register', label: 'REGISTER', theme: 'theme-purple' },
]
const tab = ref('invite')
const folderKey = ref(0)
function goTo(id) {
  tab.value = id
  folderKey.value++ // remount so FolderTabs opens on the new defaultActive
}

const statusLabel = { pending: 'Pending', accepted: 'Accepted', declined: 'Declined' }
const statusIcon = { pending: '…', accepted: '✓', declined: '✕' }

/* ---------- lobby state ---------- */
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
  if (n < ev.minGroup) return `Waiting for ${ev.minGroup - n} more to accept.`
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
    /* clipboard blocked */
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
/* Design-system rules: outer boxes 25px radius, inner boxes 15px radius, 15px padding,
   page title 25px, default text 11px. Colours/fonts come from theme.css. */
.app {
  --ink: var(--color-black, #1f2a44);
  --paper: var(--color-grey, #f0f1f7);
  --blue: #567de6;
  --paper-deep: #d3d9ea;
  --clay: #c4623d;
  --tile: #f2b16b;
  --cream: #fdebd0;
  --lime: #c9eb6c;
  --violet: #d98bf5;

  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  grid-template-rows: auto auto;
  grid-template-areas:
    'head head'
    'stage panel';
  align-content: start;
  gap: 15px;
  min-height: 100vh;
  max-height: 100vh;
  max-height: 100dvh;
  overflow-y: auto;          /* the lobby scrolls itself, whatever the parent does */
  padding: 15px;
  text-align: left;
  background: var(--blue);   /* fallback; theme-blue provides this in the design system */
  color: var(--ink);
  font-family: 'TextFont', sans-serif;
  font-size: 11px;
  box-sizing: border-box;
  border-radius: 10px;
}
.app *, .app *::before, .app *::after { box-sizing: border-box; }
.app button, .app input { font-family: inherit; }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
:focus-visible { outline: 3px solid var(--ink); outline-offset: 2px; }

/* ── Buttons ── */
.btn {
  border: 0; border-radius: 999px; padding: 10px 20px; cursor: pointer;
  font: 700 11px/1 'TextFont', sans-serif; letter-spacing: 0.14em; text-transform: uppercase;
  background: var(--ink); color: #fff; transition: transform 0.15s;
}
.btn:hover:not(:disabled) { transform: translateY(-1px); }
.btn:disabled { opacity: 0.45; cursor: not-allowed; }
.btn-navy { background: #3f48cc; }
.btn-ghost { background: transparent; color: var(--ink); box-shadow: inset 0 0 0 2px var(--ink); }
.btn-small { padding: 7px 14px; }
.heading .btn-navy { padding: 14px 28px; font-size: 12px; }

/* ── Heading ── */
.heading { grid-area: head; display: flex; align-items: center; justify-content: space-between; }
.page-title { margin: 0; color: #fff; font: 400 25px/1 'HeaderFont', sans-serif; letter-spacing: 0.02em; text-transform: uppercase; }

/* ── Stage ── */
.stage { grid-area: stage; min-width: 0; }
.pane { display: flex; flex-direction: column; gap: 15px; }
.pane-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: auto; }
.cols { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 15px; }

/* ── Cards (inner boxes) ── */
.card { padding: 15px; border-radius: 15px; background: var(--tile); color: var(--ink); }
.card-head { display: flex; align-items: center; justify-content: space-between; }
.card-title { margin: 0 0 4px; font: 400 16px/1.15 'HeaderFont', sans-serif; letter-spacing: 0.03em; }
.card-sub { margin: 0 0 8px; }
.list { list-style: none; margin: 0; padding: 0; }
.row { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; padding: 8px 0; border-top: 2px dashed rgba(31, 42, 68, 0.25); }
.row:first-child { border-top: 0; }
.grow { flex: 1; min-width: 0; font-weight: 700; letter-spacing: 0.04em; }
.chip-avatar { display: grid; place-items: center; width: 30px; height: 30px; flex: none; border-radius: 50%; font-weight: 700; font-size: 11px; }
.tag { margin-left: 6px; padding: 2px 8px; border-radius: 999px; background: var(--cream); font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; }
.empty { margin: 8px 0 0; }

.link-box { display: flex; align-items: center; gap: 10px; }
.link-input { flex: 1; min-width: 0; height: 34px; padding: 0 14px; border: 0; border-radius: 999px; background: var(--cream); color: var(--ink); font: inherit; }
.demo-btn { margin-top: 12px; }

/* ── Status chips ── */
.status { display: inline-flex; align-items: center; gap: 5px; padding: 5px 10px; border-radius: 999px; font-weight: 700; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; }
.status-pending { background: var(--cream); }
.status-accepted { background: var(--lime); }
.status-declined { background: var(--violet); }
.icon-btn { width: 24px; height: 24px; border: 0; border-radius: 50%; background: rgba(31, 42, 68, 0.12); color: var(--ink); cursor: pointer; font-size: 11px; }
.icon-btn:hover { background: rgba(31, 42, 68, 0.25); }

.live { display: inline-flex; align-items: center; gap: 6px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
.live-dot { width: 8px; height: 8px; border-radius: 50%; background: #3f48cc; animation: pulse 1.8s infinite; }

.roster-enter-active, .roster-leave-active { transition: all 0.3s ease; }
.roster-enter-from, .roster-leave-to { opacity: 0; transform: translateX(-16px); }
.flash { animation: flash 1.2s ease; }
@keyframes flash { 0%, 60% { background: var(--cream); } 100% { background: transparent; } }
@keyframes pulse { 50% { opacity: 0.25; } }

/* ── Register ── */
.events { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 10px; }
.event { display: block; cursor: pointer; }
.event-body { display: grid; gap: 2px; height: 100%; padding: 15px; border-radius: 15px; background: var(--cream); border: 2px dashed transparent; }
.event-body strong { font: 400 14px/1.2 'HeaderFont', sans-serif; letter-spacing: 0.03em; }
.event-meta { opacity: 0.8; }
.event input:checked + .event-body { border-color: var(--ink); background: #fff; }
.event input:focus-visible + .event-body { outline: 3px solid var(--ink); outline-offset: 2px; }

.register-bar {
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 15px;
  margin-top: 15px; padding: 15px; border-radius: 15px; background: var(--cream); color: var(--ink);
}
.progress { flex: 1 1 200px; min-width: 0; padding: 20px; align-items: center;}
.meter { height: 12px; border-radius: 999px; background: rgba(31, 42, 68, 0.15); overflow: hidden; }
.meter i { display: block; height: 100%; border-radius: inherit; background: #3f48cc; transition: width 0.4s ease; }
.hint { margin: 8px 0 0; font-weight: 700; letter-spacing: 0.04em; }
.names { display: flex; flex-wrap: wrap; gap: 8px; margin: 0; padding: 0; list-style: none; }
.names li { padding: 6px 12px; border-radius: 999px; background: var(--lime); font-weight: 700; }

/* ── Right panel (outer box) ── */
.side-panel { grid-area: panel; display: flex; flex-direction: column; gap: 15px; padding: 15px; border-radius: 25px; background: var(--paper); color: var(--ink); }
.panel-title { margin: 0; text-align: center; font: 400 14px/1.2 'HeaderFont', sans-serif; letter-spacing: 0.14em; text-transform: uppercase; }
.pitch { display: grid; gap: 3px; padding: 15px; border-radius: 15px; background: var(--paper-deep); }
.pitch strong { font: 400 16px/1.2 'HeaderFont', sans-serif; letter-spacing: 0.03em; }
.pitch-label { margin: 0; color: #5d6683; letter-spacing: 0.12em; text-transform: uppercase; }
.pitch-empty { justify-items: start; gap: 8px; }
.pitch-empty p { margin: 0; }
.counts { display: grid; gap: 8px; margin: 0; }
.count { display: flex; align-items: center; justify-content: space-between; padding: 10px 15px; border-radius: 999px; }
.count dt { font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
.count dd { margin: 0; font: 400 18px/1 'HeaderFont', sans-serif; }
.count-accepted { background: var(--lime); }
.count-pending { background: var(--cream); }
.count-declined { background: var(--violet); }

/* ── Invitee overlay ── */
.overlay { position: fixed; inset: 0; z-index: 50; display: grid; place-items: center; padding: 15px; overflow-y: auto; background: rgba(31, 42, 68, 0.65); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ── Responsive ── */
@media (max-width: 1100px) {
  .app { grid-template-columns: minmax(0, 1fr); grid-template-areas: 'head' 'stage' 'panel'; }
}
@media (max-width: 720px) {
  .cols { grid-template-columns: 1fr; }
  .heading { flex-wrap: wrap; gap: 10px; }
}
@media (prefers-reduced-motion: reduce) {
  .live-dot, .flash { animation: none; }
  .roster-enter-active, .roster-leave-active, .meter i, .btn { transition: none; }
}
</style>