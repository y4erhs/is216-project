<!--
  LobbyHub.vue  (Vue 3, <script setup>)
  Switches between: My lobbies  ->  Create lobby  ->  a lobby.
  No router needed. If you use vue-router, map these to /lobbies, /lobbies/new and /lobbies/:id
  and replace the `view` ref with route navigation (see the comments in the template).
-->
<template>
  <CreateLobby v-if="creating" @cancel="toList" @created="open" />

  <MyLobbies v-else-if="!currentId"
             @open="open" @create="creating = true" @open-calendar="$emit('open-calendar')" />

  <Lobby v-else-if="current && store.isHost(current)" :key="current.id" :lobby-id="current.id"
         @back="toList" @deleted="toList" />

  <div v-else-if="current" class="member-page theme-blue">
    <button class="btn btn-light" type="button" @click="toList">← My lobbies</button>
    <div class="member-wrap">
      <LobbyInvite :closable="false" :lobby-name="current.name" :description="current.description"
                   :host-name="store.hostName(current)" :event="currentEvent"
                   :members="memberRows" :me-id="store.meId()" :my-status="store.myStatus(current)"
                   :locked="current.registered"
                   @respond="(s) => store.setStatus(current.id, store.meId(), s)" />
    </div>
  </div>

  <JoinPrompt v-else-if="needsJoin" :lobby-id="currentId" @back="toList" />

  <p v-else class="member-page theme-blue">Loading…</p>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MyLobbies from '../views/MyLobbies.vue'
import CreateLobby from '../views/CreateLobby.vue'
import Lobby from '../views/Lobby.vue'
import LobbyInvite from '../views/LobbyInvite.vue'
import JoinPrompt from '../views/JoinPrompt.vue'
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
.hub { border-radius: 10px; overflow: hidden; }
.member-page {
  --blue: #567de6;
  min-height: 100vh; max-height: 100dvh; overflow-y: auto;
  display: grid; align-content: start; justify-items: start; gap: 15px;
  padding: 15px; background: var(--blue); box-sizing: border-box;
}
.member-wrap { width: 100%; display: grid; justify-items: center; }
.btn { border: 0; border-radius: 999px; padding: 10px 20px; cursor: pointer; font: 700 11px/1 'TextFont', sans-serif; letter-spacing: 0.14em; text-transform: uppercase; background: transparent; color: #fff; box-shadow: inset 0 0 0 2px #fff; }
</style>