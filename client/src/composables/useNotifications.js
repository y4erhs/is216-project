import { onMounted, onBeforeUnmount } from 'vue'
import { useNotificationStore } from '@/stores/useNotificationStore'

export function useNotifications() {
  const store = useNotificationStore()
  store.load()
  onMounted(() => {
    store.startPolling()
  })

  onBeforeUnmount(() => {
    store.stopPolling()
  })

  return store
}