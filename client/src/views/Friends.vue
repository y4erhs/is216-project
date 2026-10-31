<!--
  friends.vue  (Vue 3, <script setup>)  ->  src/views/friends.vue
  Folder with three tabs: Friends / Requests / Add. Same design system as Lobby.vue.
  Needs: FolderTabs.vue, useLobbies.js (friends list), useFriendRequests.js, friendsApi.js
-->
<template>
  <div class="app theme-blue">
    <!-- ───── Heading ───── -->
    <header class="head">
      <h2 class="page-title">Friends</h2>
      <p class="head-sub">Add friends, then invite them to your lobbies.</p>
    </header>

    <!-- ───── Folder ───── -->
    <main class="stage">
      <!-- v-model lets other buttons switch tabs without remounting the folder -->
      <FolderTabs v-model="tab" :tabs="tabs">
        <!-- ===== Friends ===== -->
        <template #friends>
          <div class="pane">
            <section>
              <h3 class="section-title">Your friends</h3>
              <p class="section-sub">{{ friendsLine }}</p>

              <div v-if="!friends.length" class="empty">
                <p>No friends yet. Search for a classmate by username.</p>
                <button class="btn btn-lime btn-small" type="button" @click="tab = 'add'">Find friends</button>
              </div>

              <div v-else class="scroll">
                <ul class="people">
                  <li v-for="f in friends" :key="f.id" class="person" :class="{ asking: removingId === f.id }">
                    <template v-if="removingId === f.id">
                      <span class="who">Remove {{ f.name }}?</span>
                      <button class="badge-pill pill-danger" type="button" @click="removeFriend(f)">Yes, remove</button>
                      <button class="badge-pill pill-grey" type="button" @click="removingId = null">Cancel</button>
                    </template>
                    <template v-else>
                      <span class="avatar" :style="{ background: f.color }">{{ initials(f.name) }}</span>
                      <span class="who">{{ f.name }}</span>
                      <button class="remove-x" type="button" :aria-label="`Remove ${f.name}`" :title="`Remove ${f.name}`"
                              @click="removingId = f.id">✕</button>
                    </template>
                  </li>
                </ul>
              </div>
            </section>
          </div>
        </template>

        <!-- ===== Requests ===== -->
        <template #requests>
          <div class="pane">
            <section>
              <h3 class="section-title">Friend requests</h3>
              <p class="section-sub">{{ requestsLine }}</p>

              <div v-if="!incoming.length" class="empty">
                <p>You're all caught up. New requests show up here.</p>
              </div>

              <div v-else class="scroll">
                <ul class="people">
                  <li v-for="r in incoming" :key="r._id" class="person">
                    <span class="avatar" :style="{ background: colorFor(r.requester._id) }">{{ initials(r.requester.username) }}</span>
                    <span class="who">{{ r.requester.username }}</span>
                    <button class="badge-pill pill-invite" type="button" :disabled="busyId === r._id" @click="accept(r)">Accept</button>
                    <button class="badge-pill pill-grey" type="button" :disabled="busyId === r._id" @click="decline(r)">Decline</button>
                  </li>
                </ul>
              </div>
            </section>
          </div>
        </template>

        <!-- ===== Add ===== -->
        <template #add>
          <div class="pane">
            <section>
              <h3 class="section-title">Add a friend</h3>
              <p class="section-sub">Search by username. They'll get a request to accept.</p>

              <label class="search">
                <span class="sr">Search users</span>
                <input v-model="query" type="search" placeholder="Type at least 2 letters" autocomplete="off" />
              </label>

              <p v-if="error" class="error" role="alert">{{ error }}</p>

              <p v-if="searching" class="section-sub hint-row">Searching…</p>
              <p v-else-if="query.trim().length >= 2 && !results.length" class="section-sub hint-row">
                No one found for "{{ query.trim() }}". Check the spelling.
              </p>

              <div v-if="results.length" class="scroll">
                <ul class="people">
                  <li v-for="u in results" :key="u._id" class="person">
                    <span class="avatar" :style="{ background: colorFor(u._id) }">{{ initials(u.username) }}</span>
                    <span class="who">{{ u.username }}</span>
                    <span v-if="isFriend(u._id)" class="badge-pill pill-accepted">Friends</span>
                    <span v-else-if="sentIds.includes(u._id)" class="badge-pill pill-pending">Sent</span>
                    <button v-else class="badge-pill pill-invite" type="button" :disabled="busyId === u._id" @click="add(u)">Add</button>
                  </li>
                </ul>
              </div>
            </section>
          </div>
        </template>
      </FolderTabs>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import FolderTabs from '../components/FolderTabs.vue'
