<!--
  LobbyHub.vue  (Vue 3, <script setup>)
  Switches between: My lobbies  ->  Create lobby  ->  a lobby.
  No router needed. If you use vue-router, map these to /lobbies, /lobbies/new and /lobbies/:id
  and replace the `view` ref with route navigation (see the comments in the template).
-->
<template>
  <div class="hub-container">
    <CreateLobby v-if="creating" @cancel="toList" @created="open" />

    <MyLobbies v-else-if="!currentId" @open="open" @create="creating = true" @open-calendar="$emit('open-calendar')" />

    <Lobby v-else-if="current && (store.isHost(current) || store.myStatus(current) === 'accepted')" :key="current.id"
      :lobby-id="current.id" @back="toList" @deleted="toList" />

    <div v-else-if="current" class="member-page">
      <button class="back-link" type="button" @click="toList">
        <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true">
          <path d="M17 6H2M6 1 1 6l5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"
            stroke-linejoin="round" />
        </svg>
        <span>My lobbies</span>
      </button>
      <div class="member-wrap">
        <LobbyInvite :closable="false" :lobby-name="current.name" :description="current.description"
          :host-name="store.hostName(current)" :event="currentEvent" :members="memberRows" :me-id="store.meId()"
          :my-status="store.myStatus(current)" :locked="current.registered"
          @respond="(s) => store.setStatus(current.id, store.meId(), s)" />
      </div>
    </div>

    <!-- you opened /lobby/<id> but you aren't in that lobby -->
    <div v-else-if="needsJoin" class="member-page">
      <button class="back-link" type="button" @click="toList">
        <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true">
          <path d="M17 6H2M6 1 1 6l5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"
            stroke-linejoin="round" />
        </svg>
        <span>My lobbies</span>
      </button>
      <p class="notfound">This lobby doesn't exist, or you haven't been invited to it.</p>
    </div>

    <p v-else class="member-page">Loading…</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MyLobbies from '../views/MyLobbies.vue'
import CreateLobby from '../views/CreateLobby.vue'
import Lobby from '../views/Lobby.vue'
import LobbyInvite from '../views/LobbyInvite.vue'
import { useLobbies } from '../composables/useLobbies'

defineEmits(['open-calendar'])

const route = useRoute()
const router = useRouter()
const store = useLobbies()

const creating = ref(false)
const currentId = computed(() => route.params.lobbyId || null)
const current = computed(() => store.get(currentId.value))
const needsJoin = computed(() => currentId.value && !current.value && store.state.loaded)
const currentEvent = computed(() => store.events.find((e) => e.id === current.value?.pitchedEventId) || null)
const memberRows = computed(() => current.value?.members.map((m) => ({ ...m, host: m.id === current.value.hostId })) ?? [])

function open(id) { creating.value = false; router.push(`/lobby/${id}`) }
function toList() { creating.value = false; router.push('/lobby') }

let timer
onMounted(() => { store.load(); timer = setInterval(store.load, 15000) })
onBeforeUnmount(() => clearInterval(timer))
</script>

<style scoped>
.hub-container {
  width: 100%;
  height: 100vh;
  max-height: 100vh;
  max-height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.hub {
  border-radius: 10px;
  overflow: hidden;
}

.member-page {
  width: 100%;
  height: 100vh;
  max-height: 100vh;
  max-height: 100dvh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--blue);
  box-sizing: border-box;
}

.member-wrap {
  width: 100%;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.member-wrap :deep(.invite) {
  height: 100% !important;
  max-height: 100% !important;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  color: #fff;
  font: 400 11px/1 'TextFont', sans-serif;
  text-transform: uppercase;
  flex-shrink: 0;
  margin: 10px;
}

.back-link span {
  text-decoration: underline;
  text-underline-offset: 4px;
}

.notfound {
  margin: 0;
  color: #fff;
  font-size: 13px;
}
</style>