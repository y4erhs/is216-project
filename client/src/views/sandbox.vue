<script setup>
import { ref } from 'vue'

import CategoryPill from '@/components/CategoryPill.vue'

// PLACEHOLDER
const props = defineProps({
  event: {
    type: Object,
    required: true,
    default: () => ({
      title: 'BIDDING WORKSHOP',
      organiser: 'SMU KI',
      venue: 'SOE SR 3-2',
      description: 'Lorem ipsum dolor sit amet consectetur adipiscing elit accusamus adipiscing dolor deleniti occaecati mollitia assumenda et tempor nihil cum in cum consequat vel.',
      date: 'Friday, 31 July 2026',
      time: '7-9 PM',
      signupDeadline: '30 JULY',
      categories: ['Tech', 'Career', 'Arts'],
      registrationUrl: '#'
    })
  },
  initialNote: {
    type: String,
    default: ''
  }
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
</script>

<template>
  <div class="event-detail-box">
    <!-- CLOSE BUTTON -->
    <button type="button" class="close-btn" @click="emit('close')">X</button>

    <div class="detail-grid">

      <!-- LEFT SIDE -->
      <div class="detail-left">
        <!-- TOP INFO -->
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

        <!-- NOTES SECTION -->
        <div class="bottom-notes-section">
          <BaseInput type="textarea" label="My Notes" v-model="noteText" placeholder="Type your notes here..."
            class="notes-input-flex" />
        </div>
      </div>

      <!-- RIGHT SIDE: POSTER -->
      <div class="detail-right">
        <div class="poster-card">
          <div class="poster-placeholder-art">
            <span class="poster-tag">
              SIGN UP BY:<br>{{ event.signupDeadline }}
            </span>
          </div>
        </div>
      </div>

    </div>

    <!-- BOTTOM ACTION ROW -->
    <div class="bottom-action-row">
      <div class="left-actions">
        <BaseButton class="action-pill-btn theme-dark-grey" @click="handleSave">
          SAVE
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
/* CONTAINER */
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

/* GRID LAYOUT */
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

/* CONTENT */
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


/* NOTES */
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

/* RIGHT SIDE (POSTER) */
.detail-right {
  display: flex;
  flex-direction: column;
}

.poster-card {
  width: 100%;
  aspect-ratio: 1 / 1.4142;
  border-radius: 18px;
  overflow: hidden;
  background: linear-gradient(135deg, #0b1a2d 0%, #10b981 100%);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 16px;
  box-sizing: border-box;
}

.poster-tag {
  font-family: 'TextFont', sans-serif;
  font-size: 11px;
  font-weight: 800;
  color: #ffffff;
  line-height: 1.2;
  text-transform: uppercase;
}

/* ACTIONS */
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

/* RESPONSIVE BREAKPOINT */
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