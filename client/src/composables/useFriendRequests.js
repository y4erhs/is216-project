import { reactive } from 'vue'
import { friendsApi } from '../api/friendsApi'
import { useAuth } from './useAuth'

const { userId } = useAuth()
const state = reactive({ incoming: [] })

async function load() {
  if (!userId.value) return
  state.incoming = await friendsApi.incoming(userId.value).catch(() => [])
}

export function useFriendRequests() {
  return {
    state,
    load,
    send: (receiverId) => friendsApi.send(userId.value, receiverId),
    async accept(id) { await friendsApi.accept(id); await load() },
    async decline(id) { await friendsApi.remove(id); await load() },
  }
}