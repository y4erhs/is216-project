<script setup>
import { ref } from 'vue'
import '../assets/theme.css'

import BaseButton from '../components/BaseButton.vue';

</script>

<template>
  <div class="profile-container">
    <h1>User Profile</h1>
  </div>

  <BaseButton class="theme-green"/>

</template>

<style scoped>

h1 {
  color: var(--color-black);
}

</style>
