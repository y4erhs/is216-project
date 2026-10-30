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
    v-if="variant === 'circle'"
    :type="type"
    :disabled="disabled"
    class="btn-custom btn-circle"
    @click="$emit('click', $event)"
  ><slot></slot></button>

  <button
    v-else
    :type="type"
    :disabled="disabled"
    :class="['btn-custom', `btn-${variant}`]"
    @click="$emit('click', $event)"
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
  border: solid 1px transparent;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  outline: none;
  background-color: var(--bg);
  color: var(--text);
  box-sizing: border-box;
  letter-spacing: -0.6px;
}

.btn-custom:not(.btn-circle) {
  gap: 8px;
  padding: 3px 13px 6px 13px;
  font-size: 11px;
  border-radius: 25px;
}

.btn-custom:not(.btn-circle):hover:not(:disabled) {
  transform: scale(1.03);
}

.btn-custom:not(.btn-circle):active:not(:disabled) {
  transform: scale(0.97);
}

.btn-circle {
  width: 32px;
  height: 32px;
  min-width: 32px;
  min-height: 32px;
  border-radius: 50%;
  border: none !important;
  font-size: 0 !important;
  line-height: 0;
  transition: background-color 0.15s ease;
}

.btn-outline-main {
  background-color: transparent;
  border: 1px solid;
  border-color: #8f9aae;
  color: #8f9aae;
}

.btn-small {
  background-color: var(--bg);
  color: var(--text);
  font-size: 11px !important;
  min-height: 0px !important;
  height: 22px;
  width: 22px !important;
  padding: 0 0 2px 0 !important;
}

.btn-custom:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>