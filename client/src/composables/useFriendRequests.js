import { reactive } from 'vue'
import { friendsApi } from '../api/friendsApi'
import { useAuth } from './useAuth'

const { userId } = useAuth()
const state = reactive({ incoming: [], outgoing: [] })

async function load() {
  if (!userId.value) return
  const [incoming, outgoing] = await Promise.all([
    friendsApi.incoming(userId.value).catch(() => []),
    friendsApi.sent(userId.value).catch(() => []),
  ])
  state.incoming = incoming
  state.outgoing = outgoing
}

export function useFriendRequests() {
  return {
    state,
    load,
    async send(receiverId) { await friendsApi.send(userId.value, receiverId); await load() },
    async accept(id) { await friendsApi.accept(id); await load() },
    async decline(id) { await friendsApi.remove(id); await load() },
  }
}