<script setup>

import BaseFolder from '../components/BaseFolder.vue';


</script>

<template>

<!-- Default (Grey theme) -->
<BaseFolder label="ALL EVENTS">
  <div class="d-flex gap-3">
    <!-- cards go here -->
  </div>
</BaseFolder>

<!-- With Custom Category Theme from theme.css -->
<BaseFolder theme="theme-green" label="CULTURAL CLUBS">
  <!-- cards go here -->
</BaseFolder>

<BaseFolder theme="theme-orange" label="WORKSHOPS">
  <!-- cards go here -->
</BaseFolder>

</template>

<style scoped>


</style>