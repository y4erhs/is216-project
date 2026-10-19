<!--
  Lobby.vue  (Vue 3, <script setup>)
  The host's view of one lobby. Reads/writes through the shared store (components/useLobbies.js).
  Needs: FolderTabs + theme.css (design system), LobbyInvite.vue.
-->
<template>
  <div v-if="lobby" class="app theme-blue">
    <!-- ───── Heading: lobby name, description, host actions ───── -->
    <div class="heading">
      <div class="heading-main">
        <button class="btn btn-light btn-small back" type="button" @click="$emit('back')">← My lobbies</button>

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
            <button class="btn btn-navy btn-small" type="submit" :disabled="!draft.name.trim()">Save</button>
            <button class="btn btn-light btn-small" type="button" @click="editing = false">Cancel</button>
          </div>
        </form>

        <template v-else>
          <h2 class="page-title">{{ lobby.name }}</h2>
          <p class="lobby-desc">{{ lobby.description || 'No description yet.' }}</p>
          <p class="lobby-meta">
            Hosted by you. {{ members.length }} {{ members.length === 1 ? 'member' : 'members' }}.
            Last active {{ timeAgo(lobby.lastActiveAt) }}.
            <span v-if="inactive" class="tag tag-warn">Inactive</span>
          </p>
        </template>
      </div>

      <div v-if="!editing" class="heading-actions">
        <button class="btn btn-light btn-small" type="button" @click="startEdit">Edit details</button>
        <button class="btn btn-danger btn-small" type="button" @click="confirmingDelete = true">Delete lobby</button>
      </div>
    </div>

    <!-- ───── Folder (main stage) ───── -->
    <main class="stage">
      <!-- :key lets the shortcut buttons switch tabs (FolderTabs only takes defaultActive) -->
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
                    <button class="btn btn-small" type="button" :disabled="isInvited(f.id) || registered" @click="invite(f)">
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
                <button v-if="demo" type="button" class="btn btn-ghost demo-btn" :disabled="registered" @click="demoLinkJoin">
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
                    <small v-if="m.id === lobby.hostId" class="tag">Host</small>
                    <small v-else-if="m.via === 'link'" class="tag">Via link</small>
                  </span>
                  <span class="status" :class="`status-${m.status}`">
                    <span aria-hidden="true">{{ statusIcon[m.status] }}</span>{{ statusLabel[m.status] }}
                  </span>
                  <!-- DEMO: opens the screen this person sees -->
                  <button v-if="demo && m.id !== lobby.hostId" class="btn btn-small" type="button" @click="viewingId = m.id">Their view</button>
                  <button v-if="m.id !== lobby.hostId && !registered" class="icon-btn" type="button"
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
            <!-- this round is done: the lobby stays, ready for the next event -->
            <template v-if="registered">
              <div class="card">
                <h3 class="card-title">Group registered</h3>
                <p class="card-sub">{{ lastRegEvent?.title }} on {{ lastRegEvent?.date }}. These people are signed up:</p>
                <ul class="names">
                  <li v-for="n in lastRegNames" :key="n">{{ n }}</li>
                </ul>
              </div>
              <div class="card">
                <h3 class="card-title">Same group, another event?</h3>
                <p class="card-sub">Keep this lobby and pick a new event. Everyone will be asked to confirm again.</p>
                <button class="btn btn-navy" type="button" @click="planAnother">Plan another event</button>
              </div>
            </template>

            <div v-else class="card">
              <h3 class="card-title">Pitch an event to the lobby</h3>
              <p class="card-sub">Friends can still accept or decline while you choose.</p>
              <div class="events" role="radiogroup" aria-label="Events">
                <label v-for="e in events" :key="e.id" class="event" :class="{ used: usedEventIds.has(e.id) }">
                  <input class="sr" type="radio" name="event" :value="e.id" v-model="selectedEventId"
                         :disabled="usedEventIds.has(e.id)" />
                  <span class="event-body">
                    <strong>{{ e.title }}</strong>
                    <span>{{ e.date }} at {{ e.venue }}</span>
                    <span class="event-meta">{{ e.slotsLeft }} slots left. Groups of {{ e.minGroup }} to {{ e.maxGroup }}.</span>
                    <small v-if="usedEventIds.has(e.id)" class="tag">Already registered</small>
                  </span>
                </label>
              </div>
            </div>
          </div>
        </template>
      </FolderTabs>

      <!-- Lives OUTSIDE FolderTabs so the folder body can never clip it -->
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
        <p class="pitch-label">{{ registered ? 'Registered event' : 'Pitched event' }}</p>
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

      <div v-if="historyRows.length" class="history">
        <p class="pitch-label">Signed up so far</p>
        <ul>
          <li v-for="h in historyRows" :key="h.id"><strong>{{ h.title }}</strong><span>{{ h.date }}. {{ h.count }} going.</span></li>
        </ul>
      </div>
    </aside>

    <!-- What an invited friend (or someone opening the link) sees -->
    <Transition name="fade">
      <div v-if="viewingMember" class="overlay" role="dialog" aria-modal="true" aria-label="Invitation"
           @click.self="viewingId = null">
        <LobbyInvite :lobby-name="lobby.name" :description="lobby.description" :host-name="hostName"
                     :event="selectedEvent" :members="inviteeMembers"
                     :via="viewingMember.via === 'link' ? 'link' : 'invitation'"
                     :my-status="viewingMember.status" :me-id="viewingMember.id" :locked="registered"
                     @respond="onRespond" @close="viewingId = null" />
      </div>
    </Transition>

    <!-- Delete confirmation -->
    <Transition name="fade">
      <div v-if="confirmingDelete" class="overlay" role="alertdialog" aria-modal="true" aria-labelledby="del-title"
           @click.self="confirmingDelete = false">
        <div class="dialog">
          <h3 id="del-title" class="card-title">Delete "{{ lobby.name }}"?</h3>
          <p v-if="inactive">Nothing has happened here for {{ daysIdle }} days, so it's safe to clear out.</p>
          <p v-else>
            This lobby is still active. If it's the same group of friends, keep it and plan another event instead.
          </p>
          <p>Deleting removes the lobby and its roster for everyone. Events you've already registered for are not cancelled.</p>
          <div class="dialog-actions">
            <button class="btn btn-ghost" type="button" @click="confirmingDelete = false">Keep lobby</button>
            <button v-if="registered" class="btn btn-navy" type="button" @click="confirmingDelete = false; planAnother()">Plan another event</button>
            <button class="btn btn-danger" type="button" @click="deleteLobby">Delete lobby</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import FolderTabs from '../components/FolderTabs.vue'
