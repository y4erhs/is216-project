import { api } from '../composables/useLobbies.js'

export const friendsApi = {
  incoming: (uid) => api(`/api/friends/${uid}/requests`),
  search:   (q, uid) => api(`/api/users/search?q=${encodeURIComponent(q)}&userId=${uid}`),
  send:     (requesterId, receiverId) =>
    api('/api/friends/request', { method: 'POST', body: { requesterId, receiverId } }),
  accept:   (id) => api(`/api/friends/${id}/accept`, { method: 'PUT' }),
  remove:   (id) => api(`/api/friends/${id}`, { method: 'DELETE' }),
}