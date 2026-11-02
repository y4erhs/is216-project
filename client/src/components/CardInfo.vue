
<script setup>
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'
import CategoryPill from '@/components/categoryPill.vue'
import { useAuth } from '../composables/useAuth'

const props = defineProps({
  event: { type: Object, required: true },
  initialNote: { type: String, default: '' }
})

const emit = defineEmits(['close', 'save-note', 'register'])
const noteText = ref(props.initialNote)

function handleSave() {
  emit('save-note', noteText.value)
}

function handleClear() {
  noteText.value = ''
  emit('save-note', '')
}

function handleRegister() {
  emit('register', props.event.registrationUrl)
}

const API_URL = 'http://localhost:8000'
const { userId } = useAuth()

// Reminder for this event, which appears in the notification bell when it's due
const REMINDER_OPTIONS = [
  { value: 15, label: '15 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 1440, label: '1 day before' }
]
const reminder = ref(null)
const reminderMinutes = ref(15)
const reminderError = ref('')
const savingReminder = ref(false)

const hasUpcomingSession = computed(() =>
  (props.event.sessions || []).some(session => new Date(session.startTime) > new Date())
)
const reminderLabel = computed(() =>
  REMINDER_OPTIONS.find(option => option.value === reminder.value?.offsetMinutes)?.label
    || `${reminder.value?.offsetMinutes} minutes before`
)

async function loadReminder() {
  try {
    const { data } = await axios.get(`${API_URL}/api/notifications/reminders?userId=${userId.value}`)
    reminder.value = data.find(item =>
      item.status === 'pending' && (item.eventId?._id || item.eventId) === props.event._id
    ) || null
  } catch (error) {
    console.log('There was an error: ' + error.message)
  }
}

async function setReminder() {
  savingReminder.value = true
  reminderError.value = ''
  try {
    const { data } = await axios.post(`${API_URL}/api/notifications/reminders?userId=${userId.value}`, {
      eventId: props.event._id,
      offsetMinutes: reminderMinutes.value
    })
    reminder.value = data
  } catch (error) {
    reminderError.value = error.response?.data?.message || 'Could not set the reminder.'
  } finally {
    savingReminder.value = false
  }
}

async function removeReminder() {
  reminderError.value = ''
  try {
    await axios.delete(`${API_URL}/api/notifications/reminders/${reminder.value._id}?userId=${userId.value}`)
    reminder.value = null
  } catch (error) {
    reminderError.value = 'Could not remove the reminder.'
  }
}

onMounted(loadReminder)

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

    <button
      type="button"
      class="close-btn"
      @click="emit('close')"
    >
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
              <CategoryPill
                v-for="(cat, index) in event.tags"
                :key="index"
                :category="cat"
              />
            </div>
          </div>

        </div>

        <!-- NOTES -->
        <div class="bottom-notes-section">
          <BaseInput
            type="textarea"
            label="My Notes"
            v-model="noteText"
            placeholder="Type your notes here..."
            class="notes-input-flex"
          />
        </div>

        <!-- LEFT ACTIONS -->
        <div class="left-actions">
          <BaseButton
            class="action-pill-btn theme-dark-grey"
            @click="handleSave"
          >
            SAVE NOTE
          </BaseButton>

          <button
            type="button"
            class="clear-link"
            @click="handleClear"
          >
            clear note
          </button>
        </div>

        <!-- REMINDER -->
        <template v-if="hasUpcomingSession">
          <div class="bottom-notes-section">
            <BaseInput
              v-if="!reminder"
              type="select"
              label="Remind Me"
              v-model="reminderMinutes"
              :options="REMINDER_OPTIONS"
            />
            <template v-else>
              <p class="reminder-label">Remind Me</p>
              <p class="reminder-text">Reminder set: {{ reminderLabel }}</p>
            </template>
          </div>

          <div class="left-actions">
            <BaseButton
              v-if="!reminder"
              class="action-pill-btn theme-dark-grey"
              :disabled="savingReminder"
              @click="setReminder"
            >
              SET REMINDER
            </BaseButton>

            <button
              v-else
              type="button"
              class="clear-link"
              @click="removeReminder"
            >
              remove reminder
            </button>
          </div>

          <p v-if="reminderError" class="reminder-error" role="alert">{{ reminderError }}</p>
        </template>

      </div>

      <!-- RIGHT SECTION: POSTER + REGISTRATION -->
      <div class="detail-right">

        <div class="poster-actions">

          <div class="poster-container">
            <img
              v-if="event.image"
              :src="imageSrc"
              :alt="event.title"
              class="poster-img"
            />

            <div
              v-else
              class="poster-placeholder"
            ></div>
          </div>

          <BaseButton
            class="action-pill-btn btn-blue registration-btn"
            @click="handleRegister"
          >
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
  min-height: 0;
  min-width: 0;
}
/* LEFT CONTENT */
.detail-left {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
  margin: 10px;

  min-height: 0;
  min-width: 0;
  overflow-x: hidden;
  overflow-y: auto;   /* short screens: the reminder dropdown still fits */
}

.top-info-block {
  display: flex;
  flex-direction: column;
  gap: 12px;

  flex: 1;
  min-height: 0;
  overflow-y: auto;
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

/* NOTES */
.bottom-notes-section {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  margin-top: 0;
}

.notes-input-flex {
  display: flex;
  flex-direction: column;
}

.notes-input-flex :deep(textarea) {
  flex: unset !important;
  height: auto !important;
  min-height: 40px !important;
  max-height: 105px !important;
  resize: none !important;
}

/* LEFT ACTIONS */
.left-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 8px;
  flex-shrink: 0;
  margin-top: 0;
}

.reminder-label {
  margin: 0 0 4px;
  color: #1e293b;
  font-size: 11px;
}

.reminder-text {
  margin: 0;
  color: #1e293b;
  font-size: 12px;
}

.reminder-error {
  width: 100%;
  margin: 0;
  color: var(--color-dark-red);
  font-size: 11px;
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

/* RIGHT CONTENT */
.detail-right {
  display: flex;
  align-items: flex-start; 
  justify-content: center;
  padding-top: 10px; 
  padding-right: 10px;
  padding-bottom: 10px;
  padding-left: 0;
  box-sizing: border-box;

  height: 100%;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}

/* POSTER + REGISTRATION BUTTON */
/* MAIN CONTENT GRID */
.detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  align-items: start; 

  flex: 1;
  min-height: 0;
  min-width: 0;
}

/* RIGHT CONTENT */
.detail-right {
  display: flex;
  align-items: flex-start; 
  justify-content: center;
  padding-top: 10px; 
  padding-right: 10px;
  padding-bottom: 10px;
  padding-left: 0;
  box-sizing: border-box;

  height: 100%;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}

/* POSTER + REGISTRATION BUTTON */
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

/* A4 POSTER */
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

/* REGISTRATION BUTTON */
.registration-btn {
  width: 100%;
  flex-shrink: 0;
}

.poster-actions :deep(.btn-custom) {
  width: 100%;
  box-sizing: border-box;
}

/* BUTTON COLOR */
.registration-btn :deep(.btn-custom),
.registration-btn {
  background-color: var(--color-blue) !important;
  color: var(--color-white) !important;
}

/* MOBILE */
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

  .top-info-block {
    overflow: visible;
  }

  .bottom-notes-section {
    flex-shrink: 0;
  }

  .left-actions {
    width: 100%;
  }
}
</style>
