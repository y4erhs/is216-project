<!--
  AvatarPic.vue  (Vue 3, <script setup>)
  A user's picture, laid over the initials in an avatar circle (the circle needs position: relative).
  If there's no picture, or it won't load, nothing shows and the initials stay visible.
-->
<template>
  <img v-if="url && !failed" class="avatar-pic" :src="url" alt="" @error="failed = true" />
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { userImageUrl } from '../utils/userDisplay'

const props = defineProps({ path: { type: String, default: '' } })

const url = computed(() => userImageUrl(props.path))
const failed = ref(false)
watch(url, () => { failed.value = false })
</script>

<style scoped>
.avatar-pic { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; border-radius: 50%; background: #fff; }
</style>
