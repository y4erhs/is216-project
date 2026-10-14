<!--
  LobbyInvite.vue  (Vue 3, <script setup>)
  The screen an invited friend sees when they open an invite link or tap an invitation notification.

  Usage (e.g. on route /lobby/:code):
    <LobbyInvite host-name="Alex Chen" :event="event" :members="members"
                 via="link" :my-status="myStatus" :closable="false"
                 @respond="(status) => api.reply(code, status)" />
-->
<template>
  <section class="invite" aria-labelledby="invite-title">
    <button v-if="closable" class="close" type="button" aria-label="Close" @click="$emit('close')">✕</button>

    <div class="inner">
      <h2 id="invite-title" class="title">{{ via === 'link' ? 'You opened an invite link' : "You're invited" }}</h2>
      <p class="lead">
        <strong>{{ hostName }}</strong>
        {{ via === 'link' ? 'wants you to join their lobby.' : 'invited you to join their lobby.' }}
        Reply so they know whether to count you in!
      </p>

      <!-- Event on the table -->
      <div class="card">
        <p class="label">Event being pitched</p>
        <template v-if="event">
          <strong class="event-title">{{ event.title }}</strong>
          <span>{{ event.date }} at {{ event.venue }}</span>
          <span class="meta">Groups of {{ event.minGroup }} to {{ event.maxGroup }}. {{ event.slotsLeft }} slots left.</span>
        </template>
        <p v-else class="plain">{{ hostName }} hasn't picked an event yet, you can still reply now!</p>
      </div>

      <!-- How to reply -->
      <div v-if="!locked" class="card cream">
        <p class="label">Your reply</p>
        <div class="choices">
          <div class="choice">
            <button class="answer answer-accept" :class="{ chosen: myStatus === 'accepted' }" type="button"
                    :aria-pressed="myStatus === 'accepted'" @click="$emit('respond', 'accepted')">
              <span aria-hidden="true">✓</span> Accept
            </button>
            <p>You're in! If {{ hostName }} registers the group, you're signed up automatically.</p>
          </div>
          <div class="choice">
            <button class="answer answer-decline" :class="{ chosen: myStatus === 'declined' }" type="button"
                    :aria-pressed="myStatus === 'declined'" @click="$emit('respond', 'declined')">
              <span aria-hidden="true">✕</span> Decline
            </button>
            <p>You're skipping this one! No bookings will be made for you, but we hope to catch you at the next event.</p>
          </div>
        </div>

        <p class="reply-line" aria-live="polite">
          <template v-if="myStatus === 'pending'">No reply yet! You can change your answer any time before registration.</template>
          <template v-else>
            You replied <strong>{{ statusLabel[myStatus] }}</strong>.
            You can change this until {{ hostName }} registers the group.
          </template>
        </p>
      </div>
      <div v-else class="card cream">
        <p class="plain">{{ hostName }} has already registered the group, so replies are closed.</p>
      </div>

      <!-- Who's in so far -->
      <div class="card">
        <p class="label">Who's in so far</p>
        <ul class="list">
          <li v-for="m in members" :key="m.id" class="row">
            <span class="avatar" :style="{ background: m.color || '#fdebd0' }">{{ initials(m.name) }}</span>
            <span class="name">
              {{ m.name }}
              <small v-if="m.host" class="tag">Host</small>
              <small v-else-if="m.id === meId" class="tag">You</small>
            </span>
            <span class="status" :class="`status-${m.status}`">
              <span aria-hidden="true">{{ statusIcon[m.status] }}</span>{{ statusLabel[m.status] }}
            </span>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  hostName: { type: String, default: 'Your friend' },
  /** { title, date, venue, minGroup, maxGroup, slotsLeft } or null */
  event: { type: Object, default: null },
  /** [{ id, name, status: 'pending' | 'accepted' | 'declined', host?, color? }] */
  members: { type: Array, default: () => [] },
  /** 'invitation' (received in-app) or 'link' (opened a shared link) */
  via: { type: String, default: 'invitation' },
  myStatus: { type: String, default: 'pending' },
  /** id of the person viewing, used to tag their row with "You" */
  meId: { type: String, default: '' },
  /** true once the host has registered the group */
  locked: { type: Boolean, default: false },
  closable: { type: Boolean, default: true },
})
defineEmits(['respond', 'close'])

