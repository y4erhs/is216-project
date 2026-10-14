<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import '../assets/theme.css'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  type: {
    type: String,
    default: 'text'
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  options: {
    type: Array,
    default: () => [] 
  },
  rows: {
    type: [String, Number],
    default: 3 
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const isDropdownOpen = ref(false)
const dropdownRef = ref(null)

function toggleDropdown() {
  if (!props.disabled) {
    isDropdownOpen.value = !isDropdownOpen.value
  }
}

function selectOption(val) {
  emit('update:modelValue', val)
  isDropdownOpen.value = false
}

function getSelectedLabel() {
  if (!props.modelValue) return ''
  const found = props.options.find(opt => {
    const val = typeof opt === 'object' ? opt.value : opt
    return val === props.modelValue
  })
  if (!found) return props.modelValue
  return typeof found === 'object' ? found.label : found
}

function handleClickOutside(event) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isDropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="base-input-group d-flex flex-column gap-1">
    <!-- Optional label -->
    <label v-if="label" class="input-label">{{ label }}</label>

    <!-- CUSTOM DROPDOWN -->
    <div 
      v-if="type === 'select'" 
      class="custom-dropdown-container" 
      ref="dropdownRef"
    >
      <div 
        class="base-field dropdown-trigger" 
        :class="{ 'is-disabled': disabled }"
        @click="toggleDropdown"
      >
        <span :class="{ 'placeholder-text': !modelValue }">
          {{ getSelectedLabel() || placeholder || 'Select an option...' }}
        </span>
        <span class="dropdown-chevron" :class="{ 'rotate': isDropdownOpen }">▾</span>
      </div>

      <!-- Menu list -->
      <div v-if="isDropdownOpen" class="dropdown-options-menu">
        <div
          v-for="opt in options"
          :key="typeof opt === 'object' ? opt.value : opt"
          class="dropdown-option-item"
          :class="{ 'is-active': modelValue === (typeof opt === 'object' ? opt.value : opt) }"
          @click="selectOption(typeof opt === 'object' ? opt.value : opt)"
        >
          {{ typeof opt === 'object' ? opt.label : opt }}
        </div>
      </div>
    </div>

    <!-- TEXTAREA -->
    <textarea
      v-else-if="type === 'textarea'"
      class="base-field base-textarea"
      :placeholder="placeholder"
      :value="modelValue"
      :rows="rows"
      :disabled="disabled"
      @input="$emit('update:modelValue', $event.target.value)"
    ></textarea>

    <!-- INPUT STANDARD -->
    <input
      v-else
      :type="type"
      class="base-field"
      :placeholder="placeholder"
      :value="modelValue"
      :disabled="disabled"
      @input="$emit('update:modelValue', $event.target.value)"
    />
  </div>
</template>

<style scoped>
.base-input-group {
  width: 100%;
}

.input-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-black);
  margin-left: 4px;
}

.base-field {
  background-color: var(--color-grey);
  border: 1px solid transparent;
  border-radius: 15px;
  min-height: 35px;
  color: var(--color-black);
  padding: 5px 16px;
  padding-top: 8px;
  font-size: 13px;
  width: 100%;
  box-sizing: border-box;
  outline: none;
  transition: all 0.2s ease-in-out;
}

.base-field:hover:not(:disabled):not(.is-disabled) {
  background-color: #c5d2e7;
}

.base-field:focus {
  background-color: #ffffff;
  border-color: #4b74f6;
  box-shadow: 0 0 0 3px rgba(75, 116, 246, 0.15);
}

.base-field::placeholder,
.placeholder-text {
  color: var(--color-black);
  opacity: 0.6;
}

.base-textarea {
  padding-top: 10px;
  padding-bottom: 10px;
  resize: vertical;
}

.custom-dropdown-container {
  position: relative;
  width: 100%;
}

.dropdown-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
}

.dropdown-chevron {
  font-size: 14px;
  transition: transform 0.2s ease;
}

.dropdown-chevron.rotate {
  transform: rotate(180deg);
}

.dropdown-options-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  width: 100%;
  background-color: var(--color-white);
  border: solid 1.5px;
  border-color: var(--color-grey);
  border-radius: 15px;
  padding: 6px;
  z-index: 1000;
  max-height: 200px;
  overflow-y: auto;
}

.dropdown-option-item {
  padding: 5px 12px;
  padding-top: 8px;
  border-radius: 10px;
  color: var(--color-black);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.dropdown-option-item:hover {
  background-color: var(--color-grey);
}

.dropdown-option-item.is-active {
  background-color: #4b74f6;
  color: #ffffff;
  font-weight: 600;
}

.is-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>