import { useLobbies, colorFor } from '../composables/useLobbies'
import { useFriendRequests } from '../composables/useFriendRequests'
import { friendsApi } from '../api/friendsApi'
import { useRoute } from 'vue-router'

const route = useRoute()

const lobbies = useLobbies()
const reqs = useFriendRequests()

const friends = computed(() => lobbies.friends)
const incoming = computed(() => reqs.state.incoming)

/* ---------- FolderTabs (the Requests label carries the count) ---------- */
const validTabs = ['friends', 'requests', 'add']
const tab = ref(validTabs.includes(route.query.tab) ? route.query.tab : 'friends')
watch(() => route.query.tab, (t) => {
  if (validTabs.includes(t)) tab.value = t
})

const tabs = computed(() => [
  { id: 'friends', label: 'FRIENDS', theme: 'theme-green' },
  { id: 'requests', label: incoming.value.length ? `REQUESTS (${incoming.value.length})` : 'REQUESTS', theme: 'theme-orange' },
  { id: 'add', label: 'ADD', theme: 'theme-purple' },
])

const initials = (name = '') => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`
const friendsLine = computed(() => (friends.value.length ? plural(friends.value.length, 'friend') + '.' : 'Nobody here yet.'))
const requestsLine = computed(() => (incoming.value.length ? `${plural(incoming.value.length, 'request')} waiting for you.` : 'Nothing waiting.'))
const isFriend = (id) => friends.value.some((f) => f.id === String(id))

/* ---------- friends: remove ---------- */
const removingId = ref(null)
async function removeFriend(f) {
  removingId.value = null
  try {
    await friendsApi.remove(f.friendshipId)
  } catch (e) {
    error.value = e.message
  }
  await lobbies.loadFriends()
}

/* ---------- requests: accept / decline ---------- */
const busyId = ref(null)
async function accept(r) {
  busyId.value = r._id
  try {
    await reqs.accept(r._id)
    await lobbies.loadFriends()   // keeps the lobby's "Invite friends" list in sync
  } catch (e) {
    error.value = e.message
  } finally {
    busyId.value = null
  }
}
async function decline(r) {
  busyId.value = r._id
  try { await reqs.decline(r._id) }
  catch (e) { error.value = e.message }
  finally { busyId.value = null }
}

/* ---------- add: debounced search ---------- */
const query = ref('')
const results = ref([])
const searching = ref(false)
const sentIds = ref([])
const error = ref('')

let timer
watch(query, (q) => {
  clearTimeout(timer)
  error.value = ''
  if (q.trim().length < 2) { results.value = []; searching.value = false; return }
  searching.value = true
  timer = setTimeout(async () => {
    try {
      results.value = await friendsApi.search(q.trim(), lobbies.meId())
    } catch {
      results.value = []
    } finally {
      searching.value = false
    }
  }, 300)
})

async function add(u) {
  error.value = ''
  busyId.value = u._id
  try {
    await reqs.send(u._id)
    sentIds.value.push(u._id)
  } catch (e) {
    error.value = e.message   // e.g. "Request or friendship already exists"
  } finally {
    busyId.value = null
  }
}

/* ---------- load + keep requests fresh ---------- */
let poll
onMounted(() => {
  lobbies.loadFriends()
  reqs.load()
  poll = setInterval(reqs.load, 15000)
})
onBeforeUnmount(() => {
  clearTimeout(timer)
  clearInterval(poll)
})
</script>

<style scoped>
/* Same design-system rules as Lobby.vue: outer boxes 25px, inner boxes 15px, 15px padding, title 25px, text 11px. */
.app {
  --ink: var(--color-black, #1f2a44);
  --grey: var(--color-grey, #cfd8e8);
  --card: var(--color-white, #f0f1f7);
  --blue: #5d6be4;
  --dark-blue: var(--color-dark-blue, #3f48cc);
  --lime: #c9eb6c;
  --orange: #ee8559;
  --purple: #c777f0;
  --danger: #b3261e;

  display: grid;
  grid-template-rows: auto minmax(0, 1fr);   /* the folder gets all the height that's left */
  gap: 15px;
  height: 100vh;
  height: 100dvh;
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
.app button, .app input { font-family: inherit; }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
:focus-visible { outline: 3px solid var(--ink); outline-offset: 2px; }
.head :focus-visible, .stage :focus-visible { outline-color: #fff; }

/* ── Heading ── */
.head { display: grid; gap: 6px; justify-items: start; }
.page-title { margin: 0; color: #fff; font: 400 25px/1.1 'HeaderFont', sans-serif; letter-spacing: 0.02em; text-transform: uppercase; }
.head-sub { margin: 0; color: #fff; line-height: 1.5; }
.stage { min-width: 0; min-height: 0; }

/* ── Buttons ── */
.btn {
  --nudge: 2px;
  padding: calc(12px + var(--nudge)) 26px calc(12px - var(--nudge));
  border: 0; border-radius: 999px; cursor: pointer;
  font: 700 11px/1 'TextFont', sans-serif; letter-spacing: 0.14em; text-transform: uppercase;
  background: var(--dark-blue); color: #fff; transition: transform 0.15s;
}
.btn-small { padding: calc(8px + var(--nudge)) 16px calc(8px - var(--nudge)); }
.btn:hover:not(:disabled) { transform: translateY(-1px); }
.btn-lime { background: var(--lime); color: var(--ink); }

/* ── Pills ── */
.badge-pill {
  display: inline-block; height: 22px; border: 0; border-radius: 9999px; background-color: var(--grey);
  padding: 5px 12px 8px 12px; color: var(--ink);
  font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; white-space: nowrap;
}
button.badge-pill { cursor: pointer; }
button.badge-pill:disabled { opacity: 0.45; cursor: not-allowed; }
.pill-pending { background: var(--orange); color: #fff; }
.pill-accepted, .pill-invite { background: var(--lime); }
.pill-grey { background: var(--grey); }
.pill-danger { background: var(--danger); color: #fff; }

/* ── Folder content ── */
.pane { display: grid; gap: 20px; }
.section-title { margin: 0 0 4px; color: #fff; font: 400 20px/1.1 'HeaderFont', sans-serif; letter-spacing: 0.03em; text-transform: uppercase; }
.section-sub { margin: 0 0 12px; color: #fff; line-height: 1.4; }
.hint-row { margin: 12px 0 0; }
.scroll {
  max-height: clamp(170px, 46vh, 420px); overflow-y: auto; margin: 9px -3px 0; padding: 3px 11px 3px 3px;
  scrollbar-width: thin; scrollbar-color: rgba(255, 255, 255, 0.6) transparent;
}
.empty { display: grid; justify-items: start; gap: 10px; padding: 15px; border-radius: 15px; background: var(--card); color: var(--ink); }
.empty p { margin: 0; line-height: 1.4; }
.error { margin: 10px 0 0; padding: 8px 14px; border-radius: 15px; background: #fff; color: var(--danger); font-weight: 700; }

/* search box, same look as the lobby link box */
.search { display: block; }
.search input {
  width: 100%; height: 35px; padding: 3px 16px 0; border: 1px solid transparent; border-radius: 999px;
  background: var(--card); color: var(--ink); font-size: 11px;
}
.search input::placeholder { color: var(--ink); opacity: 0.6; }
.search input:focus { background: #fff; border-color: var(--dark-blue); outline: none; }

/* people cards */
.people { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.person { display: flex; align-items: center; gap: 10px; min-height: 48px; padding: 8px 12px; border-radius: 15px; background: var(--card); color: var(--ink); }
.person.asking { background: #fff; box-shadow: inset 0 0 0 2px var(--danger); }
.avatar { display: grid; place-items: center; width: 32px; height: 32px; flex: none; border-radius: 50%; font-weight: 700; font-size: 11px; padding-top: 2px; }
.who { flex: 1; min-width: 0; font-size: 13px; letter-spacing: 0.04em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.remove-x {
  display: grid; place-items: center; flex: none; width: 26px; height: 26px; padding: 2px 0 0;
  border: 0; border-radius: 50%; background: rgba(31, 42, 68, 0.1); color: var(--ink);
  font-size: 11px; line-height: 1; cursor: pointer; transition: background 0.15s, color 0.15s;
}
.remove-x:hover, .remove-x:focus-visible { background: var(--danger); color: #fff; }

/* ── Responsive ── */
@media (max-width: 720px) {
  .people { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  .btn, .remove-x { transition: none; }
}
</style>