import LobbyInvite from '../views/LobbyInvite.vue' 
import { useLobbies, FRIENDS, EVENTS, daysAgo, timeAgo, INACTIVE_DAYS } from '../components/useLobbies'

/* ---------- props / emits ---------- */
const props = defineProps({
  lobbyId: { type: String, required: true },
  /** DEMO: auto-simulates friends replying. Set to false when wired to a real backend. */
  demo: { type: Boolean, default: true },
  friends: { type: Array, default: () => FRIENDS },
  events: { type: Array, default: () => EVENTS },
})
const emit = defineEmits(['back', 'deleted', 'invite', 'remove', 'register', 'respond'])

const store = useLobbies()
const lobby = computed(() => store.get(props.lobbyId))
const members = computed(() => lobby.value?.members ?? [])
const registered = computed(() => !!lobby.value?.registered)
const hostName = computed(() => (lobby.value ? store.hostName(lobby.value) : ''))
const daysIdle = computed(() => (lobby.value ? daysAgo(lobby.value.lastActiveAt) : 0))
const inactive = computed(() => daysIdle.value >= INACTIVE_DAYS)

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

/* ---------- lobby details: edit + delete ---------- */
const editing = ref(false)
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

/* ---------- lobby state ---------- */
const inviteLink = computed(() => `https://campuscompass.app/lobby/${props.lobbyId}`)
const copied = ref(false)
const flashIds = reactive(new Set())

