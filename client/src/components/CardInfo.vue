<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import axios from 'axios'
import CategoryPill from '@/components/categoryPill.vue'
import { useAuth } from '../composables/useAuth'
import { REMINDER_OPTIONS } from '../utils/reminders'
import { API_URL } from '../utils/api'

const props = defineProps({
  event: { type: Object, required: true },
  initialNote: { type: String, default: '' },
  isAttending: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'save-note', 'register'])
const noteText = ref(props.initialNote)
const isSaved = ref(false)

function handleSave() {
  emit('save-note', noteText.value)
  isSaved.value = true
  setTimeout(() => {
    isSaved.value = false
  }, 2000)
}

function handleClear() {
  noteText.value = ''
  emit('save-note', '')
}

function handleRegister() {
  emit('register', props.event.registrationUrl)
}

const { userId } = useAuth()

// Reminder state
const reminder = ref(null)
const selectedReminderValue = ref('none') // Default 'none'
const reminderError = ref('')
const savingReminder = ref(false)

const hasUpcomingSession = computed(() =>
  (props.event.sessions || []).some(session => new Date(session.startTime) > new Date())
)

const showReminderSection = computed(() => props.isAttending && hasUpcomingSession.value)

const extendedReminderOptions = computed(() => [
  { label: 'None', value: 'none' },
  ...REMINDER_OPTIONS
])

async function loadReminder() {
  try {
    const { data } = await axios.get(`${API_URL}/api/notifications/reminders?userId=${userId.value}`)
    reminder.value = data.find(item =>
      item.status === 'pending' && (item.eventId?._id || item.eventId) === props.event._id
    ) || null

    if (reminder.value) {
      selectedReminderValue.value = reminder.value.offsetMinutes
    } else {
      selectedReminderValue.value = 'none'
    }
  } catch (error) {
    console.log('There was an error: ' + error.message)
  }
}

async function handleReminderChange(newValue) {
  reminderError.value = ''

  if (newValue === 'none') {
    if (reminder.value) {
      try {
        await axios.delete(`${API_URL}/api/notifications/reminders/${reminder.value._id}?userId=${userId.value}`)
        reminder.value = null
      } catch (error) {
        reminderError.value = 'Could not remove the reminder.'
      }
    }
    return
  }

  savingReminder.value = true
  try {
    if (reminder.value) {
      await axios.delete(`${API_URL}/api/notifications/reminders/${reminder.value._id}?userId=${userId.value}`).catch(() => { })
    }

    const { data } = await axios.post(`${API_URL}/api/notifications/reminders?userId=${userId.value}`, {
      eventId: props.event._id,
      offsetMinutes: newValue
    })
    reminder.value = data
  } catch (error) {
    reminderError.value = error.response?.data?.message || 'Could not set the reminder.'
  } finally {
    savingReminder.value = false
  }
}

onMounted(() => {
  loadReminder()
})

const imageFailed = ref(false)

const imageSrc = computed(() =>
  props.event.image?.startsWith('/')
    ? API_URL + props.event.image
    : props.event.image
)

const firstSession = computed(() => props.event.sessions?.[0] ?? null)

function validDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const displayDate = computed(() => {
  if (props.event.date) return props.event.date
  const start = validDate(firstSession.value?.startTime)
  if (!start) return ''
  return new Intl.DateTimeFormat('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(start)
})

const displayTime = computed(() => {
  if (props.event.time) return props.event.time
  const start = validDate(firstSession.value?.startTime)
  if (!start) return ''
  const end = validDate(firstSession.value?.endTime)
  const formatTime = (date) =>
    new Intl.DateTimeFormat('en-SG', {
      hour: 'numeric',
      minute: '2-digit'
    }).format(date)
  return end
    ? `${formatTime(start)} – ${formatTime(end)}`
    : formatTime(start)
})
</script>

<template>
  <div class="event-detail-box">

    <button type="button" class="close-btn" @click="emit('close')">
      X
    </button>

    <div class="detail-grid">

      <!-- LEFT SECTION -->
      <div class="detail-left">

        <div class="top-info-block">

          <div class="top-section">
            <h2 class="header-style event-title">
              {{ event.title }}
            </h2>

            <div class="event-meta">
              <p v-if="displayDate">{{ displayDate }}</p>
              <p v-if="displayTime">{{ displayTime }}</p>
              <p v-if="event.venue">{{ event.venue }}</p>
            </div>
          </div>

          <div class="flexible-middle-section">
            <p class="event-desc">
              {{ event.description }}
            </p>

            <div class="categories-row">
              <CategoryPill v-for="(cat, index) in event.tags" :key="index" :category="cat" />
            </div>
          </div>

        </div>

        <!-- 2-COLUMN LAYOUT FOR NOTES & REMINDER -->
        <div class="dual-columns-section" :class="{ 'single-column': !showReminderSection }">
          <!-- COLUMN 1: MY NOTES -->
          <div class="column-box">
            <BaseInput type="textarea" label="My Notes" v-model="noteText" placeholder="Type your notes here..."
              class="notes-input-flex" />
            
            <button 
              v-if="noteText" 
              type="button" 
              class="internal-clear-btn" 
              @click="handleClear"
              title="Clear note"
            >
              ✕
            </button>
          </div>

          <!-- COLUMN 2: REMINDER -->
          <div class="column-box" v-if="showReminderSection">
            <BaseInput type="select" label="Reminder" v-model="selectedReminderValue" :options="extendedReminderOptions"
              @update:modelValue="handleReminderChange" />
            <p v-if="reminderError" class="reminder-error" role="alert">{{ reminderError }}</p>
          </div>
        </div>

        <!-- BOTTOM ACTIONS FOR NOTES -->
        <div class="left-actions">
          <BaseButton class="action-pill-btn theme-dark-grey" @click="handleSave">
            SAVE
          </BaseButton>
          <transition name="fade">
            <span v-if="isSaved" class="saved-notification">
              note saved.
            </span>
          </transition>
        </div>

      </div>

      <!-- RIGHT SECTION: POSTER + REGISTRATION -->
      <div class="detail-right">

        <div class="poster-actions">

          <div class="poster-container">
            <img v-if="event.image && !imageFailed" :src="imageSrc" :alt="event.title" class="poster-img"
              @error="imageFailed = true" />

            <div v-else class="poster-placeholder"></div>
          </div>

          <BaseButton class="action-pill-btn btn-blue registration-btn" @click="handleRegister">
            REGISTRATION LINK
          </BaseButton>

        </div>

      </div>

    </div>

  </div>
</template>

<style scoped>
/* MAIN CARD */
.event-detail-box {
  background-color: #f1f3f8;
  border-radius: 15px;
  padding: 20px;
  width: 100%;
  height: 100%;
  min-height: 0;
  min-width: 0;
  position: relative;
  box-sizing: border-box;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);

  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin: 15px 0;
}

/* CLOSE BUTTON */
.close-btn {
  position: absolute;
  top: 10px;
  left: 9px;
  z-index: 2;

  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #475569;
}

/* MAIN CONTENT GRID */
.detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  align-items: start;

  flex: 1;
  height: 100%;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}

/* LEFT CONTENT */
.detail-left {
  display: flex;
  flex-direction: column;
  justify-content: flex-start; 
  gap: 8px;                   
  margin: 10px;
  padding-right: 4px;          

  height: 100%;                
  min-height: 0;
  min-width: 0;
  overflow-x: hidden;
  overflow-y: auto !important;
}

.top-info-block {
  display: flex;
  flex-direction: column;
  gap: 12px;

  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-bottom: 10px;
}

.event-title {
  font-family: 'HeaderFont', cursive, sans-serif;
  font-size: 25px;
  font-weight: 900;
  color: #0b1a2d;
  text-transform: uppercase;
  overflow-wrap: anywhere;
}

.event-meta p {
  font-family: 'TextFont', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.4;
  margin: 0 0 3px 0;
}

.flexible-middle-section {
  margin-top: 4px;
}

.event-desc {
  font-family: 'TextFont', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
  line-height: 1.4;
  margin: 0 0 14px 0;
  overflow-wrap: anywhere;
}

