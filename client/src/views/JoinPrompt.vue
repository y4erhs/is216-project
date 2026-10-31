<!-- screen for the invite link, for someone who isn’t in the lobby yet. -->
<template>
  <div class="member-page theme-blue">
    <button class="btn btn-light" type="button" @click="$emit('back')">← My lobbies</button>
    <div class="join-card">
      <p v-if="error">{{ error }}</p>
      <template v-else-if="lobby">
        <h2>{{ lobby.name }}</h2>
        <p>{{ lobby.description || 'No description.' }}</p>
        <p>{{ accepted }} {{ accepted === 1 ? 'member' : 'members' }} so far</p>
        <button class="btn btn-lime" type="button" @click="join">Join lobby</button>
      </template>
      <p v-else>Loading…</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useLobbies } from '../composables/useLobbies.js'

const props = defineProps({ lobbyId: String })
defineEmits(['back'])
const store = useLobbies()
const lobby = ref(null)
const error = ref('')
const accepted = computed(() => lobby.value?.members.filter((m) => m.status === 'accepted').length ?? 0)

onMounted(async () => {
  try { lobby.value = await store.preview(props.lobbyId) }
  catch { error.value = 'This lobby does not exist.' }
})
async function join() {
  try { await store.joinLobby(props.lobbyId) }
  catch (e) { error.value = e.message }
}
</script>