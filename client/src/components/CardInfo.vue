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
  props.event.image?.startsWith('/') ? API_URL + props.event.image : props.event.image
)
</script>

<template>
  <div class="event-detail-box">
    <button type="button" class="close-btn" @click="emit('close')">X</button>

    <div class="detail-grid">
      <div class="detail-left">
        <div class="top-info-block">
          <div class="top-section">
            <h2 class="header-style event-title">{{ event.title }}</h2>
            <div class="event-meta">
              <p v-if="event.date">{{ event.date }}</p>
              <p v-if="event.time">{{ event.time }}</p>
              <p v-if="event.venue">{{ event.venue }}</p>
            </div>
          </div>

          <div class="flexible-middle-section">
            <p class="event-desc">{{ event.description }}</p>

            <div class="categories-row">
              <CategoryPill v-for="(cat, index) in event.categories" :key="index" :category="cat" />
            </div>
          </div>
        </div>

        <div class="bottom-notes-section">
          <BaseInput type="textarea" label="My Notes" v-model="noteText" placeholder="Type your notes here..."
            class="notes-input-flex" />
        </div>
      </div>

      <div class="detail-right">
        <div class="poster-container">
          <img 
            v-if="event.image" 
            :src="imageSrc"
            :alt="event.title" 
            class="poster-img" 
          />
          <div v-else class="poster-placeholder"></div>
        </div>
      </div>
    </div>

    <div class="bottom-action-row">
      <div class="left-actions">
        <BaseButton class="action-pill-btn theme-dark-grey" @click="handleSave">
          SAVE NOTE
        </BaseButton>
        <button type="button" class="clear-link" @click="handleClear">clear note</button>
      </div>

      <div class="right-actions">
        <BaseButton class="action-pill-btn btn-blue w-100" @click="handleRegister">
          REGISTRATION LINK
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.event-detail-box {
  background-color: #f1f3f8;
  border-radius: 28px;
  padding: 32px;
  width: 100%;
  position: relative;
  box-sizing: border-box;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.close-btn {
  position: absolute;
  top: 20px;
  left: 24px;
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #475569;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 28px;
  margin-top: 6px;
  align-items: stretch;
}

.detail-left {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
}

.top-info-block {
  display: flex;
  flex-direction: column;
}

.event-title {
  font-family: 'HeaderFont', cursive, sans-serif;
  font-size: 20px;
  font-weight: 900;
  color: #0b1a2d;
  margin: 0 0 10px 0;
  text-transform: uppercase;
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
  margin: 12px 0 0 0;
}

.event-desc {
  font-family: 'TextFont', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
  line-height: 1.4;
  margin: 0 0 14px 0;
}

.categories-row {
  display: flex;
  gap: 8px;
}

.bottom-notes-section {
  display: flex;
  flex-direction: column;
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

.clear-link {
  background: none;
  border: none;
  font-family: 'TextFont', sans-serif;
  font-size: 11.5px;
  font-weight: 800;
  color: #1e293b;
  text-decoration: underline;
  cursor: pointer;
}

.detail-right {
  display: flex;
  flex-direction: column;
}

.poster-container {
  width: 100%;
  aspect-ratio: 1 / 1.4142;
  border-radius: 18px;
  overflow: hidden;
  background-color: var(--color-grey, #e2e8f0);
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
  background-color: var(--color-grey, #e2e8f0);
}

.bottom-action-row {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 28px;
  margin-top: 20px;
  align-items: center;
}

.left-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.right-actions {
  width: 100%;
}

.right-actions .action-pill-btn,
.right-actions button {
  background-color: var(--color-blue) !important;
  color: var(--color-white) !important;
}

@media (max-width: 639.98px) {
  .event-detail-box {
    padding: 20px;
    display: flex;
    flex-direction: column;
  }

  .detail-grid {
    display: contents;
  }

  .detail-right {
    order: 1;
    width: 100%;
    margin-bottom: 12px;
  }

  .bottom-action-row {
    display: contents;
  }

  .right-actions {
    order: 2;
    width: 100%;
    margin-bottom: 16px;
  }

  .detail-left {
    order: 3;
    width: 100%;
  }

  .top-info-block {
    order: 1;
  }

  .bottom-notes-section {
    order: 2;
    margin-top: 16px;
  }

  .left-actions {
    order: 5;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin-top: 16px;
  }
}
</style>