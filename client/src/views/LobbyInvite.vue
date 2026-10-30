<!--
  LobbyInvite.vue  (Vue 3, <script setup>)
  The screen an invited friend sees when they open an invite link or tap an invitation notification.
  Styled like Lobby.vue / MyLobbies.vue (folder frame, white cards, shared pills).

  Usage (e.g. on route /lobby/:code):
    <LobbyInvite host-name="Alex Chen" :event="event" :members="members"
                 via="link" :my-status="myStatus" :closable="false"
                 @respond="(status) => api.reply(code, status)" />
-->
<template>
  <section class="invite" aria-labelledby="invite-title">
    <button v-if="closable" class="close" type="button" aria-label="Close" @click="$emit('close')">✕</button>

    <div class="inner">
      <div v-if="lobbyName" class="lobby-head">
        <strong class="lobby-name">{{ lobbyName }}</strong>
        <span v-if="description">{{ description }}</span>
      </div>
      <h2 id="invite-title" class="title">{{ via === 'link' ? 'You opened an invite link' : "You're invited" }}</h2>
      <p class="lead">
        <strong>{{ hostName }}</strong>
        {{ via === 'link' ? 'wants you to join their lobby.' : 'invited you to join their lobby.' }}
        Reply so they know whether to count you in.
      </p>

      <!-- Event on the table -->
      <section>
        <h3 class="section-title">Event being pitched</h3>
        <div class="card">
          <template v-if="event">
            <strong class="event-title">{{ event.title }}</strong>
            <span>{{ event.date }} at {{ event.venue }}</span>
            <span>{{ event.limitsText }}</span>
          </template>
          <p v-else class="plain">{{ hostName }} hasn't picked an event yet. You can still reply now!</p>
        </div>
      </section>

      <!-- How to reply -->
      <section>
        <h3 class="section-title">Your reply</h3>
        <div v-if="!locked" class="card">
          <div class="choices">
            <div class="choice">
              <button class="answer answer-accept" :class="{ chosen: myStatus === 'accepted' }" type="button"
                      :aria-pressed="myStatus === 'accepted'" @click="$emit('respond', 'accepted')">
                {{ myStatus === 'accepted' ? '✓ Accepted' : 'Accept' }}
              </button>
              <p>You're in! If {{ hostName }} registers the group, you're signed up automatically.</p>
            </div>
            <div class="choice">
              <button class="answer answer-decline" :class="{ chosen: myStatus === 'declined' }" type="button"
                      :aria-pressed="myStatus === 'declined'" @click="$emit('respond', 'declined')">
                {{ myStatus === 'declined' ? '✕ Declined' : 'Decline' }}
              </button>
              <p>You're skipping this one! No bookings will be made for you, but we hope to catch you at the next event.</p>
            </div>
          </div>

          <p class="reply-line" aria-live="polite">
            <template v-if="myStatus === 'pending'">No reply yet. You can change your answer any time before registration.</template>
            <template v-else>
              You replied <strong>{{ statusLabel[myStatus] }}</strong>.
              You can change this until {{ hostName }} registers the group.
            </template>
          </p>
        </div>
        <div v-else class="card">
          <p class="plain">{{ hostName }} has already registered the group, so replies are closed.</p>
        </div>
      </section>

      <!-- Who's in so far -->
      <section>
        <h3 class="section-title">Who's in so far</h3>
        <div class="scroll">
          <ul class="people">
            <li v-for="m in members" :key="m.id" class="person">
              <span class="avatar" :style="{ background: m.color || '#fdebd0' }">{{ initials(m.name) }}</span>
              <span class="who">{{ m.name }}</span>
              <span v-if="m.host" class="badge-pill pill-host">Host</span>
              <span v-else-if="m.id === meId" class="badge-pill pill-grey">You</span>
              <span class="badge-pill" :class="`pill-${m.status}`">{{ statusLabel[m.status] }}</span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup>
