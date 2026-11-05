<!--
  LobbyCalendar.vue  (Vue 3, <script setup>)
  The shared calendar for one lobby. Shown in the Shared calendar tab of Lobby.vue.
  Props: lobbyId, userId
  Emits: select-day({ date: "YYYY-MM-DD", chips }) or select-day(null) when nothing is selected
         day-tapped when the user picks a day
-->
<template>
  <section class="cal">
    <!-- month header -->
    <div class="section-head">
      <h3 class="section-title">{{ monthLabel }}</h3>
      <div class="month-nav">
        <span v-if="loading" class="loading">Loading…</span>
        <button class="nav-btn" type="button" aria-label="Previous month" @click="changeMonth(-1)"><span
            class="nav-btn-text">‹</span></button>
        <button class="nav-btn" type="button" aria-label="Next month" @click="changeMonth(1)"><span
            class="nav-btn-text">›</span></button>
      </div>
    </div>

    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <!-- member circles: click to hide/show -->
    <div class="members" aria-label="Members">
      <button v-for="m in members" :key="m.id" type="button" class="member"
        :class="{ hidden: hiddenIds.includes(m.id) }" :style="{ background: colourFor(m.id) }" :aria-label="m.username"
        :aria-pressed="!hiddenIds.includes(m.id)" @click="toggleMember(m.id)">
        {{ initial(m.id) }}
        <AvatarPic :path="m.avatar" />
        <!-- name pill shown on hover/focus -->
        <span class="name-pill" aria-hidden="true">{{ m.username }}</span>
      </button>
    </div>

    <!-- grid -->
    <div class="grid-scroll-container" v-auto-scrollbar>
      <div class="grid">
        <span v-for="d in WEEKDAYS" :key="d" class="weekday">{{ d }}</span>

        <span v-for="n in blanks" :key="'blank' + n" class="day blank" aria-hidden="true"></span>

        <button v-for="day in days" :key="day.key" type="button" class="day"
          :class="{ free: day.free, selected: day.key === selectedDay, today: day.key === todayKey }"
          @click="selectDay(day.key)">
          <span class="day-num">{{ day.num }}</span>

          <span v-for="(chip, i) in day.chips.slice(0, 3)" :key="i" class="event-bar"
            :class="{ 'event-bar-lobby': chip.lobby }" :style="chip.colour ? { background: chip.colour } : null"
            :title="chip.text"></span>

          <span v-if="day.chips.length > 3" class="more">
            +{{ day.chips.length - 3 }}
          </span>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { API_URL } from '../utils/api'
import { vAutoScrollbar } from '../directives/autoScrollbar'
import AvatarPic from './AvatarPic.vue'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
// same palette as the lobby avatars, handed out in member order
const COLOURS = ['#C9EB6C', '#D98BF5', '#F2B16B', '#9fd3ff', '#ffb3a7', '#fdebd0']

const props = defineProps({
  lobbyId: { type: String, required: true },
  userId: { type: String, default: null },
})
const emit = defineEmits(['select-day', 'day-tapped'])

/* ---------- state ---------- */
const now = new Date()
const viewMonth = ref(new Date(now.getFullYear(), now.getMonth(), 1))
const members = ref([])
const items = ref([])
const hiddenIds = ref([])
const selectedDay = ref(null)
const loading = ref(false)
const error = ref('')

const pad = (n) => String(n).padStart(2, '0')
const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const todayKey = dateKey(now)

/* ---------- loading ---------- */
let latestRequest = 0   // ignore an older month's reply if the user clicked on

async function load() {
  if (!props.userId) return
  const request = ++latestRequest
  const month = `${viewMonth.value.getFullYear()}-${pad(viewMonth.value.getMonth() + 1)}`

  loading.value = true
  error.value = ''
  try {
    const res = await fetch(`${API_URL}/api/lobbies/${props.lobbyId}/calendar?userId=${props.userId}&month=${month}`)
    const data = await res.json()
    if (request !== latestRequest) return
    if (!res.ok) throw new Error(data.message)

    members.value = data.members
    // UTC strings from the server -> local Date objects
    items.value = data.items.map((it) => ({ ...it, start: new Date(it.start), end: new Date(it.end) }))
  } catch (err) {
    if (request !== latestRequest) return
    error.value = err.message ? `Could not load the calendar: ${err.message}` : 'Could not load the calendar.'
  } finally {
    if (request === latestRequest) loading.value = false
  }
}

