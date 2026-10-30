<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import BaseButton from './BaseButton.vue'
import BaseInput from './BaseInput.vue'
import { formatSession, sessionKey } from '../utils/formatSession'

const props = defineProps({
  event: { type: Object, required: true },
  interested: { type: Boolean, default: false },
  goingBySession: { type: Object, default: () => ({}) },
  fromDate: { type: String, default: '' },
  score: { type: Number, default: null },
  userSchedule: { type: Array, default: () => [] },
  variant: { type: String, default: 'discover' }
})

const emit = defineEmits([
  'set-interested',
  'set-going',
  'less-like-this',
  'invite-friends',
  'remove-history',
  'card-click'
])

const isSlotMenuOpen = ref(false)
const menuWrapperRef = ref(null)

const sgDay = (d) => new Date(d).toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' })

const sortedSessions = computed(() =>
  [...props.event.sessions].sort((a, b) => sessionKey(a) - sessionKey(b))
)

const attendingSessions = computed(() =>
  sortedSessions.value.filter(s => props.goingBySession[sessionKey(s)] === 'attending')
)

function hasOverlap(session) {
  if (!props.userSchedule?.length) return false
  const sStart = new Date(session.startTime).getTime()
  const sEnd = new Date(session.endTime).getTime()
  return props.userSchedule.some(c => {
    const cStart = new Date(c.start || c.startTime).getTime()
    const cEnd = new Date(c.end || c.endTime).getTime()
    return sStart < cEnd && sEnd > cStart
  })
}

const bestFitSession = computed(() => {
  const from = props.fromDate || sgDay(new Date())
  const upcoming = sortedSessions.value.filter(s => sgDay(s.startTime) >= from)
  const pool = upcoming.length ? upcoming : sortedSessions.value
  return pool.find(s => !hasOverlap(s)) || pool[0]
})

const pickedKey = ref(null)
const shownSession = computed(() => {
  if (props.variant === 'attending') {
    const pool = attendingSessions.value
    return pool.find(s => sessionKey(s) === pickedKey.value) ?? pool[0] ?? bestFitSession.value
  }

  const picked = sortedSessions.value.find(s => sessionKey(s) === pickedKey.value)
  if (picked) return picked

  if (props.variant === 'attended') {
    const mine = sortedSessions.value.find(
      s => props.goingBySession[sessionKey(s)] === 'attended'
    )
    if (mine) return mine
  }
  return bestFitSession.value
})

const going = computed(() => props.goingBySession[sessionKey(shownSession.value)] ?? 'none')
const hasStarted = computed(() => new Date(shownSession.value.startTime) <= new Date())
const hasEnded = computed(() => new Date(shownSession.value.endTime) < new Date())
const attendingDisabled = computed(() => hasEnded.value && going.value !== 'attending')
const attendedDisabled = computed(() => !hasStarted.value && going.value !== 'attended')

const formattedDateTime = computed(() => {
  if (!shownSession.value?.startTime || !shownSession.value?.endTime) return ''
  const start = new Date(shownSession.value.startTime)
  const end = new Date(shownSession.value.endTime)

  const formatH = (d) =>
    d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: d.getMinutes() > 0 ? '2-digit' : undefined,
      hour12: true,
      timeZone: 'Asia/Singapore'
    })

  const timeRange = `${formatH(start).replace(':00', '')}-${formatH(end).replace(':00', '')}`
  const dateStr = start.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Singapore'
  })

  return `${timeRange} - ${dateStr}`
})

function handleAddBtnClick() {
  if (props.event.sessions && props.event.sessions.length > 1) {
    isSlotMenuOpen.value = !isSlotMenuOpen.value
  } else {
    toggleGoing('attending', shownSession.value)
  }
}

function selectSessionAndAdd(session) {
  pickedKey.value = sessionKey(session)
  toggleGoing('attending', session)
  isSlotMenuOpen.value = false
}

function selectSession(session) {
  pickedKey.value = sessionKey(session)
  isSlotMenuOpen.value = false
}

