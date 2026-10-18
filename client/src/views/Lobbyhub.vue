<!--
  LobbyHub.vue  (Vue 3, <script setup>)
  Switches between: My lobbies  ->  Create lobby  ->  a lobby.
  No router needed. If you use vue-router, map these to /lobbies, /lobbies/new and /lobbies/:id
  and replace the `view` ref with route navigation (see the comments in the template).
-->
<template>
  <MyLobbies v-if="view === 'list'"
             @open="open" @create="view = 'create'" @open-calendar="$emit('open-calendar')" />

  <CreateLobby v-else-if="view === 'create'"
               @cancel="view = 'list'" @created="open" />

  <!-- you host this lobby: full host controls -->
  <Lobby v-else-if="current && store.isHost(current)" :key="current.id" :lobby-id="current.id"
              @back="view = 'list'" @deleted="view = 'list'" />

  <!-- you were invited: the accept / decline screen -->
  <div v-else-if="current" class="member-page theme-blue">
    <button class="btn btn-light" type="button" @click="view = 'list'">← My lobbies</button>
    <div class="member-wrap">
      <LobbyInvite :closable="false" :lobby-name="current.name" :description="current.description"
                   :host-name="store.hostName(current)" :event="currentEvent"
                   :members="memberRows" :me-id="ME_ID" :my-status="store.myStatus(current)"
                   :locked="current.registered"
                   @respond="(s) => store.setStatus(current.id, ME_ID, s)" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import MyLobbies from '../views/MyLobbies.vue'
import CreateLobby from '../views/CreateLobby.vue'
import Lobby from '../views/Lobby.vue'
import LobbyInvite from '../views/LobbyInvite.vue'
import { useLobbies, EVENTS, ME_ID } from '../components/useLobbies'

defineEmits(['open-calendar'])

const store = useLobbies()
const view = ref('list') // 'list' | 'create' | 'lobby'
const currentId = ref(null)

const current = computed(() => store.get(currentId.value))
const currentEvent = computed(() => EVENTS.find((e) => e.id === current.value?.pitchedEventId) || null)
const memberRows = computed(() => current.value?.members.map((m) => ({ ...m, host: m.id === current.value.hostId })) ?? [])

function open(id) {
  currentId.value = id
  view.value = 'lobby'
}
// if the open lobby disappears (deleted), fall back to the list
watch(current, (l) => { if (view.value === 'lobby' && !l) view.value = 'list' })
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