<script setup>
import { ref, nextTick } from 'vue'

const props = defineProps({
  tabs: {
    type: Array,
    required: true
  },
  defaultActive: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['tab-change'])

const activeTab = ref(props.defaultActive || props.tabs[0]?.id || '')

const showFlap = ref(true)

function triggerFlapAnimation() {
  showFlap.value = true
  setTimeout(() => {
    showFlap.value = false
  }, 350)
}

triggerFlapAnimation()

function selectTab(tabId) {
  if (activeTab.value === tabId) return
  
  activeTab.value = tabId
  emit('tab-change', tabId)

  showFlap.value = false
  nextTick(() => {
    triggerFlapAnimation()
  })
}
</script>

<template>
  <div class="folder-container">
    <!-- 1. FOLDER TABS -->
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

/* 1. TABS HEADER */
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

  background-color: var(--bg, #d1d5db);
  color: var(--text, #1f2937);

  height: 40px;
  padding: 0 2px 0 26px;
  border-top-left-radius: 18px;
  border-top-right-radius: 0;

  margin-right: 36px;
  transition: filter 0.2s ease-in-out;
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

/* 2. BODY FOLDER & PERSPECTIVE */
.folder-body {
  position: relative;
  background-color: var(--bg, #d1d5db);
  border-radius: 25px;
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
  border-radius: 18px;
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
  z-index: 30;
  
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