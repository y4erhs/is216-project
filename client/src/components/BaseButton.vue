<script setup>

import '../assets/theme.css'

defineProps({
  variant: {
    type: String,
    default: 'primary'
  },
  type: {
    type: String,
    default: 'button'
  },
  disabled: {
    type: Boolean,
    default: false
  }
})


defineEmits(['click'])
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="['btn-pill', `btn-${variant}`]"
    @click="$emit('click',$event)"
  >
    <span class="header-style">
      <slot>Click here</slot>
    </span>
  </button>
</template>

<style scoped>
.btn-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 7px 24px 10px 24px;
  font-size: 11px;
  border-radius: 9999px;
  border: solid 1px transparent;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  outline: none;

  background-color: var(--bg);
  color: var(--text);
}

.btn-pill:hover:not(:disabled) {
  transform: scale(1.03);
}

.btn-pill:active:not(:disabled) {
    transform: scale(0.97);
}

.btn-pill:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}


</style>