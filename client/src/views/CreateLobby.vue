<!--
  CreateLobby.vue  (Vue 3, <script setup>)
  A student creates a lobby and customises its name and description.
  Styled like Lobby.vue / MyLobbies.vue (folder frame, white cards, shared pills).
  Emits: created(lobbyId), cancel
-->
<template>
  <div class="app theme-blue">
    <header class="head">
      <button class="back-link" type="button" @click="$emit('cancel')">
        <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true">
          <path d="M17 6H2M6 1 1 6l5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span>My lobbies</span>
      </button>
      <h2 class="page-title">Create a lobby</h2>
      <p class="sub">A lobby is a space for one group of friends. Name it, then invite people and pitch events.</p>
    </header>

    <div class="layout">
      <!-- folder-style frame, like the tabs in a lobby -->
      <form class="frame" novalidate @submit.prevent="submit">
        <section class="field">
          <div class="field-head">
            <label class="section-title" for="lobby-name">Lobby name</label>
            <span class="badge-pill pill-grey">Required</span>
          </div>
          <input id="lobby-name" ref="nameEl" v-model="name" class="control" maxlength="40" autocomplete="off"
                 placeholder="e.g. Weekend Warriors" :aria-invalid="showError" aria-describedby="name-help" />
          <p id="name-help" class="help">
            <span v-if="showError" class="error" role="alert">Give your lobby a name.</span>
            <span v-else>Pick something your friends will recognise.</span>
            <span class="count">{{ name.length }}/40</span>
          </p>
        </section>

        <section class="field">
          <div class="field-head">
            <label class="section-title" for="lobby-desc">Description</label>
            <span class="badge-pill pill-grey">Optional</span>
          </div>
          <textarea id="lobby-desc" v-model="description" class="control control-area" maxlength="200" rows="4"
                    placeholder="What is this group for? e.g. Friday workshops and hackathons."></textarea>
          <p class="help"><span class="count">{{ description.length }}/200</span></p>
        </section>

        <div class="actions">
          <button class="btn btn-light" type="button" @click="$emit('cancel')">Cancel</button>
          <button class="btn btn-lime" type="submit">Create lobby</button>
        </div>
      </form>

      <!-- live preview: the same card you'll see in My lobbies -->
      <aside class="panel" aria-label="Preview">
        <h3 class="panel-title">Preview</h3>
        <div class="lobby">
          <span class="top">
            <span class="name">{{ name.trim() || 'Your lobby name' }}</span>
            <span class="badge-pill pill-host">Host</span>
          </span>
          <span class="event-line">No event yet.</span>
          <span class="desc">{{ description.trim() || 'No description.' }}</span>
          <span class="foot">
            <span class="stack" aria-hidden="true"><i>{{ myInitials }}</i></span>
            <span class="meta">1 member. You'll invite friends next.</span>
          </span>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
// NOTE: every page must import the SAME useLobbies file, or each page gets its own separate copy of the data.
import { useLobbies, ME_NAME } from '../composables/useLobbies'

const emit = defineEmits(['created', 'cancel'])
const store = useLobbies()

const name = ref('')
const description = ref('')
const tried = ref(false)
const nameEl = ref(null)
const showError = computed(() => tried.value && !name.value.trim())
const myInitials = ME_NAME.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

onMounted(() => nameEl.value?.focus())

function submit() {
  tried.value = true
  if (!name.value.trim()) {
    nameEl.value?.focus()
    return
  }
  const id = store.createLobby({ name: name.value, description: description.value }) // -> POST /lobbies
  emit('created', id)
}
</script>

