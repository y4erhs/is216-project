<!--
  LobbyInvite.vue  (Vue 3, <script setup>)
  The screen an invited friend sees when they open an invite link or tap an invitation notification.
  Styled like Lobby.vue / MyLobbies.vue (folder frame, white cards, shared pills).
-->
<template>
  <div class="top-bar">
    <div class="top-bar-left">
      <h2 id="invite-title" class="title">{{ via === 'link' ? 'You opened an invite link' : "You're invited" }}</h2>
      <p class="lead">
        <strong>{{ hostName }}</strong>
        {{ via === 'link' ? 'wants you to join their lobby.' : 'invited you to join their lobby.' }}
        <br> Reply so they know whether to count you in.
      </p>
    </div>
    <div class="top-bar-right">
      <div class="choices">
        <div class="choice">
          <BaseButton class="answer theme-green" :class="{ chosen: myStatus === 'accepted' }" type="button"
            :aria-pressed="myStatus === 'accepted'" @click="$emit('respond', 'accepted')">
            {{ myStatus === 'accepted' ? '✓ Accepted' : 'Accept' }}
          </BaseButton>
        </div>
        <div class="choice">
          <BaseButton class="answer theme-orange" :class="{ chosen: myStatus === 'declined' }" type="button"
            :aria-pressed="myStatus === 'declined'" @click="$emit('respond', 'declined')">
            {{ myStatus === 'declined' ? '✕ Declined' : 'Decline' }}
          </BaseButton>
        </div>
      </div>
    </div>
  </div>

  <section class="invite" aria-labelledby="invite-title">
    <button v-if="closable" class="close" type="button" aria-label="Close" @click="$emit('close')">✕</button>

    <!-- Full-width Lobby Header at the top inside the green box -->
    <div v-if="lobbyName" class="lobby-head">
      <strong class="lobby-name">{{ lobbyName }}</strong>
      <span class="lobby-desc" v-if="description">{{ description }}</span>
    </div>

    <!-- Main Two-Column Layout for Who's in & Pitched Event -->
    <div class="invite-grid">
      
      <!-- LEFT COLUMN: Who's in so far -->
      <div class="column">
        <section class="section-box flex-section">
          <h3 class="section-title">Who's in so far</h3>
          <div class="scroll-area">
            <ul class="people">
              <li v-for="m in members" :key="m.id" class="person">
                <span class="avatar" :style="{ background: m.color || '#fdebd0' }">{{ initials(m.name) }}
                  <AvatarPic :path="m.avatar" />
                </span>
                <span class="who">{{ m.name }}</span>
                <span v-if="m.host" class="badge-pill pill-host">Host</span>
                <span v-else-if="m.id === meId" class="badge-pill pill-grey">You</span>
                <span class="badge-pill" :class="`pill-${m.status}`">{{ statusLabel[m.status] }}</span>
              </li>
            </ul>
          </div>
        </section>
      </div>

      <!-- RIGHT COLUMN: Pitched Event -->
      <div class="column">
        <section class="section-box flex-section">
          <h3 class="section-title">Pitched Event</h3>
          <div class="scroll-area">
            <div class="card">
              <template v-if="event">
                <strong class="event-title">{{ event.title }}</strong>
                <span>{{ event.date }} at {{ event.venue }}</span>
                <span>{{ event.limitsText }}</span>
              </template>
              <p v-else class="plain">{{ hostName }} hasn't picked an event yet. You can still reply now!</p>
            </div>
          </div>
        </section>
      </div>

    </div>
  </section>
</template>

<script setup>
import AvatarPic from '../components/AvatarPic.vue'
import BaseButton from '../components/BaseButton.vue'

defineProps({
  lobbyName: { type: String, default: '' },
  description: { type: String, default: '' },
  hostName: { type: String, default: 'Your friend' },
  event: { type: Object, default: null },
  members: { type: Array, default: () => [] },
  via: { type: String, default: 'invitation' },
  myStatus: { type: String, default: 'pending' },
  meId: { type: String, default: '' },
  locked: { type: Boolean, default: false },
  closable: { type: Boolean, default: true },
})
defineEmits(['respond', 'close'])

const statusLabel = { pending: 'Pending', accepted: 'Accepted', declined: 'Declined' }
const initials = (name) => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
</script>

