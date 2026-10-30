<!--
  Lobby.vue  (Vue 3, <script setup>)
  The host's view of one lobby: heading, folder (Invite / Roster / Register) and a
  "Registered events" side panel. Reads/writes through the shared store (useLobbies.js).
  Needs: FolderTabs + theme.css (design system), LobbyInvite.vue.
-->
<template>
  <div v-if="lobby" class="app theme-blue">
    <!-- ───── Heading ───── -->
    <header class="head">
      <div class="head-main">
        <button class="back-link" type="button" @click="$emit('back')">
          <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true">
            <path d="M17 6H2M6 1 1 6l5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span>My lobbies</span>
        </button>

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
            <button class="btn btn-lime btn-small" type="submit" :disabled="!draft.name.trim()">Save</button>
            <button class="btn btn-light btn-small" type="button" @click="editing = false">Cancel</button>
          </div>
        </form>

        <template v-else>
          <h2 class="page-title">{{ lobby.name }}</h2>
          <p class="lobby-desc">{{ lobby.description || 'No description yet.' }}</p>
          <p class="lobby-meta">
            Hosted by you. Active {{ timeAgo(lobby.lastActiveAt) }}.
            <span v-if="inactive" class="badge-pill pill-warn">Inactive</span>
          </p>
        </template>
      </div>

      <div v-if="!editing" class="head-actions">
        <button class="btn btn-purple" type="button" aria-label="Edit lobby details" @click="startEdit">Edit</button>
        <button class="btn btn-orange" type="button" aria-label="Delete lobby" @click="confirmingDelete = true">Delete</button>
      </div>
    </header>

    <!-- ───── Folder ───── -->
    <main class="stage">
      <!-- :key lets other buttons switch tabs (FolderTabs only takes defaultActive) -->
      <FolderTabs :key="folderKey" :tabs="tabs" :default-active="tab" @tab-change="tab = $event">
        <!-- ===== Invite ===== -->
        <template #invite>
          <div class="pane">
            <section>
              <h3 class="section-title">Invite link</h3>
              <p class="section-sub">Anyone with the link can join the lobby.</p>
              <div class="link-box">
                <input class="link-input" readonly :value="inviteLink" aria-label="Invite link" @focus="$event.target.select()" />
                <button class="btn btn-purple" type="button" @click="copyLink">{{ copied ? 'Copied' : 'Copy' }}</button>
              </div>
            </section>

            <section>
              <h3 class="section-title">Invite friends</h3>
              <div class="scroll">
                <ul class="people">
                  <li v-for="f in friends" :key="f.id" class="person">
                    <span class="avatar" :style="{ background: f.color }">{{ initials(f.name) }}</span>
                    <span class="who">{{ f.name }}</span>
                    <span v-if="statusOf(f.id)" class="badge-pill" :class="`pill-${statusOf(f.id)}`">{{ statusLabel[statusOf(f.id)] }}</span>
                    <button v-else class="badge-pill pill-invite" type="button" :disabled="registered" @click="invite(f)">Invite</button>
                  </li>
                </ul>
              </div>
            </section>
          </div>
        </template>

        <!-- ===== Roster ===== -->
        <template #roster>
          <div class="pane">
            <section>
              <div class="section-head">
                <h3 class="section-title">Who's in</h3>
                <span class="live"><i class="live-dot"></i>Updates live</span>
              </div>
              <p v-if="members.length === 1" class="section-sub">No one invited yet. Add friends or share the link.</p>

              <div class="scroll">
                <TransitionGroup name="roster" tag="ul" class="people" aria-live="polite">
                  <li v-for="m in members" :key="m.id" class="person"
                      :class="{ flash: flashIds.has(m.id), asking: removingId === m.id }">
                    <!-- asking "are you sure?" (the card swaps content, so nothing jumps around) -->
                    <template v-if="removingId === m.id">
                      <span class="who">Remove {{ m.name.split(' ')[0] }}?</span>
                      <button class="badge-pill pill-danger" type="button" @click="removeMember(m.id); removingId = null">Yes, remove</button>
                      <button class="badge-pill pill-grey" type="button" @click="removingId = null">Cancel</button>
                    </template>

                    <template v-else>
                      <span class="avatar" :style="{ background: m.color || '#fdebd0' }">{{ initials(m.name) }}</span>
                      <span class="who">
                        {{ m.name }}
                        <small v-if="m.via === 'link'" class="via">via link</small>
                      </span>
                      <span v-if="m.id === lobby.hostId" class="badge-pill pill-host">Host</span>
                      <span v-else class="badge-pill" :class="`pill-${m.status}`">{{ statusLabel[m.status] }}</span>

                      <!-- host only: a small round button on the right edge of each card -->
                      <button v-if="m.id !== lobby.hostId && !registered" class="remove-x" type="button"
                              :aria-label="`Remove ${m.name}`" :title="`Remove ${m.name}`" @click="removingId = m.id">✕</button>
                    </template>
                  </li>
                </TransitionGroup>
              </div>
            </section>
          </div>
        </template>

        <!-- ===== Register ===== -->
        <template #register>
          <div class="pane">
            <!-- this round is done: the lobby stays, ready for the next event -->
            <template v-if="registered">
              <section>
                <h3 class="section-title">Group registered</h3>
                <p class="section-sub">{{ lastRegEvent?.title }} on {{ lastRegEvent?.date }}. These people are signed up:</p>
                <ul class="names">
                  <li v-for="n in lastRegNames" :key="n">{{ n }}</li>
                </ul>
              </section>
              <section>
                <h3 class="section-title">Same group, another event?</h3>
                <p class="section-sub">Keep this lobby and pick a new event. Everyone will be asked to confirm again.</p>
                <button class="btn btn-lime" type="button" @click="planAnother">Plan another event</button>
              </section>
            </template>

            <section v-else>
              <h3 class="section-title">Pitch an event</h3>
              <p class="section-sub">Friends can still accept or decline while you choose.</p>
              <div class="scroll">
                <div class="events" role="radiogroup" aria-label="Events">
                  <label v-for="e in events.filter((x) => x.upcoming)" :key="e.id" class="event" :class="{ used: usedEventIds.has(e.id) }">
                    <input class="sr" type="radio" name="event" :value="e.id" v-model="selectedEventId"
                           :disabled="usedEventIds.has(e.id)" />
                    <span class="event-body">
                      <strong>{{ e.title }}</strong>
                      <span>{{ e.date }}</span>
                      <span>{{ e.venue }}</span>
                      <span class="event-meta">{{ e.limitsText }}</span>
                      <span v-if="usedEventIds.has(e.id)" class="badge-pill pill-accepted">Already registered</span>
                    </span>
                  </label>
                </div>
              </div>
            </section>
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

        <button class="btn btn-lime" type="button" :disabled="!canRegister" @click="registerGroup">Register group</button>
      </div>
    </main>

    <!-- ───── Registered events (scrolls inside its own box) ───── -->
    <aside class="panel-wrap" aria-label="Registered events">
      <div class="side-panel">
        <h3 class="panel-title">Registered events</h3>

        <ul v-if="eventRows.length" class="evlist">
          <li v-for="(r, i) in eventRows" :key="r.key" class="ev">
            <button class="ev-head" type="button" :aria-expanded="isOpen(r, i)" :aria-controls="`ev-${r.key}`" @click="toggleEvent(r, i)">
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
          <button class="btn btn-lime btn-small" type="button" @click="goTo('register')">Choose event</button>
        </div>
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
          <h3 id="del-title" class="dialog-title">Delete "{{ lobby.name }}"?</h3>
          <p v-if="inactive">Nothing has happened here for {{ daysIdle }} days, so it's safe to clear out.</p>
          <p v-else>
            This lobby is still active. If it's the same group of friends, keep it and plan another event instead.
          </p>
          <p>Deleting removes the lobby and its roster for everyone. Events you've already registered for are not cancelled.</p>
          <div class="dialog-actions">
            <button class="btn btn-ghost" type="button" @click="confirmingDelete = false">Keep lobby</button>
            <button v-if="registered" class="btn btn-purple" type="button" @click="confirmingDelete = false; planAnother()">Plan another event</button>
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
// NOTE: every page must import the SAME useLobbies file, or each page gets its own separate copy of the data.
import { useLobbies, daysAgo, timeAgo, INACTIVE_DAYS } from '../composables/useLobbies'