function toggleGoing(value, session = shownSession.value) {
  emit('set-going', {
    sessionStart: session.startTime,
    status: going.value === value ? 'none' : value
  })
}

function removeHistory() {
  if (window.confirm('Remove this event from your history? Your note will be deleted too.')) {
    emit('remove-history', props.event._id || props.event.id)
  }
}

function handleClickOutside(e) {
  if (menuWrapperRef.value && !menuWrapperRef.value.contains(e.target)) {
    isSlotMenuOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))

const matchBadgeClass = computed(() =>
  props.score >= 80 ? 'badge-green' : 'badge-orange'
)

const API_URL = 'http://localhost:8000'
const imageSrc = computed(() =>
  props.event.image?.startsWith('/') ? API_URL + props.event.image : props.event.image
)
</script>

<template>
  <!-- Card utama nge-emit card-click saat diklik -->
  <div class="event-card" @click="emit('card-click', event)">
    <div v-if="variant === 'discover' && score !== null" class="card-top-bar">
      <span class="match-badge" :class="matchBadgeClass">
        {{ score }}% match
      </span>
      <button 
        type="button" 
        class="btn-less" 
        @click.stop="emit('less-like-this', event._id || event.id)"
      >
        Less like this
      </button>
    </div>

    <div class="poster-container">
      <img 
        v-if="event.image" 
        :src="imageSrc"
        :alt="event.title" 
        class="poster-img" 
      />
      <div v-else class="poster-placeholder"></div>
    </div>

    <div class="event-details">
      <h2 class="event-title">{{ event.title }}</h2>
      <p v-if="event.organiser" class="event-organiser">{{ event.organiser }}</p>
      
      <div class="event-time-venue">
        <p class="event-datetime-line">{{ formattedDateTime }}</p>
        <p class="event-venue-line">{{ event.venue }}</p>
      </div>
    </div>

    <!-- Tombol aksi dikasih @click.stop biar nggak mentrigger card-click -->
    <div class="actions-area" @click.stop>
      <template v-if="variant === 'discover'">
        <div class="btn-row">
          <div class="dropdown-btn-wrapper" ref="menuWrapperRef">
            <BaseButton 
              class="action-pill-btn btn-dark-green"
              :disabled="attendingDisabled"
              @click="handleAddBtnClick"
            >
              {{ going === 'attending' ? '✓ ADDED' : '+ ADD TO CALENDAR' }}
              <span 
                v-if="event.sessions && event.sessions.length > 1" 
                class="dropdown-chevron" 
                :class="{ rotate: isSlotMenuOpen }"
              ></span>
            </BaseButton>

            <div v-if="isSlotMenuOpen" class="slots-popup-menu">
              <div class="popup-header">Pick a Timeslot:</div>
              <div 
                v-for="s in sortedSessions" 
                :key="sessionKey(s)"
                class="slot-menu-item"
                :class="{ 'is-active': sessionKey(s) === sessionKey(shownSession) }"
                @click="selectSessionAndAdd(s)"
              >
                <div class="slot-text-group">
                  <span class="slot-title">{{ formatSession(s) }}</span>
                  <span v-if="hasOverlap(s)" class="overlap-tag">Overlaps timetable</span>
                  <span v-else class="bestfit-tag">Fits your schedule!</span>
                </div>
              </div>
            </div>
          </div>

          <BaseButton 
            variant="circle"
            class="heart-btn" 
            :class="{ active: interested }"
            title="Interested"
            @click="emit('set-interested', !interested)"
          >
            <span class="custom-icon icon-heart"></span>
          </BaseButton>
        </div>
      </template>

      <template v-else-if="variant === 'attending'">
        <div
          v-if="attendingSessions.length > 1"
          class="dropdown-btn-wrapper"
          ref="menuWrapperRef"
        >
          <BaseButton
            class="action-pill-btn"
            variant="outline-main"
            @click="isSlotMenuOpen = !isSlotMenuOpen"
          >
            {{ formatSession(shownSession) }}
            <span class="dropdown-chevron" :class="{ rotate: isSlotMenuOpen }"></span>
          </BaseButton>

          <div v-if="isSlotMenuOpen" class="slots-popup-menu">
            <div class="popup-header">Your sessions ({{ attendingSessions.length }}):</div>
            <div
              v-for="s in attendingSessions"
              :key="sessionKey(s)"
              class="slot-menu-item"
              :class="{ 'is-active': sessionKey(s) === sessionKey(shownSession) }"
              @click="selectSession(s)"
            >
              <div class="slot-text-group">
                <span class="slot-title">{{ formatSession(s) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="btn-row">
          <BaseButton
            class="action-pill-btn"
            variant="outline-main"
            :disabled="attendedDisabled"
            :title="attendedDisabled ? 'Available once this session starts' : ''"
            @click="toggleGoing('attended')"
          >
            MARK AS ATTENDED
          </BaseButton>

          <BaseButton
            variant="circle"
            class="trash-btn"
            title="Remove this session from attending"
            @click="toggleGoing('none')"
          >
            <span class="custom-icon icon-trash"></span>
          </BaseButton>
        </div>
      </template>

      <template v-else-if="variant === 'interested'">
        <div class="btn-row">
          <div class="dropdown-btn-wrapper" ref="menuWrapperRef">
            <BaseButton 
              class="action-pill-btn btn-green" 
              :disabled="attendingDisabled"
              @click="handleAddBtnClick"
            >
              {{ going === 'attending' ? '✓ ADDED' : 'ADD TO CALENDAR' }}
              <span 
                v-if="event.sessions && event.sessions.length > 1" 
                class="dropdown-chevron" 
                :class="{ rotate: isSlotMenuOpen }"
              ></span>
            </BaseButton>

            <div v-if="isSlotMenuOpen" class="slots-popup-menu">
              <div class="popup-header">Pick a Timeslot:</div>
              <div 
                v-for="s in sortedSessions" 
                :key="sessionKey(s)"
                class="slot-menu-item"
                :class="{ 'is-active': sessionKey(s) === sessionKey(shownSession) }"
                @click="selectSessionAndAdd(s)"
              >
                <div class="slot-text-group">
                  <span class="slot-title">{{ formatSession(s) }}</span>
                  <span v-if="hasOverlap(s)" class="overlap-tag">Overlaps</span>
                  <span v-else class="bestfit-tag">Fits schedule!</span>
                </div>
              </div>
            </div>
          </div>

          <BaseButton 
            variant="circle"
            class="heart-btn" 
            :class="{ active: interested }"
            title="Interested"
            @click="emit('set-interested', !interested)"
          >
            <span class="custom-icon icon-heart"></span>
          </BaseButton>
        </div>

        <button 
          type="button" 
          class="link-action-btn" 
          @click="emit('invite-friends', event._id || event.id)"
        >
          INVITE FRIENDS!
        </button>
      </template>

      <template v-else-if="variant === 'attended'">
        <BaseButton 
          class="action-pill-btn btn-purple w-100" 
          @click="toggleGoing('attending')"
        >
          UNMARK
        </BaseButton>

        <button 
          type="button" 
          class="link-action-btn dark-link" 
          @click="removeHistory"
        >
          REMOVE FROM HISTORY
        </button>
      </template>

      
    </div>
  </div>
</template>

<style scoped>
.event-card {
  background-color: var(--color-white);
  border-radius: 28px;
  padding: 16px;
  width: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  box-shadow: 0 4px 14px rgba(10, 29, 43, 0.06);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
}

.event-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(10, 29, 43, 0.1);
}

.card-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.match-badge {
  font-family: 'TextFont', sans-serif;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 9999px;
}

.badge-green {
  background-color: var(--color-green);
  color: var(--color-dark-green);
}

.badge-orange {
  background-color: var(--color-orange);
  color: var(--color-white);
}

.btn-less {
  background: none;
  border: none;
  font-size: 11px;
  color: var(--color-dark-grey);
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
}

.poster-container {
  width: 100%;
  aspect-ratio: 210 / 297;
  border-radius: 20px;
  overflow: hidden;
  background-color: var(--color-grey);
  display: flex;
}

.poster-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
}