<style scoped>
.invite {
  --ink: var(--color-black, #1f2a44);
  --grey: var(--color-grey, #cfd8e8);
  --card: var(--color-white, #f0f1f7);
  --dark-blue: var(--color-dark-blue, #3f48cc);
  --lime: #c9eb6c;
  --orange: #ee8559;

  position: relative;
  width: 100%;
  height: 100%;
  max-height: 100%;

  padding: 20px;
  border: 9px solid var(--lime);
  border-radius: 25px;
  background: #667033;
  color: var(--ink);
  font-family: 'TextFont', sans-serif;
  font-size: 13px;
  text-align: left;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.invite *,
.invite *::before,
.invite *::after {
  box-sizing: border-box;
}

.invite :focus-visible {
  outline: 3px solid #fff;
  outline-offset: 2px;
}

/* Full-width header inside green box */
.lobby-head {
  display: grid;
  gap: 2px;
  width: 100%;
  padding-right: 30px;
  color: #fff;
  line-height: 1.4;
  flex-shrink: 0;
  margin-bottom: 15px;
}

.lobby-name {
  font: 400 32px 'HeaderFont', sans-serif;
  text-transform: uppercase;
  opacity: 0.9;
}

.lobby-desc {
  font-size: 14px;
  opacity: 0.85;
}

/* Two-column layout grid for the rest of content */
.invite-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  flex: 1;
  min-height: 0;
  align-items: start;
  overflow: hidden;
}

.column {
  display: flex;
  flex-direction: column;
  gap: 15px;
  height: 100%;
  min-height: 0;
}

.section-box {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

.flex-section {
  flex: 1;
}

.close {
  position: absolute;
  top: 15px;
  right: 15px;
  z-index: 10;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  padding: 2px 0 0;
  border: 0;
  border-radius: 50%;
  background: var(--card);
  color: var(--ink);
  cursor: pointer;
  font: inherit;
  line-height: 1;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  margin: 15px;
  margin-top: 0;
}

.top-bar-left {
  flex: 1.5;
  display: flex;            
  flex-direction: column;    
  justify-content: flex-end; 
}

.top-bar-right {
  flex: 1;
  display: flex;             
  flex-direction: column;    
  justify-content: flex-end; 
}

.title {
  margin: 0;
  padding-right: 40px;
  color: #fff;
  font: 400 25px 'HeaderFont', sans-serif;
  text-transform: uppercase;
}

.lead {
  margin-top: 10px;
  margin-bottom: 0;
  color: #fff;
  line-height: 1.4;
  font-size: 13px;
  font-weight: 600;
}

.section-title {
  margin: 0 0 8px;
  color: #fff;
  font: 400 22px 'HeaderFont', sans-serif;
  text-transform: uppercase;
  flex-shrink: 0;
}

/* Independent scroll area for Who's in & Pitched Event */
.scroll-area {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 6px;
}

.card {
  display: grid;
  gap: 4px;
  padding: 14px 16px;
  border-radius: 15px;
  background: var(--card);
  color: var(--ink);
}

.event-title {
  font: 400 16px/1.15 'HeaderFont', sans-serif;
  text-transform: uppercase;
}

.plain {
  margin: 0;
  line-height: 1.4;
}

/* Accept / Decline buttons in top-bar */
.choices {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: auto;
}

.choice {
  display: grid;
  align-content: start;
}

.answer {
  width: 100%;
  padding: 12px 16px;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  font: 700 12px/1 'TextFont', sans-serif;
  text-transform: uppercase;
  transition: transform 0.15s;
  justify-content: center;
  text-align: center;
}

.answer:hover {
  transform: translateY(-1px);
}

.chosen {
  box-shadow: inset 0 0 0 3px var(--ink);
}

/* People roster list */
.people {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
}

.person {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  padding: 8px 12px;
  border-radius: 15px;
  background: var(--card);
  color: var(--ink);
}

.avatar {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  flex: none;
  border-radius: 50%;
  font-weight: 700;
  font-size: 13px;
  position: relative;
}

.who {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Pills */
.badge-pill {
  display: inline-block;
  flex: none;
  height: 22px;
  border-radius: 9999px;
  background-color: var(--grey);
  padding: 5px 12px 8px 12px;
  color: var(--ink);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  white-space: nowrap;
}

.pill-pending {
  background: var(--orange);
  color: #fff;
}

.pill-accepted {
  background: var(--lime);
}

.pill-declined,
.pill-grey {
  background: var(--grey);
}

.pill-host {
  background: var(--dark-blue);
  color: #fff;
}

@media (max-width: 768px) {
  .invite-grid {
    grid-template-columns: 1fr;
    overflow-y: auto;
  }
  .invite {
    overflow-y: auto;
  }
}
</style>