/* ---------- props / emits ---------- */
const props = defineProps({
  lobbyId: { type: String, required: true },
})
const emit = defineEmits(['back', 'deleted', 'invite', 'remove', 'register', 'respond'])

const store = useLobbies()
const friends = computed(() => store.friends)
const events = computed(() => store.events)
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
const removingId = ref(null) // which roster card is asking "Remove …?"

const selectedEventId = computed({
  get: () => lobby.value?.pitchedEventId ?? null,
  set: (id) => store.pitchEvent(props.lobbyId, id),
})
const selectedEvent = computed(() => events.value.find((e) => e.id === selectedEventId.value) || null)
const acceptedMembers = computed(() => members.value.filter((m) => m.status === 'accepted'))
const counts = computed(() => ({
  pending: members.value.filter((m) => m.status === 'pending').length,
  declined: members.value.filter((m) => m.status === 'declined').length,
}))
const statusOf = (id) => members.value.find((m) => m.id === id)?.status ?? null

/* events this lobby has already signed up for */
const history = computed(() => lobby.value?.history ?? [])
const usedEventIds = computed(() => new Set(history.value.map((h) => h.eventId)))
const eventById = (id) => events.value.find((e) => e.id === id)
const lastReg = computed(() => history.value[history.value.length - 1])
const lastRegEvent = computed(() => (lastReg.value ? eventById(lastReg.value.eventId) : null))
const lastRegNames = computed(() =>
  (lastReg.value?.memberIds ?? []).map((id) => members.value.find((m) => m.id === id)?.name).filter(Boolean)
)