<style scoped>
/* Design-system rules: outer boxes 25px, inner boxes 15px, 15px padding, title 25px, text 11px. */
.app {
  --ink: var(--color-black, #1f2a44);
  --grey: var(--color-grey, #cfd8e8);
  --card: var(--color-white, #f0f1f7);
  --blue: #5d6be4;
  --dark-blue: var(--color-dark-blue, #3f48cc);
  --lime: #c9eb6c;
  --orange: #ee8559;
  --danger: #b3261e;

  min-height: 100vh;
  max-height: 100vh;
  max-height: 100dvh;
  overflow-y: auto;
  display: grid;
  align-content: start;
  gap: 15px;
  padding: 15px;
  text-align: left;
  background: var(--blue);
  color: var(--ink);
  font-family: 'TextFont', sans-serif;
  font-size: 11px;
  box-sizing: border-box;
  border-radius: 25px;
}
.app *, .app *::before, .app *::after { box-sizing: border-box; }
.app button, .app input, .app textarea { font-family: inherit; }
:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
.panel :focus-visible { outline-color: var(--ink); }

/* ── Heading ── */
.head { display: grid; justify-items: start; gap: 8px; }
.back-link {
  display: inline-flex; align-items: center; gap: 8px; padding: 0; border: 0; background: none; cursor: pointer;
  color: #fff; font: 400 11px/1 'TextFont', sans-serif; letter-spacing: 0.14em; text-transform: uppercase;
}
.back-link span { text-decoration: underline; text-underline-offset: 4px; }
.page-title { margin: 0; color: #fff; font: 400 25px/1.1 'HeaderFont', sans-serif; letter-spacing: 0.02em; text-transform: uppercase; }
.sub { margin: 0; max-width: 70ch; color: #fff; line-height: 1.5; }

/* ── Buttons & pills ── */
.btn {
  --nudge: 2px;   /* pushes the label down so it sits in the middle; tune to your font */
  padding: calc(12px + var(--nudge)) 26px calc(12px - var(--nudge));
  border: 0; border-radius: 999px; cursor: pointer;
  font: 700 11px/1 'TextFont', sans-serif; letter-spacing: 0.14em; text-transform: uppercase;
  background: var(--dark-blue); color: #fff; transition: transform 0.15s;
}
.btn:hover { transform: translateY(-1px); }
.btn-lime { background: var(--lime); color: var(--ink); }
.btn-light { background: transparent; color: #fff; box-shadow: inset 0 0 0 2px #fff; }
.badge-pill {
  display: inline-block; height: 22px; border-radius: 9999px; background-color: var(--grey);
  padding: 5px 12px 8px 12px; color: var(--ink);
  font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; white-space: nowrap;
}
.pill-host { background: var(--dark-blue); color: #fff; }

/* ── Layout ── */
.layout { display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: 15px; align-items: start; }

/* folder-style frame: coloured edge + dark inside, white headings (same as a lobby's Invite tab) */
.frame { display: grid; gap: 20px; padding: 15px; border: 9px solid var(--lime); border-radius: 25px; background: #667033; }
.field { display: grid; gap: 8px; }
.field-head { display: flex; align-items: center; gap: 10px; }
.section-title { margin: 0; color: #fff; font: 400 20px/1.1 'HeaderFont', sans-serif; letter-spacing: 0.03em; text-transform: uppercase; }
.control {
  width: 100%; padding: 3px 16px 0; height: 35px; border: 3px solid transparent; border-radius: 999px;
  background: var(--card); color: var(--ink); font-size: 11px;
}
.control::placeholder { color: var(--ink); opacity: 0.6; }
.control-area { height: auto; padding: 12px 16px; border-radius: 15px; resize: vertical; line-height: 1.5; }
.control[aria-invalid='true'] { border-color: var(--orange); }
.help { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin: 0; color: #fff; }
.error { padding: 4px 10px; border-radius: 999px; background: var(--danger); font-weight: 700; }
.count { margin-left: auto; opacity: 0.8; }
.actions { display: flex; justify-content: flex-end; gap: 10px; }

/* ── Preview panel (matches the registered-events panel in a lobby) ── */
.panel { display: grid; gap: 12px; align-content: start; padding: 15px; border-radius: 25px; background: var(--grey); color: var(--ink); }
.panel-title { margin: 8px 0 3px; text-align: center; font: 400 20px/1.1 'HeaderFont', sans-serif; letter-spacing: 0.03em; text-transform: uppercase; }

/* the card, copied from My lobbies */
.lobby { display: flex; flex-direction: column; align-items: flex-start; gap: 10px; padding: 15px; border-radius: 25px; background: var(--card); }
.top { display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; }
.name { font: 400 20px/1.1 'HeaderFont', sans-serif; letter-spacing: 0.03em; text-transform: uppercase; overflow-wrap: anywhere; }
.event-line { font-size: 13px; letter-spacing: 0.04em; }
.desc {
  display: -webkit-box; -webkit-line-clamp: 3; line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
  line-height: 1.4; opacity: 0.85; margin-bottom: 6px;
}
.foot { display: flex; align-items: center; gap: 10px; width: 100%; margin-top: 4px; padding-top: 12px; border-top: 2px dashed rgba(31, 42, 68, 0.2); }
.stack i { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; background: #9fd3ff; font-style: normal; font-weight: 700; font-size: 11px; }
.meta { letter-spacing: 0.04em; }

@media (max-width: 900px) { .layout { grid-template-columns: minmax(0, 1fr); } }
@media (prefers-reduced-motion: reduce) { .btn { transition: none; } }
</style>