onMounted(load)
defineExpose({ reload: load })   // the lobby page reloads after adding a plan
watch(viewMonth, load)
watch(() => [props.lobbyId, props.userId], load)

/* ---------- month header ---------- */
const monthLabel = computed(() => viewMonth.value.toLocaleDateString('en-SG', { month: 'long', year: 'numeric' }))

function changeMonth(step) {
  viewMonth.value = new Date(viewMonth.value.getFullYear(), viewMonth.value.getMonth() + step, 1)
  selectedDay.value = null   // the selected day isn't in the new month
}

/* ---------- members ---------- */
function colourFor(id) {
  const i = members.value.findIndex((m) => m.id === id)
  return COLOURS[(i < 0 ? 0 : i) % COLOURS.length]
}

function initial(id) {
  const m = members.value.find((x) => x.id === id)
  return (m?.username || '?')[0].toUpperCase()
}

function toggleMember(id) {
  hiddenIds.value = hiddenIds.value.includes(id)
    ? hiddenIds.value.filter((x) => x !== id)
    : [...hiddenIds.value, id]
}

/* ---------- grid ---------- */
// blank cells so the 1st lands on the right weekday
const blanks = computed(() => viewMonth.value.getDay())

const days = computed(() => {
  const year = viewMonth.value.getFullYear()
  const month = viewMonth.value.getMonth()
  const count = new Date(year, month + 1, 0).getDate()
  const out = []

  for (let num = 1; num <= count; num++) {
    const dayStart = new Date(year, month, num)
    const dayEnd = new Date(year, month, num + 1)

    // anything that overlaps this day; hidden members' items are skipped
    const dayItems = items.value.filter((it) =>
      it.start < dayEnd && it.end > dayStart &&
      !(it.memberId && hiddenIds.value.includes(it.memberId)))

    // lobby events and plans first, so they get the two visible spots
    const isLobby = (it) => it.type === 'lobby' || it.type === 'plan'
    dayItems.sort((a, b) => isLobby(b) - isLobby(a))

    out.push({
      key: dateKey(dayStart),
      num,
      chips: dayItems.map(toChip),
      free: dayItems.length === 0,
    })
  }
  return out
})

// What a chip shows. The lobby page's "Selected day" panel uses these too.
function toChip(it) {
  if (it.type === 'lobby' || it.type === 'plan') return { text: it.title, lobby: true, colour: null }
  const label = it.type === 'busy' ? 'Busy' : it.title
  return { text: `${initial(it.memberId)} · ${label}`, lobby: false, colour: colourFor(it.memberId) }
}

/* ---------- selecting a day ---------- */
function selectDay(key) {
  selectedDay.value = key
  emit('day-tapped')
}

// Tell the lobby page about the selected day, and again when its chips change
// (data reloaded, or a member hidden/shown)
watch(
  () => days.value.find((d) => d.key === selectedDay.value),
  (day) => emit('select-day', day ? { date: day.key, chips: day.chips } : null),
)
</script>

<style scoped>
.cal {
  --ink: var(--color-black);
  --card: var(--color-white);
  --lobby: var(--color-blue);
  --free: var(--color-white);
  --danger: var(--color-red);

  background-color: var(--color-white);
  border-radius: 15px;
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 100%;
  padding: 10px;
  gap: 12px;
  font-size: 11px;
  overflow: hidden;
}

.cal button {
  font-family: inherit;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 0 5px;
  flex-shrink: 0;
}

.section-title {
  margin: 0;
  color: var(--color-black);
  font: 400 20px/1.1 'HeaderFont', sans-serif;
  text-transform: uppercase;
}