const selectedEventId = computed({
  get: () => lobby.value?.pitchedEventId ?? null,
  set: (id) => store.pitchEvent(props.lobbyId, id),
})
const selectedEvent = computed(() => props.events.find((e) => e.id === selectedEventId.value) || null)
const acceptedMembers = computed(() => members.value.filter((m) => m.status === 'accepted'))
const counts = computed(() => ({
  pending: members.value.filter((m) => m.status === 'pending').length,
  declined: members.value.filter((m) => m.status === 'declined').length,
}))

/* events this lobby has already signed up for */
const history = computed(() => lobby.value?.history ?? [])
const usedEventIds = computed(() => new Set(history.value.map((h) => h.eventId)))
const eventById = (id) => props.events.find((e) => e.id === id)
const historyRows = computed(() =>
  history.value.map((h) => ({ id: h.id, title: eventById(h.eventId)?.title ?? 'Event', date: eventById(h.eventId)?.date ?? '', count: h.memberIds.length }))
)
const lastReg = computed(() => history.value[history.value.length - 1])
const lastRegEvent = computed(() => (lastReg.value ? eventById(lastReg.value.eventId) : null))
const lastRegNames = computed(() =>
  (lastReg.value?.memberIds ?? []).map((id) => members.value.find((m) => m.id === id)?.name).filter(Boolean)
)

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

/* ---------- invitee screen (what a friend sees when they open the invite) ---------- */
const viewingId = ref(null)
const viewingMember = computed(() => members.value.find((m) => m.id === viewingId.value) || null)
const inviteeMembers = computed(() => members.value.map((m) => ({ ...m, host: m.id === lobby.value.hostId })))
function onRespond(status) {
  if (!viewingMember.value || registered.value) return
  store.setStatus(props.lobbyId, viewingMember.value.id, status)
  emit('respond', { memberId: viewingMember.value.id, status }) // -> PATCH /lobbies/:id/members/:memberId
}

/* ---------- actions ---------- */
const initials = (name) => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
const isInvited = (friendId) => members.value.some((m) => m.id === friendId)

function invite(friend) {
  store.addMember(props.lobbyId, friend)
  emit('invite', friend.id) // -> POST /lobbies/:id/invites
}
function removeMember(id) {
  store.removeMember(props.lobbyId, id)
  emit('remove', id)
}
async function copyLink() {
  try {
    await navigator.clipboard.writeText(inviteLink.value)
  } catch {
    /* clipboard blocked */
  }
  copied.value = true
  setTimeout(() => (copied.value = false), 1800)
}
function registerGroup() {
  if (!canRegister.value) return
  emit('register', { eventId: selectedEvent.value.id, memberIds: acceptedMembers.value.map((m) => m.id) })
  store.registerGroup(props.lobbyId) // one call signs up everyone who accepted
}
function planAnother() {
  store.planNext(props.lobbyId)
  goTo('register')
}

/* live roster: flash any row whose status just changed (works for updates from anywhere) */
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

/* ---------- DEMO helpers (delete when wired up) ---------- */
let timer
const guests = ['Jia Hui', 'Marcus Teo', 'Priya Nair', 'Ethan Goh']
let guestN = 0
function demoLinkJoin() {
  const name = guests[guestN++ % guests.length]
  const id = `guest-${Date.now()}`
  store.addMember(props.lobbyId, { id, name, via: 'link', color: '#fdebd0' })
  viewingId.value = id // show the screen they land on
}
function onEsc(e) {
  if (e.key !== 'Escape') return
  viewingId.value = null
  confirmingDelete.value = false
}
onMounted(() => {
  window.addEventListener('keydown', onEsc)
  if (!props.demo) return
  timer = setInterval(() => {
    if (!lobby.value || registered.value) return
    const pending = members.value.filter((m) => m.status === 'pending' && m.id !== viewingId.value && m.id !== lobby.value.hostId)
    if (!pending.length) return
    const pick = pending[Math.floor(Math.random() * pending.length)]
    store.setStatus(props.lobbyId, pick.id, Math.random() < 0.75 ? 'accepted' : 'declined')
  }, 3500)
})
onBeforeUnmount(() => {
  clearInterval(timer)
  window.removeEventListener('keydown', onEsc)
})
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
  --danger: #b3261e;
  --dark-blue: var(--color-dark-blue);

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
.app button, .app input, .app textarea { font-family: inherit; }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
:focus-visible { outline: 3px solid var(--ink); outline-offset: 2px; }

