
<script setup>
import { computed, ref } from 'vue'
import CategoryPill from '@/components/CategoryPill.vue'

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
                v-for="(cat, index) in event.categories"
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
  overflow: hidden;
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