.month-nav {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-btn {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 50%;
  background: var(--card);
  color: var(--color-dark-grey);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  transition: transform 0.15s;
}

.nav-btn-text {
  padding: 2px 0 0 1px;
}

.nav-btn:hover {
  transform: translateY(-1px);
}

.loading {
  color: var(--color-white);
  font-weight: 700;
  text-transform: uppercase;
}

.error {
  margin: 0;
  padding: 4px 10px;
  justify-self: start;
  border-radius: 999px;
  background: var(--danger);
  color: var(--color-white);
  font-weight: 700;
  flex-shrink: 0;
}

.members {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-left: 5px;
  flex-shrink: 0;
  position: relative;
  z-index: 50;
}

.member {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  padding: 2px 0 0;
  border: 0;
  border-radius: 50%;
  color: var(--ink);
  font-weight: 700;
  font-size: 11px;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.15s;
  position: relative;
}

.member:hover {
  transform: translateY(-1px);
  z-index: 100;
}

.member.hidden {
  opacity: 0.35;
  text-decoration: line-through;
}

.name-pill {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 100;
  padding: 5px 12px 4px;
  border-radius: 999px;
  background: var(--ink);
  color: var(--color-white);
  font-weight: 700;
  font-size: 11px;
  text-transform: uppercase;
  white-space: nowrap;

  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: translateY(-2px);
  transition: opacity 0.2s ease, visibility 0.2s ease, transform 0.2s ease;
}

.member:hover .name-pill,
.member:focus-visible .name-pill {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.grid-scroll-container {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
}

.weekday {
  color: var(--color-dark-grey);
  font-weight: 700;
  text-transform: uppercase;
  text-align: center;
  position: sticky;
  top: 0;
  background-color: var(--color-white);
  z-index: 2;
  padding-bottom: 4px;
}

.day {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 3px;
  min-width: 0;
  min-height: 70px;
  aspect-ratio: 1 / 1;
  padding: 6px;
  box-sizing: border-box;
  overflow: hidden;

  border: 2px solid var(--color-grey);
  border-radius: 15px;
  background: var(--card);
  color: var(--color-dark-grey);
  text-align: left;
  cursor: pointer;
}

.day.blank {
  background: transparent;
  cursor: default;
}

.day.free {
  background: var(--free);
}

.day.selected {
  border: 2px solid var(--color-yellow);
  color: var(--color-dark-yellow);
  background-color: #f7e7c6;
}

.day-num {
  font-weight: 700;
  font-size: 10px;
  padding: 2px 0 0 4px;
}

.day.today .day-num {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.event-bar {
  display: block;
  flex: 0 0 5px;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  height: 5px;
  box-sizing: border-box;
  border-radius: 999px;
  background-color: var(--color-green);
}

.event-bar-lobby {
  background-color: var(--color-blue);
}

.more {
  padding-left: 2px;
  font-size: 9px;
  opacity: 0.7;
}

:focus-visible {
  outline: 3px solid var(--color-white);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {

  .nav-btn,
  .member {
    transition: none;
  }
}

/* =========================
   MOBILE CALENDAR
========================= */
@media (max-width: 768px) {

  .cal {
    margin: 0;
    padding: 8px;
    gap: 8px;
    border-radius: 12px;
  }

  /* Month header */
  .section-head {
    padding: 0 3px;
    gap: 5px;
  }

  .section-title {
    font-size: 16px;
  }

  .month-nav {
    gap: 5px;
  }

  .nav-btn {
    width: 27px;
    height: 27px;
    font-size: 15px;
  }

  /* Member avatars */
  .members {
    gap: 6px;
    margin-left: 3px;
  }

  .member {
    width: 24px;
    height: 24px;
    font-size: 9px;
  }

  /* Calendar grid */
  .grid-scroll-container {
    padding-right: 0;
  }

  .grid {
    gap: 4px;
  }

  .weekday {
    font-size: 9px;
    padding-bottom: 3px;
  }

  /* Individual day cells */
  .day {
  min-width: 0;
  min-height: 0;
  aspect-ratio: 1 / 1;
  padding: 4px;
  gap: 2px;
  border-width: 1px;
  border-radius: 9px;
  box-sizing: border-box;
  overflow: hidden;
}

.day.selected {
  border-width: 2px;
}

.event-bar {
  flex-basis: 4px;
  height: 4px;
}

.more {
  font-size: 7px;
  padding-left: 1px;
}

  .error {
    font-size: 9px;
  }
}
</style>