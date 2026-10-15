<script setup>
import { ref } from 'vue'

const props = defineProps({
  // array of tab objects: [{ id: 'cultural', label: 'CULTURAL CLUBS', theme: 'theme-green' }]
  tabs: {
    type: Array,
    required: true
  },
  // optional default tab id; defaults to the first item if omitted
  defaultActive: {
    type: String,
    default: ''
  }
})

// emit custom event when active tab changes
const emit = defineEmits(['tab-change'])

// reactive active tab state
const activeTab = ref(props.defaultActive || props.tabs[0]?.id || '')

function selectTab(tabId) {
  activeTab.value = tabId
  emit('tab-change', tabId)
}
</script>

<template>
  <div class="folder-container">
    <!-- Tab Ears Bar (Horizontally Arranged & Overlapping) -->
    <div class="tabs-header">
      <button
        v-for="(tab, index) in tabs"
        :key="tab.id"
        type="button"
        :class="['folder-tab', tab.theme, { active: activeTab === tab.id }]"
        :style="{
          zIndex: activeTab === tab.id ? 20 : (10 - index),
          transform: `translateX(${index * -20}px)`
        }"
        @click="selectTab(tab.id)"
      >
        <span class="header-style folder-tab-text">{{ tab.label }}</span>
      </button>
    </div>

    <!-- Active Folder Body Container -->
    <template v-for="tab in tabs" :key="tab.id">
      <div 
        v-show="activeTab === tab.id"
        :class="['folder-body', tab.theme]"
      >
        <!-- Dark Compartment Pocket -->
        <div class="inner-folder">
          <slot :name="tab.id">
            <slot></slot>
          </slot>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.folder-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  position: relative;
}

.tabs-header {
  display: flex;
  align-items: flex-end;
  margin-bottom: -1px; 
}

.folder-tab {
  position: relative;
  align-self: flex-start;
  display: inline-flex;
  align-items: center;

  border: none;
  outline: none;
  font-family: inherit;
  font: inherit;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;

  /* Dynamic contextual colors mapped from theme.css */
  background-color: var(--bg, #d1d5db);
  color: var(--text, #1f2937);

  height: 40px;
  padding: 0 4px 0 30px; 
  border-top-left-radius: 18px;
  border-top-right-radius: 0;

  margin-right: 36px; 
  transition: filter 0.2s ease-in-out, transform 0.2s ease-in-out;
}

.folder-tab:hover {
  filter: brightness(0.92);
}

.folder-tab.active {
  filter: brightness(1);
}

.folder-tab::after {
  content: '';
  position: absolute;
  left: 100%;
  bottom: 0;
  width: 36px;
  height: 100%;
  background-color: inherit;

  clip-path: path('M 0 0 L 2 0 Q 18 0, 24 14 L 36 40 L 0 40 Z');
}

.folder-tab-text {
  font-size: 12px;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.folder-body {
  background-color: var(--bg, #d1d5db);
  border-radius: 25px;
  border-top-left-radius: 0;
  padding: 10px;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  transition: background-color 0.2s ease-in-out;
}

.inner-folder {
  background-color: var(--bg-dark, #9ca3af);
  border-radius: 18px;
  padding: 18px;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  overflow-x: auto;
  overflow-y: hidden;
  display: flex;
  flex-direction: column;
  transition: background-color 0.2s ease-in-out;
}
</style>