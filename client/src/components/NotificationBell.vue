<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import { useNotifications } from '../composables/useNotifications'

const emit = defineEmits(['open-item'])
const n = useNotifications()

function onDocClick(e) {
  if (!e.target.closest('.notif-wrap')) n.close()
}
function onEsc(e) {
  if (e.key === 'Escape') n.close()
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  window.addEventListener('keydown', onEsc)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  window.removeEventListener('keydown', onEsc)
})

function openItem(item) {
  n.markRead(item)
  n.close()
  emit('open-item', item) // parent can route to lobby / event
}
</script>

<template>
  <div class="notif-wrap">
    <button
      class="pill-badge icon-pill notif-pill"
      type="button"
      aria-label="Notifications"
      :aria-expanded="n.open.value"
      @click.stop="n.toggle()"
    >
      <span class="bell-icon">
        <i class="bi bi-bell-fill text-white"></i>
      </span>
      <span v-if="n.hasUnread.value" class="notif-dot"></span>
    </button>

    <div v-if="n.open.value" class="notif-panel" role="dialog" aria-label="Notifications">
      <div class="notif-head">
        <h3>Notifications</h3>
        <button
          class="link-btn"
          type="button"
          :disabled="!n.hasUnread.value"
          @click="n.markAllRead()"
        >
          Mark all read
        </button>
      </div>

      <p v-if="n.loading.value && !n.items.value.length" class="notif-empty">Loading…</p>
      <p v-else-if="!n.items.value.length" class="notif-empty">You're all caught up.</p>

      <ul v-else class="notif-list">
        <li
          v-for="item in n.items.value"
          :key="item._id"
          class="notif-row"
          :class="{ unread: !item.isRead }"
        >
          <button class="notif-btn" type="button" @click="openItem(item)">
            <span class="type-icon"><i class="bi" :class="n.meta(item.type).icon"></i></span>
            <span class="notif-body">
              <strong>{{ item.title }}</strong>
              <span class="msg">{{ item.message }}</span>
              <small>{{ n.meta(item.type).label }} · {{ n.timeAgo(item.createdAt) }}</small>
            </span>
            <span v-if="!item.isRead" class="unread-pip"></span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.notif-wrap { position: relative; flex-shrink: 0; }

.pill-badge {
  height: 40px;
  background-color: var(--color-dark-blue);
  border-radius: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(10, 29, 43, 0.04);
  border: 0;
}
.icon-pill {
  width: 40px;
  height: 40px;
  position: relative;
  cursor: pointer;
  font-size: 15px;
}
.notif-pill { background-color: #150184; }
.bell-icon { padding-top: 5px; padding-right: 1px; }
.notif-dot {
  position: absolute;
  top: 9px;
  right: 10px;
  width: 7px;
  height: 7px;
  background-color: var(--color-blue, #4c74fa);
  border-radius: 50%;
  border: 1.5px solid #ffffff;
}

.notif-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 40;
  width: min(360px, calc(100vw - 24px));
  max-height: min(70vh, 440px);
  overflow: auto;
  padding: 15px;
  border-radius: 25px;
  background: var(--color-white, #fff);
  color: var(--color-black, #1f2a44);
  box-shadow: 0 12px 40px rgba(10, 29, 43, 0.16);
}

.notif-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}
.notif-head h3 {
  margin: 0;
  font: 400 14px/1.2 'HeaderFont', sans-serif;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.link-btn {
  border: 0;
  background: none;
  color: #4338ca;
  font: 700 11px/1 'TextFont', sans-serif;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
}
.link-btn:disabled { opacity: 0.4; cursor: default; }

.notif-empty {
  margin: 12px 0 4px;
  font-size: 13px;
  opacity: 0.7;
}

.notif-list { list-style: none; margin: 0; padding: 0; }
.notif-row { border-top: 1px dashed rgba(31, 42, 68, 0.18); }
.notif-row:first-child { border-top: 0; }
.notif-row.unread { background: #eef2ff; border-radius: 15px; }

.notif-btn {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  padding: 10px 8px;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
  color: inherit;
}
.type-icon {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  flex: none;
  border-radius: 50%;
  background: #e0e7ff;
  color: #4338ca;
  font-size: 13px;
}
.notif-body { display: grid; gap: 2px; min-width: 0; flex: 1; }
.notif-body strong {
  font-size: 13px;
  font-weight: 700;
}
.msg {
  font-size: 12px;
  line-height: 1.35;
  opacity: 0.85;
}
.notif-body small {
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  opacity: 0.55;
}
.unread-pip {
  width: 8px;
  height: 8px;
  margin-top: 6px;
  flex: none;
  border-radius: 50%;
  background: var(--color-blue, #4c74fa);
}
</style>