/* ── Buttons ── */
.btn {
  --nudge: 2px;   /* how far to push the text down; try 2px, then 3px */
  padding: calc(10px + var(--nudge)) 20px calc(10px - var(--nudge));
  border: 0; border-radius: 999px; cursor: pointer;
  font: 700 11px/1 'TextFont', sans-serif; letter-spacing: 0.14em; text-transform: uppercase;
  background: var(--dark-blue); color: #fff; transition: transform 0.15s;
}
.btn-small { padding: calc(7px + var(--nudge)) 14px calc(7px - var(--nudge)); }
.btn:hover:not(:disabled) { transform: translateY(-1px); }
.btn:disabled { opacity: 0.45; cursor: not-allowed; }
.btn-navy { background: #3f48cc; }
.btn-ghost { background: transparent; color: var(--ink); box-shadow: inset 0 0 0 2px var(--ink); }
.btn-light { background: transparent; color: #fff; box-shadow: inset 0 0 0 2px #fff; }
.btn-danger { background: var(--danger); }
.app :focus-visible.btn-light, .btn-light:focus-visible { outline-color: #fff; }

/* ── Heading ── */
.heading { grid-area: head; display: flex; align-items: flex-start; justify-content: space-between; gap: 15px; }
.heading-main { display: grid; justify-items: start; gap: 6px; min-width: 0; flex: 1; }
.heading-actions { display: flex; gap: 8px; flex: none; }
.page-title { margin: 0; color: #fff; font: 400 25px/1.1 'HeaderFont', sans-serif; letter-spacing: 0.02em; text-transform: uppercase; overflow-wrap: anywhere; }
.lobby-desc { margin: 0; max-width: 70ch; color: #fff; line-height: 1.4; }
.lobby-meta { margin: 0; color: #fff; opacity: 0.9; }
.tag-warn { background: #ffd9a8; color: var(--ink); }

.edit { display: grid; gap: 8px; width: min(520px, 100%); }
.field { display: grid; gap: 4px; color: #fff; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
.field input, .field textarea { padding: 9px 14px; border: 0; border-radius: 15px; background: var(--cream); color: var(--ink); font-size: 11px; letter-spacing: 0; text-transform: none; font-weight: 400; resize: vertical; }
.edit-actions { display: flex; gap: 8px; }

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
.event.used { opacity: 0.6; cursor: not-allowed; }
.event-body { display: grid; justify-items: start; gap: 2px; height: 100%; padding: 15px; border-radius: 15px; background: var(--cream); border: 2px dashed transparent; }
.event-body strong { font: 400 14px/1.2 'HeaderFont', sans-serif; letter-spacing: 0.03em; }
.event-body .tag { margin: 4px 0 0; background: var(--lime); }
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
.history ul { list-style: none; margin: 6px 0 0; padding: 0; display: grid; gap: 6px; }
.history li { display: grid; padding: 10px 12px; border-radius: 15px; background: var(--paper-deep); }
.history strong { font: 400 14px/1.2 'HeaderFont', sans-serif; }

/* ── Overlays ── */
.overlay { position: fixed; inset: 0; z-index: 50; display: grid; place-items: center; padding: 15px; overflow-y: auto; background: rgba(31, 42, 68, 0.65); }
.dialog { display: grid; gap: 8px; width: min(440px, 100%); padding: 15px; border-radius: 25px; background: var(--cream); color: var(--ink); }
.dialog p { margin: 0; line-height: 1.4; }
.dialog-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; margin-top: 8px; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ── Responsive ── */
@media (max-width: 1100px) {
  .app { grid-template-columns: minmax(0, 1fr); grid-template-areas: 'head' 'stage' 'panel'; }
}
@media (max-width: 720px) {
  .cols { grid-template-columns: 1fr; }
  .heading { flex-direction: column; }
}
@media (prefers-reduced-motion: reduce) {
  .live-dot, .flash { animation: none; }
  .roster-enter-active, .roster-leave-active, .meter i, .btn { transition: none; }
}
</style>