.poster-placeholder {
  width: 100%;
  height: 100%;
  background-color: var(--color-grey);
}

.event-details {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
}

.event-title {
  font-family: 'HeaderFont', cursive, sans-serif;
  font-size: 15px;
  font-weight: 900;
  color: var(--color-black);
  margin: 0;
  line-height: 1.15;
  text-transform: uppercase;

  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.event-organiser {
  font-family: 'TextFont', sans-serif;
  font-size: 10px;
  font-weight: 600;
  color: var(--color-dark-grey);
  text-transform: uppercase;
  margin: 4px 0 14px 0;
}

.event-time-venue {
  display: flex;
  flex-direction: column;
  line-height: 1;
  gap: 2px;
  letter-spacing: -0.6px;
}

.event-datetime-line,
.event-venue-line {
  margin: 0;
  font-family: 'TextFont', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-black);
}

.actions-area {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.dropdown-btn-wrapper {
  flex: 1;
  position: relative;
  display: flex;
}

.action-pill-btn {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 32px;
  box-sizing: border-box;
}

.btn-dark-green {
  background-color: var(--color-dark-green) !important;
  color: var(--color-white) !important;
}

.btn-green {
  background-color: var(--color-green) !important;
  color: var(--color-dark-green) !important;
}

.btn-purple {
  background-color: var(--color-purple) !important;
  color: var(--color-dark-purple) !important;
}

.custom-icon {
  width: 18px;
  height: 18px;
  display: block;
  margin-left: 1px;
  background-color: currentColor;
  flex-shrink: 0;
}

.icon-heart {
  -webkit-mask: url('@/assets/icons/heart.png') no-repeat center / contain;
  mask: url('@/assets/icons/heart.png') no-repeat center / contain;
}

.icon-trash {
  -webkit-mask: url('@/assets/icons/trash.png') no-repeat center / contain;
  mask: url('@/assets/icons/trash.png') no-repeat center / contain;
}

.heart-btn {
  background-color: var(--color-red) !important;
  color: var(--color-dark-red) !important;
}

.heart-btn.active,
.heart-btn.filled-red {
  background-color: var(--color-red) !important;
  color: var(--color-white) !important;
}

.trash-btn {
  background-color: var(--color-orange) !important;
  color: var(--color-dark-orange) !important;
}

.dropdown-chevron {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: rotate(45deg);
  transition: transform 0.25s ease;
  margin-left: 4px;
  margin-top: -3px;
  opacity: 0.85;
  border-radius: 1px;
  border-bottom-right-radius: 3px;
}

.dropdown-chevron.rotate {
  transform: rotate(-135deg);
  margin-top: 2px;
}

.slots-popup-menu {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 0;
  width: 100%;
  min-width: 210px;
  background-color: var(--color-white);
  border: 1.5px solid var(--color-grey);
  border-radius: 16px;
  padding: 6px;
  box-shadow: 0 10px 25px rgba(10, 29, 43, 0.12);
  z-index: 1000;
}

.popup-header {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-dark-grey);
  margin-bottom: 4px;
  padding: 0 6px;
}

.slot-menu-item {
  padding: 6px 10px;
  border-radius: 10px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.slot-menu-item:hover,
.slot-menu-item.is-active {
  background-color: var(--color-grey);
}

.slot-text-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.slot-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-black);
}

.bestfit-tag {
  font-size: 10px;
  font-weight: 700;
  color: var(--color-dark-green);
}

.overlap-tag {
  font-size: 10px;
  font-weight: 700;
  color: var(--color-dark-orange);
}

.link-action-btn {
  background: none;
  border: none;
  text-align: center;
  font-family: 'TextFont', sans-serif;
  font-size: 11px;
  font-weight: 800;
  text-decoration: underline;
  cursor: pointer;
  padding: 2px 0;
}

.link-action-btn.dark-link {
  color: var(--color-black);
}

</style>