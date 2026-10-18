<!--
  CreateLobby.vue  (Vue 3, <script setup>)
  A student creates a lobby and customises its name and description.
  Emits: created(lobbyId), cancel
-->
<template>
  <div class="app theme-blue">
    <div class="heading">
      <div class="heading-main">
        <button class="btn btn-light btn-small" type="button" @click="$emit('cancel')">← My lobbies</button>
        <h2 class="page-title">Create a lobby</h2>
        <p class="sub">A lobby is a space for one group of friends. Name it, then invite people and pitch events.</p>
      </div>
    </div>

    <div class="layout">
      <form class="form" novalidate @submit.prevent="submit">
        <div class="field">
          <label for="lobby-name">Lobby name <span class="req">Required</span></label>
          <input id="lobby-name" ref="nameEl" v-model="name" maxlength="40" autocomplete="off"
                 placeholder="e.g. Weekend Warriors" :aria-invalid="showError" aria-describedby="name-help" />
          <p id="name-help" class="help" :class="{ error: showError }">
            {{ showError ? 'Give your lobby a name.' : 'Pick something your friends will recognise.' }}
            <span class="count">{{ name.length }}/40</span>
          </p>
        </div>

        <div class="field">
          <label for="lobby-desc">Description <span class="opt">Optional</span></label>
          <textarea id="lobby-desc" v-model="description" maxlength="200" rows="4"
                    placeholder="What is this group for? e.g. Friday workshops and hackathons."></textarea>
          <p class="help"><span class="count">{{ description.length }}/200</span></p>
        </div>

        <div class="actions">
          <button class="btn btn-ghost" type="button" @click="$emit('cancel')">Cancel</button>
          <button class="btn btn-navy" type="submit">Create lobby</button>
        </div>
      </form>

      <!-- live preview of the card that will appear in My lobbies -->
      <aside class="preview" aria-label="Preview">
        <h3 class="panel-title">Preview</h3>
        <div class="lobby">
          <span class="top"><span class="name">{{ name.trim() || 'Your lobby name' }}</span><span class="tag">Host</span></span>
          <span class="desc">{{ description.trim() || 'No description.' }}</span>
          <span class="event-chip none">No event yet</span>
          <span class="meta">1 member. You'll invite friends next.</span>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useLobbies } from '../components/useLobbies'

const emit = defineEmits(['created', 'cancel'])
const store = useLobbies()

const name = ref('')
const description = ref('')
const tried = ref(false)
const nameEl = ref(null)
const showError = computed(() => tried.value && !name.value.trim())

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
  --paper: var(--color-grey, #f0f1f7);
  --blue: #567de6;
  --tile: #f2b16b;
  --cream: #fdebd0;
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
  border-radius: 10px;
}
.app *, .app *::before, .app *::after { box-sizing: border-box; }
.app button, .app input, .app textarea { font-family: inherit; }
:focus-visible { outline: 3px solid var(--ink); outline-offset: 2px; }

.btn { border: 0; border-radius: 999px; padding: 10px 20px; cursor: pointer; font: 700 11px/1 'TextFont', sans-serif; letter-spacing: 0.14em; text-transform: uppercase; background: var(--ink); color: #fff; transition: transform 0.15s; }
.btn:hover { transform: translateY(-1px); }
.btn-navy { background: #3f48cc; }
.btn-ghost { background: transparent; color: var(--ink); box-shadow: inset 0 0 0 2px var(--ink); }
.btn-light { background: transparent; color: #fff; box-shadow: inset 0 0 0 2px #fff; }
.btn-light:focus-visible { outline-color: #fff; }
.btn-small { padding: 7px 14px; }

.heading-main { display: grid; justify-items: start; gap: 6px; }
.page-title { margin: 0; color: #fff; font: 400 25px/1.1 'HeaderFont', sans-serif; letter-spacing: 0.02em; text-transform: uppercase; }
.sub { margin: 0; color: #fff; line-height: 1.4; }

.layout { display: grid; grid-template-columns: minmax(0, 1fr) 260px; gap: 15px; align-items: start; }

/* form lives in the folder-style outer box */
.form { display: grid; gap: 15px; padding: 15px; border-radius: 25px; background: var(--paper); }
.field { display: grid; gap: 6px; padding: 15px; border-radius: 15px; background: var(--tile); }
.field label { font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
.req, .opt { margin-left: 6px; padding: 2px 8px; border-radius: 999px; background: var(--cream); font-weight: 400; letter-spacing: 0.04em; text-transform: none; }
.field input, .field textarea { width: 100%; padding: 10px 14px; border: 2px solid transparent; border-radius: 15px; background: var(--cream); color: var(--ink); font-size: 11px; resize: vertical; }
.field input[aria-invalid='true'] { border-color: var(--danger); }
.help { display: flex; justify-content: space-between; gap: 10px; margin: 0; }
.help.error { color: var(--danger); font-weight: 700; }
.count { margin-left: auto; opacity: 0.7; }
.actions { display: flex; justify-content: flex-end; gap: 10px; }

/* preview */
.preview { display: grid; gap: 10px; padding: 15px; border-radius: 25px; background: var(--paper); }
.panel-title { margin: 0; text-align: center; font: 400 14px/1.2 'HeaderFont', sans-serif; letter-spacing: 0.14em; text-transform: uppercase; }
.lobby { display: grid; gap: 8px; padding: 15px; border-radius: 15px; background: var(--tile); }
.lobby > span { display: block; }
.top { display: flex !important; align-items: center; justify-content: space-between; gap: 8px; }
.name { font: 400 16px/1.15 'HeaderFont', sans-serif; letter-spacing: 0.03em; overflow-wrap: anywhere; }
.tag { padding: 2px 8px; border-radius: 999px; background: var(--cream); letter-spacing: 0.08em; text-transform: uppercase; flex: none; }
.desc { display: -webkit-box !important; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.4; }
.event-chip { width: fit-content; padding: 4px 10px; border-radius: 999px; box-shadow: inset 0 0 0 2px rgba(31, 42, 68, 0.3); }
.meta { padding-top: 8px; border-top: 2px dashed rgba(31, 42, 68, 0.25); }

@media (max-width: 900px) { .layout { grid-template-columns: minmax(0, 1fr); } }
@media (prefers-reduced-motion: reduce) { .btn { transition: none; } }
</style>