const statusLabel = { pending: 'Pending', accepted: 'Accepted', declined: 'Declined' }
const statusIcon = { pending: '…', accepted: '✓', declined: '✕' }
const initials = (name) => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
</script>

<style scoped>
.invite {
  --ink: #1f2a44;
  --navy: #3f48cc;
  --clay: #c4623d;
  --orange: #ee8559;
  --tile: #f2b16b;
  --cream: #fdebd0;
  --lime: #c9eb6c;
  --violet: #d98bf5;
  --fd: var(--font-display, 'Lilita One', 'Trebuchet MS', sans-serif);
  --fb: var(--font-body, 'Sniglet', 'Trebuchet MS', system-ui, sans-serif);

  position: relative;
  width: 100%;
  max-width: 640px;
  padding: 9px;
  border-radius: 40px;
  background: var(--orange);
  color: var(--ink);
  font-family: var(--fb);
  box-sizing: border-box;
}
.invite *, .invite *::before, .invite *::after { box-sizing: border-box; }
.invite button { font-family: inherit; }
.invite :focus-visible { outline: 3px solid var(--ink); outline-offset: 2px; }

.inner { display: grid; gap: 18px; padding: 30px 28px 28px; border-radius: 32px; background: var(--clay); }
.close {
  position: absolute; top: 22px; right: 24px; z-index: 1;
  width: 38px; height: 38px; border: 0; border-radius: 50%;
  background: var(--cream); color: var(--ink); cursor: pointer; font-size: 15px;
}
.title { margin: 0; padding-right: 50px; color: #fff; font: 400 36px/1.05 var(--fd); letter-spacing: 0.02em; }
.lead { margin: 0; color: #fff; font-size: 17px; line-height: 1.4; }

.card { display: grid; gap: 4px; padding: 20px 22px; border-radius: 24px; background: var(--tile); }
.card.cream { background: var(--cream); }
.label { margin: 0 0 6px; font-size: 12px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; opacity: 0.75; }
.event-title { font: 400 24px/1.15 var(--fd); letter-spacing: 0.03em; }
.meta { font-size: 14px; }
.plain { margin: 0; }

/* accept / decline */
.choices { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.choice { display: grid; align-content: start; gap: 10px; }
.choice p { margin: 0; font-size: 14px; line-height: 1.4; }
.answer {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  padding: 18px 16px; border: 0; border-radius: 20px; cursor: pointer;
  color: var(--ink); font: 800 16px/1 var(--fb); letter-spacing: 0.12em; text-transform: uppercase;
  transition: transform 0.15s, box-shadow 0.15s;
}
.answer:hover { transform: translateY(-2px); }
.answer-accept { background: var(--lime); }
.answer-decline { background: var(--violet); }
.answer.chosen { box-shadow: inset 0 0 0 4px var(--ink); }
.reply-line { margin: 14px 0 0; padding-top: 14px; border-top: 3px dashed rgba(31, 42, 68, 0.25); font-size: 14px; }

/* roster */
.list { list-style: none; margin: 0; padding: 0; }
.row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-top: 3px dashed rgba(31, 42, 68, 0.25); }
.row:first-child { border-top: 0; }
.avatar { display: grid; place-items: center; width: 38px; height: 38px; flex: none; border-radius: 50%; font-weight: 800; font-size: 13px; }
.name { flex: 1; min-width: 0; font-weight: 800; letter-spacing: 0.04em; }
.tag { margin-left: 8px; padding: 3px 9px; border-radius: 999px; background: var(--cream); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; }
.status { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 999px; font-size: 12px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; }
.status-pending { background: var(--cream); }
.status-accepted { background: var(--lime); }
.status-declined { background: var(--violet); }

@media (max-width: 560px) {
  .choices { grid-template-columns: 1fr; }
  .title { font-size: 28px; }
  .inner { padding: 22px 18px; }
}
@media (prefers-reduced-motion: reduce) {
  .answer { transition: none; }
}
</style>