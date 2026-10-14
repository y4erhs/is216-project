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
    :class="['btn-custom', `btn-${variant}`]"
    @click="$emit('click',$event)"
  >
    <span class="header-style">
      <slot>Click here</slot>
    </span>
  </button>
</template>

<style scoped>
.btn-custom {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 3px 16px 6px 16px;
  font-size: 11px;
  border-radius: 25px;
  border: solid 1px transparent;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  outline: none;

  background-color: var(--bg);
  color: var(--text);
}

/* Outline Variant */
.btn-outline-main {
  background-color: transparent;
  border: 1px solid;
  border-color: #8f9aae;
  color: #8f9aae;
}

.btn-custom:hover:not(:disabled) {
  transform: scale(1.03);
}

.btn-custom:active:not(:disabled) {
    transform: scale(0.97);
}

.btn-custom:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}


</style>