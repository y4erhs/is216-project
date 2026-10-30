<script setup>
import { ref, nextTick, watch } from 'vue'

const props = defineProps({
  tabs: {
    type: Array,
    required: true
  },
  modelValue: {
    type: String,
    default:''
  },
  defaultActive: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['tab-change', 'update:modelValue'])

const activeTab = ref(props.modelValue || props.defaultActive || props.tabs[0]?.id || '')

const showFlap = ref(true)

function triggerFlapAnimation() {
  showFlap.value = true
  setTimeout(() => {
    showFlap.value = false
  }, 350)
}

triggerFlapAnimation()

function selectTab(tabId, emitEvent = true) {
  if (activeTab.value === tabId) return
  
  activeTab.value = tabId

  if (emitEvent) {
    emit('tab-change', tabId)
    emit('update:modelValue', tabId)
  }

  showFlap.value = false
  nextTick(() => {
    triggerFlapAnimation()
  })
}

watch(() => props.modelValue, (newVal) => {
  if (newVal && newVal !== activeTab.value) {
    selectTab(newVal, false)
  }
})
</script>

<template>
  <div class="folder-container">
    <!-- 1. FOLDER TABS -->
    <div class="tabs-header" :class="{ 'overflow-mode': tabs.length > 4 }">
      <button
        v-for="(tab, index) in tabs"
        :key="tab.id"
        type="button"
        :class="['folder-tab', tab.theme, { active: activeTab === tab.id }]"
        :style="{
          zIndex: activeTab === tab.id ? 20 : (10 - index)
        }"
        @click="selectTab(tab.id)"
      >
        <span class="header-style folder-tab-text">{{ tab.label }}</span>
      </button>
    </div>

    <!-- 2. BODY FOLDER -->
    <template v-for="tab in tabs" :key="tab.id">
      <div 
        v-show="activeTab === tab.id"
        :class="['folder-body', tab.theme]"
      >
        <div class="inner-folder">
          <slot :name="tab.id">
            <slot></slot>
          </slot>
        </div>

        <!-- 3. FLAP COVER -->
        <Transition name="flap-fall">
          <div 
            v-if="showFlap && activeTab === tab.id" 
            class="folder-flap-cover"
          >
            <h1 class="header-style flap-title">{{ tab.label }}</h1>
          </div>
        </Transition>
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
  width: 100%;
  position: relative;
  gap: 8px;
}

.folder-tab {
  position: relative;
  display: inline-flex;
  align-items: center;

  border: none;
  outline: none;
  font-family: inherit;
  font: inherit;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;

  background-color: var(--bg, #d1d5db);
  color: var(--text, #1f2937);

  height: 40px;
  padding: 0 18px 0 20px;
  border-top-left-radius: 16px;
  border-top-right-radius: 0;

  flex: 1 1 auto;
  min-width: 90px;
  max-width: 160px;
  margin-right: 0; 

  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
}

.tabs-header.overflow-mode {
  gap: 0px;
}

.tabs-header.overflow-mode .folder-tab {
  flex: 1 1 50px;
  min-width: 45px;
  max-width: 95px;
  margin-right: -16px;
  padding: 0 4px 0 14px;
}

.tabs-header.overflow-mode .folder-tab:not(:first-child):hover {
  flex: 0 1 150px;
  max-width: 150px;
  margin-left: 16px;
  z-index: 50;
}

.tabs-header.overflow-mode .folder-tab:first-child:hover {
  flex: 0 1 150px;
  max-width: 150px;
  margin-left: 0 !important;
  z-index: 50;
}

.folder-tab::after {
  content: '';
  position: absolute;
  left: calc(100% - 1px);
  left: 100%;
  bottom: 0;
  width: 26px;
  height: 100%;
  background-color: inherit;
  clip-path: path('M 0 0 L 2 0 Q 14 0, 18 12 L 26 40 L 0 40 Z');
  pointer-events: none;
}

.folder-tab.active {
  filter: brightness(1);
  z-index: 90 !important;
}

.folder-tab-text {
  font-size: 11.5px;
  letter-spacing: 0.5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  width: 100%;
  text-align: center;
  padding-left: 20px;
}

.folder-body {
  position: relative;
  background-color: var(--bg, #d1d5db);
  border-radius: 30px;
  border-top-left-radius: 0;
  padding: 10px;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  perspective: 1200px;
  overflow: hidden;
}

.inner-folder {
  background-color: var(--bg-dark, #9ca3af);
  border-radius: 25px;
  padding: 18px;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  overflow-x: auto;
  overflow-y: hidden;
  display: flex;
  flex-direction: column;
}

.folder-flap-cover {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 85%; 
  background-color: var(--bg, #d1d5db);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.15);
  z-index: 100;
  transform-origin: bottom center;
  backface-visibility: hidden;
}

.flap-title {
  color: var(--bg-dark, #465922);
  font-size: 46px;
  text-align: center;
  user-select: none;
  letter-spacing: 1px;
  font-family: 'HeaderFont';
}

.flap-fall-leave-active {
  transition: transform 0.65s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.55s ease 0.1s;
}

.flap-fall-leave-to {
  transform: rotateX(-95deg) translateY(40px);
  opacity: 0;
}
</style>