.categories-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* 2 COLUMNS SECTION (NOTES & REMINDER) */
.dual-columns-section {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 15px;
  width: 100%;
  flex-shrink: 0;
  align-items: stretch;
}

.dual-columns-section.single-column {
  grid-template-columns: 1fr !important;
}

.column-box {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.internal-clear-btn {
  position: absolute;
  top: 30px;
  right: 12px;
  background: rgba(0, 0, 0, 0.08);
  border: none;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 10px;
  font-weight: 700;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 5;
  padding: 4px 0 0 0;
  margin-top: 4px;
}

.internal-clear-btn:hover {
  background: rgba(0, 0, 0, 0.18);
  color: #0b1a2d;
}

.column-box :deep(.dropdown-options-menu),
.column-box :deep(.base-select-dropdown) {
  position: absolute !important;
  bottom: 100% !important;
  top: auto !important;
  margin-bottom: 6px !important;
  margin-top: 0 !important;
  z-index: 99 !important;
}

.notes-input-flex,
.column-box :deep(.base-input-container),
.column-box :deep(select),
.column-box :deep(.dropdown-trigger) {
  height: 100% !important;
  min-height: 42px !important;
  box-sizing: border-box;
}

.notes-input-flex :deep(textarea) {
  flex: 1 !important;
  height: 100% !important;
  min-height: 42px !important;
  max-height: 80px !important;
  resize: none !important;
  box-sizing: border-box;
}

.reminder-error {
  width: 100%;
  margin: 4px 0 0 0;
  color: var(--color-dark-red);
  font-size: 11px;
}

/* LEFT ACTIONS (SAVE & CLEAR) */
.left-actions {
  display: flex;
  align-items: center;
  gap: 15px;
  width: 100%;
  flex-shrink: 0;
  margin-bottom: 20px;
}

.clear-link {
  background: none;
  border: none;
  font-family: 'TextFont', sans-serif;
  font-size: 11.5px;
  font-weight: 800;
  color: #1e293b;
  text-decoration: underline;
  cursor: pointer;
  white-space: nowrap;
}

.saved-notification {
  font-family: 'TextFont', sans-serif;
  font-size: 11.5px;
  font-weight: 800;
  color: var(--color-dark-green);
  letter-spacing: 0.02em;
  white-space: nowrap;
  text-align: end;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* RIGHT CONTENT */
.detail-right {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 10px 10px 10px 0;
  box-sizing: border-box;

  height: 100%;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}

.poster-actions {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;

  height: 100%;
  max-height: 100%;
  width: fit-content;
  max-width: 100%;
  min-height: 0;
  justify-content: flex-start;
}

.poster-container {
  height: calc(100% - 43px);
  width: auto;
  aspect-ratio: 210 / 297;

  max-width: 100%;
  min-height: 0;

  overflow: hidden;
  border-radius: 15px;
  flex-shrink: 1;
}

.poster-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.poster-placeholder {
  width: 100%;
  height: 100%;
  background-color: var(--color-grey, #e2e8f0);
}

.registration-btn {
  width: 100%;
  flex-shrink: 0;
}

.poster-actions :deep(.btn-custom) {
  width: 100%;
  box-sizing: border-box;
}

.registration-btn :deep(.btn-custom),
.registration-btn {
  background-color: var(--color-blue) !important;
  color: var(--color-white) !important;
}

/* MOBILE RESPONSIVE */
@media (max-width: 639.98px) {
  .event-detail-box {
    height: 100%;
    overflow-y: auto;
    padding: 24px 16px 16px;
  }

  .detail-grid {
    display: flex;
    flex-direction: column;
    flex: none;
    gap: 16px;

    flex: 1;
    height: 100%;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
  }

  .detail-right {
    order: 1;
    width: 100%;
    overflow: visible;
  }

  .poster-actions {
    width: min(100%, 280px);
    height: auto;
    align-items: stretch;
  }

  .poster-container {
    width: 100%;
    height: auto;
    aspect-ratio: 210 / 297;
    flex-shrink: 0;
  }

  .detail-left {
    order: 2;
    width: 100%;
    overflow: visible;
  }

  .dual-columns-section {
    grid-template-columns: 1fr;
  }
}
</style>