/* side panel: the event being pitched (live counts) + every event already registered (counts at sign-up) */
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
const openMap = reactive({}) // which event cards are expanded; the first one starts open
const isOpen = (r, i) => openMap[r.key] ?? i === 0
const toggleEvent = (r, i) => { openMap[r.key] = !isOpen(r, i) }

/* How many accepted members the chosen event can take */
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

function invite(friend) {
  store.addMember(props.lobbyId, friend)
  emit('invite', friend.id) // -> POST /lobbies/:id/invites
}
function removeMember(id) {
  store.removeMember(props.lobbyId, id)
  emit('remove', id) // -> DELETE /lobbies/:id/members/:memberId
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

/* live roster: flash any card whose status just changed (works for updates from anywhere) */
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
  removingId.value = null
}
onMounted(() => window.addEventListener('keydown', onEsc))
onBeforeUnmount(() => window.removeEventListener('keydown', onEsc))
</script>

<style scoped>
/* Design-system rules: outer boxes 25px radius, inner boxes 15px radius, 15px padding,
   page title 25px, default text 11px. Colours/fonts come from theme.css. */
.app {
  --ink: var(--color-black, #1f2a44);
  --grey: var(--color-grey, #cfd8e8);
  --card: var(--color-white, #f0f1f7);
  --blue: #5d6be4;
  --dark-blue: var(--color-dark-blue, #3f48cc);
  --lime: #c9eb6c;
  --orange: #ee8559;
  --purple: #c777f0;
  --danger: #b3261e;

  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  grid-template-areas:
    'head panel'
    'stage panel';
  grid-template-rows: auto 1fr;
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
  border-radius: 25px;
}
.app *, .app *::before, .app *::after { box-sizing: border-box; }
.app button, .app input, .app textarea { font-family: inherit; }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
:focus-visible { outline: 3px solid var(--ink); outline-offset: 2px; }
.head :focus-visible, .stage :focus-visible { outline-color: #fff; }

/* ── Buttons ── */
.btn {
  --nudge: 2px;   /* pushes the label down so it sits in the middle; tune to your font */
  padding: calc(12px + var(--nudge)) 26px calc(12px - var(--nudge));
  border: 0; border-radius: 999px; cursor: pointer;
  font: 700 11px/1 'TextFont', sans-serif; letter-spacing: 0.14em; text-transform: uppercase;
  background: var(--dark-blue); color: #fff; transition: transform 0.15s;
}
.btn-small { padding: calc(8px + var(--nudge)) 16px calc(8px - var(--nudge)); }
.btn:hover:not(:disabled) { transform: translateY(-1px); }
.btn:disabled { opacity: 0.45; cursor: not-allowed; }
.btn-purple { background: var(--purple); }
.btn-orange { background: var(--orange); }
.btn-lime { background: var(--lime); color: var(--ink); }
.btn-danger { background: var(--danger); }
.btn-ghost { background: transparent; color: var(--ink); box-shadow: inset 0 0 0 2px var(--ink); }
.btn-light { background: transparent; color: #fff; box-shadow: inset 0 0 0 2px #fff; }

/* ── Pills (one style for every badge) ── */
.badge-pill {
  display: inline-block;
  height: 22px;
  border: 0;
  border-radius: 9999px;
  background-color: var(--grey);
  padding: 5px 12px 8px 12px;
  color: var(--ink);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
}
button.badge-pill { cursor: pointer; }
button.badge-pill:disabled { opacity: 0.45; cursor: not-allowed; }
.pill-pending { background: var(--orange); color: #fff; }
.pill-accepted, .pill-invite { background: var(--lime); }
.pill-declined, .pill-grey { background: var(--grey); }
.pill-host { background: var(--dark-blue); color: #fff; }
.pill-danger { background: var(--danger); color: #fff; }
.pill-warn { background: red; color: #fff; }

/* ── Heading ── */
.head { grid-area: head; display: flex; align-items: flex-start; justify-content: space-between; gap: 15px; }
.head-main { display: grid; justify-items: start; gap: 8px; min-width: 0; flex: 1; }
.head-actions { display: flex; gap: 8px; flex: none; }
.back-link {
  display: inline-flex; align-items: center; gap: 8px; padding: 0; border: 0; background: none; cursor: pointer;
  color: #fff; font: 400 11px/1 'TextFont', sans-serif; letter-spacing: 0.14em; text-transform: uppercase;
}
.back-link span { text-decoration: underline; text-underline-offset: 4px; }
.page-title { margin: 0; color: #fff; font: 400 25px/1.1 'HeaderFont', sans-serif; letter-spacing: 0.02em; text-transform: uppercase; overflow-wrap: anywhere; }
.lobby-desc, .lobby-meta { margin: 0; max-width: 70ch; color: #fff; line-height: 1.5; }

.edit { display: grid; gap: 8px; width: min(520px, 100%); }
.field { display: grid; gap: 4px; color: #fff; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
.field input, .field textarea { padding: 9px 14px; border: 0; border-radius: 15px; background: var(--card); color: var(--ink); font-size: 11px; letter-spacing: 0; text-transform: none; font-weight: 400; resize: vertical; }
.edit-actions { display: flex; gap: 8px; }

/* ── Folder content ── */
.stage { grid-area: stage; min-width: 0; }
.pane { display: grid; gap: 20px; }
.section-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.section-title { margin: 0 0 4px; color: #fff; font: 400 20px/1.1 'HeaderFont', sans-serif; letter-spacing: 0.03em; text-transform: uppercase; }
.section-sub { margin: 0 0 12px; color: #fff; line-height: 1.4; }
.section-title + .scroll, .section-head + .scroll { margin-top: 9px; }
.live { display: inline-flex; align-items: center; gap: 6px; color: #fff; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
.live-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--lime); animation: pulse 1.8s infinite; }

/* scroll areas inside the folder */
.scroll {
  max-height: clamp(170px, 34vh, 300px); overflow-y: auto; margin: -3px; padding: 3px 11px 3px 3px;
  scrollbar-width: thin; scrollbar-color: rgba(255, 255, 255, 0.6) transparent;
}

.link-box { display: flex; align-items: center; gap: 10px; }
.link-input { flex: 1; min-width: 0; height: 35px; padding: 3px 16px 0; border: 0; border-radius: 999px; background: var(--card); color: var(--ink); font: inherit; }

/* people cards (friends list + roster) */
.people { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.person { display: flex; align-items: center; gap: 10px; min-height: 48px; padding: 8px 12px; border-radius: 15px; background: var(--card); color: var(--ink); }
.person.asking { background: #fff; box-shadow: inset 0 0 0 2px var(--danger); }
.avatar { display: grid; place-items: center; width: 32px; height: 32px; flex: none; border-radius: 50%; font-weight: 700; font-size: 11px; }
.who { flex: 1; min-width: 0; font-size: 13px; letter-spacing: 0.04em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.via { margin-left: 6px; opacity: 0.7; font-size: 11px; }
.remove-x {
  display: grid; place-items: center; flex: none; width: 26px; height: 26px; padding: 2px 0 0;
  border: 0; border-radius: 50%; background: rgba(31, 42, 68, 0.1); color: var(--ink);
  font-size: 11px; line-height: 1; cursor: pointer; transition: background 0.15s, color 0.15s;
}
.remove-x:hover, .remove-x:focus-visible { background: var(--danger); color: #fff; }

.roster-enter-active, .roster-leave-active { transition: all 0.3s ease; }
.roster-enter-from, .roster-leave-to { opacity: 0; transform: translateX(-16px); }
.flash { animation: flash 1.2s ease; }
@keyframes flash { 0%, 60% { background: #fff; } 100% { background: var(--card); } }
@keyframes pulse { 50% { opacity: 0.25; } }

/* register tab */
.events { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 10px; }
.event { display: block; cursor: pointer; }
.event.used { opacity: 0.6; cursor: not-allowed; }
.event-body { display: grid; justify-items: start; gap: 3px; height: 100%; padding: 15px; border-radius: 15px; background: var(--card); color: var(--ink); border: 3px solid transparent; }
.event-body strong { font: 400 14px/1.2 'HeaderFont', sans-serif; letter-spacing: 0.03em; text-transform: uppercase; }
.event-meta { opacity: 0.8; }
.event-body .badge-pill { margin-top: 4px; }
.event input:checked + .event-body { border-color: var(--lime); background: #fff; }
.event input:focus-visible + .event-body { outline: 3px solid #fff; outline-offset: 2px; }
.names { display: flex; flex-wrap: wrap; gap: 8px; margin: 0; padding: 0; list-style: none; }
.names li { padding: 6px 12px; border-radius: 999px; background: var(--lime); color: var(--ink); font-weight: 700; }

.register-bar {
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 15px;
  margin-top: 15px; padding: 15px; border-radius: 15px; background: var(--card); color: var(--ink);
}
.progress { flex: 1 1 200px; min-width: 0; padding: 20px; align-items: center; }
.meter { height: 12px; border-radius: 999px; background: rgba(31, 42, 68, 0.15); overflow: hidden; }
.meter i { display: block; height: 100%; border-radius: inherit; background: var(--dark-blue); transition: width 0.4s ease; }
.hint { margin: 8px 0 0; font-weight: 700; letter-spacing: 0.04em; }

/* ── Registered events panel: fills the full height and scrolls inside ── */
.panel-wrap { grid-area: panel; position: relative; min-height: 320px; }
.side-panel {
  position: absolute; inset: 0; overflow-y: auto; padding: 15px; border-radius: 25px; background: var(--grey); color: var(--ink);
  scrollbar-width: thin; scrollbar-color: rgba(31, 42, 68, 0.35) transparent;
}
.panel-title { margin: 8px 0 15px; text-align: center; font: 400 20px/1.1 'HeaderFont', sans-serif; letter-spacing: 0.03em; text-transform: uppercase; }
.evlist { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
.ev { display: grid; justify-items: start; gap: 6px; padding: 15px; border-radius: 15px; background: var(--card); }
.ev-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; padding: 0; border: 0; background: none; color: inherit; cursor: pointer; text-align: left; }
.ev-title { font: 400 16px/1.15 'HeaderFont', sans-serif; letter-spacing: 0.03em; text-transform: uppercase; overflow-wrap: anywhere; }
.ev-meta { margin: 0; line-height: 1.6; }
.chev { flex: none; width: 8px; height: 8px; margin: -3px 4px 0 0; border-right: 2px solid var(--ink); border-bottom: 2px solid var(--ink); border-radius: 2px; transform: rotate(45deg); opacity: 0.7; transition: transform 0.2s; }
.chev.open { transform: rotate(-135deg); margin-top: 3px; }
.stats { display: grid; gap: 8px; width: 100%; margin-top: 6px; }
.stat { display: flex; align-items: center; justify-content: space-between; padding: 6px 8px 6px 15px; border-radius: 999px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
.stat b { display: grid; place-items: center; min-width: 22px; height: 22px; padding: 2px 0 0; border-radius: 50%; color: #fff; font-weight: 700; }
.stat-pending { background: var(--grey); }
.stat-pending b { background: var(--dark-blue); }
.stat-declined { background: var(--orange); }
.stat-accepted { background: var(--lime); }
.stat-declined b, .stat-accepted b { background: rgba(0, 0, 0, 0.3); }
.ev-empty { display: grid; justify-items: start; gap: 10px; padding: 15px; border-radius: 15px; background: var(--card); }
.ev-empty p { margin: 0; }

/* ── Overlays ── */
.overlay { position: fixed; inset: 0; z-index: 50; display: grid; place-items: center; padding: 15px; overflow-y: auto; background: rgba(31, 42, 68, 0.65); }
.dialog { display: grid; gap: 8px; width: min(440px, 100%); padding: 15px; border-radius: 25px; background: var(--card); color: var(--ink); }
.dialog-title { margin: 0 0 4px; font: 400 16px/1.15 'HeaderFont', sans-serif; letter-spacing: 0.03em; }
.dialog p { margin: 0; line-height: 1.4; }
.dialog-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; margin-top: 8px; }
.dialog :focus-visible { outline-color: var(--ink); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ── Responsive ── */
@media (max-width: 1100px) {
  .app { grid-template-columns: minmax(0, 1fr); grid-template-areas: 'head' 'stage' 'panel'; grid-template-rows: auto; }
  .panel-wrap { min-height: 0; }
  .side-panel { position: static; max-height: 480px; }
}
@media (max-width: 720px) {
  .people { grid-template-columns: 1fr; }
  .head { flex-direction: column; }
}
@media (prefers-reduced-motion: reduce) {
  .live-dot, .flash { animation: none; }
  .roster-enter-active, .roster-leave-active, .meter i, .btn, .chev, .remove-x { transition: none; }
}
</style>