defineProps({
  /** optional: shown at the top so people know which lobby this is */
  lobbyName: { type: String, default: '' },
  description: { type: String, default: '' },
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
const initials = (name) => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
</script>

<style scoped>
/* Design-system rules: outer box 25px radius, inner boxes 15px radius, 15px padding,
   page title 25px, default text 11px. */
.invite {
  --ink: var(--color-black, #1f2a44);
  --grey: var(--color-grey, #cfd8e8);
  --card: var(--color-white, #f0f1f7);
  --dark-blue: var(--color-dark-blue, #3f48cc);
  --lime: #c9eb6c;
  --orange: #ee8559;

  position: relative;
  width: 100%;
  max-width: 560px;
  padding: 15px;
  border: 9px solid var(--lime);   /* folder-style frame, like a lobby's Invite tab */
  border-radius: 25px;
  background: #667033;
  color: var(--ink);
  font-family: 'TextFont', sans-serif;
  font-size: 11px;
  text-align: left;
  box-sizing: border-box;
}
.invite *, .invite *::before, .invite *::after { box-sizing: border-box; }
.invite :focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
.card :focus-visible { outline-color: var(--ink); }

.inner { display: grid; gap: 20px; }
.close {
  position: absolute; top: 12px; right: 12px; z-index: 1;
  display: grid; place-items: center; width: 28px; height: 28px; padding: 2px 0 0;
  border: 0; border-radius: 50%; background: var(--card); color: var(--ink);
  cursor: pointer; font: inherit; line-height: 1;
}
.lobby-head { display: grid; gap: 2px; padding-right: 40px; color: #fff; line-height: 1.5; }
.lobby-name { font: 400 14px/1.2 'HeaderFont', sans-serif; letter-spacing: 0.06em; text-transform: uppercase; opacity: 0.9; }
.title { margin: 0; padding-right: 40px; color: #fff; font: 400 25px/1.1 'HeaderFont', sans-serif; letter-spacing: 0.02em; text-transform: uppercase; }
.lead { margin: -8px 0 0; color: #fff; line-height: 1.5; }
.section-title { margin: 0 0 8px; color: #fff; font: 400 20px/1.1 'HeaderFont', sans-serif; letter-spacing: 0.03em; text-transform: uppercase; }

.card { display: grid; gap: 4px; padding: 15px; border-radius: 15px; background: var(--card); color: var(--ink); }
.event-title { font: 400 16px/1.15 'HeaderFont', sans-serif; letter-spacing: 0.03em; text-transform: uppercase; }
.plain { margin: 0; line-height: 1.4; }

/* accept / decline */
.choices { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 15px; }
.choice { display: grid; align-content: start; gap: 10px; }
.choice p { margin: 0; line-height: 1.4; }
.answer {
  --nudge: 2px;   /* pushes the label down so it sits in the middle; tune to your font */
  display: block; width: 100%;
  padding: calc(14px + var(--nudge)) 16px calc(14px - var(--nudge));
  border: 0; border-radius: 999px; cursor: pointer;
  color: var(--ink); font: 700 11px/1 'TextFont', sans-serif; letter-spacing: 0.14em; text-transform: uppercase;
  transition: transform 0.15s;
}
.answer:hover { transform: translateY(-1px); }
.answer-accept { background: var(--lime); }
.answer-decline { background: var(--orange); }
.chosen { box-shadow: inset 0 0 0 3px var(--ink); }
.reply-line { margin: 12px 0 0; padding-top: 12px; border-top: 2px dashed rgba(31, 42, 68, 0.2); line-height: 1.4; }

/* who's in: same cards as the roster */
.scroll {
  max-height: 220px; overflow-y: auto; margin: -3px; padding: 3px 11px 3px 3px;
  scrollbar-width: thin; scrollbar-color: rgba(255, 255, 255, 0.6) transparent;
}
.people { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.person { display: flex; align-items: center; gap: 10px; min-height: 48px; padding: 8px 12px; border-radius: 15px; background: var(--card); color: var(--ink); }
.avatar { display: grid; place-items: center; width: 32px; height: 32px; flex: none; border-radius: 50%; font-weight: 700; font-size: 11px; }
.who { flex: 1; min-width: 0; font-size: 13px; letter-spacing: 0.04em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* pills (same as the lobby pages) */
.badge-pill {
  display: inline-block; flex: none; height: 22px; border-radius: 9999px; background-color: var(--grey);
  padding: 5px 12px 8px 12px; color: var(--ink);
  font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; white-space: nowrap;
}
.pill-pending { background: var(--orange); color: #fff; }
.pill-accepted { background: var(--lime); }
.pill-declined, .pill-grey { background: var(--grey); }
.pill-host { background: var(--dark-blue); color: #fff; }

@media (max-width: 560px) {
  .choices { grid-template-columns: 1fr; }
  .title { font-size: 22px; }
}
@media (prefers-reduced-motion: reduce) { .answer { transition: none; } }
</style>