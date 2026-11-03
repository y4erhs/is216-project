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
    default: 1 
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const isDropdownOpen = ref(false)
const dropdownRef = ref(null)
const isDateFocused = ref(false)

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
        <span class="dropdown-chevron" :class="{ 'rotate': isDropdownOpen }"></span>
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
    :type="type === 'date' && !isDateFocused && !modelValue ? 'text' : type"
    class="base-field"
    :class="{ 'date-placeholder': type === 'date' && !modelValue && !isDateFocused }"
    :placeholder="type === 'date' ? placeholder : placeholder"
    :value="modelValue"
    :disabled="disabled"
    @focus="type === 'date' && (isDateFocused = true)"
    @blur="type === 'date' && (isDateFocused = false)"
    @input="$emit('update:modelValue', $event.target.value)"
  />
  </div>
</template>

<style scoped>
.base-input-group {
  width: 100%;

  /* default & base look for the input field */
  --field-bg: var(--color-grey);
  --field-text: var(--color-black);
  --field-hover: #c5d2e7;
  --field-focus-bg: #ffffff;
  --field-focus-border: #4b74f6;
  --field-focus-ring: rgba(75, 116, 246, 0.15);

  --menu-bg: var(--color-white);
  --menu-border: var(--color-grey);
  --menu-hover: var(--color-grey);
  --menu-text: var(--color-black);
}

.base-input-group[class*="theme-"] {
  --field-bg: var(--bg);
  --field-text: var(--text);
  --field-hover: color-mix(in srgb, var(--bg) 88%, black);
  --field-focus-bg: var(--bg);
  --field-focus-border: var(--text);
  --field-focus-ring: color-mix(in srgb, var(--text) 20%, transparent);
}

.input-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-black);
  margin-left: 4px;
}

.base-field {
  background-color: var(--field-bg);
  border: 1px solid transparent;
  border-radius: 13px;
  min-height: 35px;
  color: var(--field-text);
  padding: 5px 16px;
  padding-top: 8px;
  font-size: 13px;
  width: 100%;
  box-sizing: border-box;
  outline: none;
  transition: all 0.2s ease-in-out;
}

.base-field:hover:not(:disabled):not(.is-disabled) {
  background-color: var(--field-hover);
}

.base-field:focus {
  background-color: var(--field-focus-bg);
  border-color: var(--field-focus-border);
  box-shadow: 0 0 0 3px var(--field-focus-ring);
}

.base-field::placeholder,
.placeholder-text {
  color: var(--field-text);
  opacity: 0.6;
}

.base-textarea {
  padding-top: 10px;
  padding-bottom: 10px;
  resize: vertical;
  max-height: 120px;
}

.date-placeholder {
  color: var(--color-white);
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
  display: inline-block;
  width: 7px;
  height: 7px;
  border-right: 2px solid var(--field-text);
  border-bottom: 2px solid var(--field-text);
  transform: rotate(45deg);          
  transition: transform 0.25s ease;
  margin-right: 2px;
  margin-top: -5px;        
  opacity: 60%;    
  border-radius: 2px;
  border-bottom-right-radius: 3px;     
}

.dropdown-chevron.rotate {
  transform: rotate(-135deg);
  margin-top: 1px;
}

.dropdown-options-menu {
  position: absolute;         
  top: 100%;
  left: 0;
  margin-top: 6px;
  width: 100%;
  background-color: var(--menu-bg);
  border: solid 1.5px var(--menu-border);
  border-radius: 15px;
  padding: 6px;
  z-index: 1000;
  max-height: 200px;
  overflow-y: auto;
  box-shadow: 0 8px 20px rgba(10, 29, 43, 0.18);
}

.dropdown-option-item {
  padding: 5px 12px;
  padding-top: 8px;
  border-radius: 10px;
  color: var(--menu-text);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.dropdown-option-item:hover {
  background-color: var(--menu-hover);
}

.dropdown-option-item.is-active {
  background-color: var(--menu-hover);
  color: var(--menu-text);
}

.is-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>