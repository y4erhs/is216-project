<script setup>
import { ref, nextTick, watch } from 'vue'
import { vAutoScrollbar } from '../directives/autoScrollbar'
import Button from '../components/BaseButton.vue'

const props = defineProps({
  tabs: {
    type: Array,
    required: true
  },
  modelValue: {
    type: String,
    default: ''
  },
  defaultActive: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['tab-change', 'update:modelValue'])

const activeTab = ref(
  props.modelValue || props.defaultActive || props.tabs[0]?.id || ''
)

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
      <button v-for="(tab, index) in tabs" :key="tab.id" type="button" :class="[
        'folder-tab',
        tab.theme,
        { active: activeTab === tab.id }
      ]" :style="{
        zIndex: activeTab === tab.id ? 20 : (10 - index)
      }" @click="selectTab(tab.id)">
        <span class="header-style folder-tab-text">
          {{ tab.label }}
        </span>
      </button>
    </div>

    <!-- MOBILE CATEGORY PILLS -->
    <div class="mobile-category-nav">
      <Button v-for="tab in tabs" :key="tab.id" :variant="activeTab === tab.id ? 'primary' : 'outline-main'" :class="[
        'category-pill',
        tab.theme,
        { active: activeTab === tab.id }
      ]" @click="selectTab(tab.id)">
        {{ tab.label }}
      </Button>
    </div>

    <!-- 2. BODY FOLDER -->
    <template v-for="tab in tabs" :key="tab.id">
      <div v-show="activeTab === tab.id" :class="['folder-body', tab.theme]">
        <div class="inner-folder" v-auto-scrollbar>
          <slot :name="tab.id">
            <slot></slot>
          </slot>
        </div>

        <!-- 3. FLAP COVER -->
        <Transition name="flap-fall">
          <div v-if="showFlap && activeTab === tab.id" class="folder-flap-cover">
            <h1 class="header-style flap-title">
              {{ tab.label }}
            </h1>
          </div>
        </Transition>
      </div>
    </template>

  </div>
</template>

<style scoped>
/* =========================================
   MAIN FOLDER CONTAINER
========================================= */

.folder-container {
  display: flex;
  flex-direction: column;

  width: 100%;
  height: 100%;
  flex: 1;

  min-width: 0;
  min-height: 0;

  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  isolation: isolate;
}

/* =========================================
   DESKTOP TAB HEADER
========================================= */

.tabs-header {
  display: flex;
  align-items: flex-end;

  margin-bottom: -1px;
  width: 100%;

  z-index: 1;
  position: relative;
  flex-shrink: 0;
  gap: 0;
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

  height: 35px;
  padding: 0 10px 0 20px;

  border-top-left-radius: 16px;
  border-top-right-radius: 0;

  flex: 1 1 auto;
  min-width: 90px;
  max-width: 155px;

  margin-right: -12px;

  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
}

.tabs-header.overflow-mode {
  gap: 0;
}

.tabs-header.overflow-mode .folder-tab {
  flex: 1 1 50px;
  min-width: 45px;
  max-width: 95px;

  margin-right: -16px;
  padding: 0 4px 0 25px;

  overflow: visible;
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
  left: 98%;
  bottom: 0;

  width: 26px;
  height: 100%;

  background-color: inherit;

  clip-path: path('M 0 0 L 2 0 Q 14 0, 18 12 L 26 40 L 0 40 Z'
    );

  pointer-events: none;
}

.folder-tab.active {
  filter: brightness(1);
  z-index: 90 !important;
}

.folder-tab-text {
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  display: block;
  width: 100%;
  text-align: center;
  position: relative;
  right: 0;
}

/* =========================================
   MOBILE CATEGORY NAV
   Hidden on desktop
========================================= */

.mobile-category-nav {
  display: none;
}

/* =========================================
   FOLDER BODY
========================================= */

.folder-body {
  position: relative;

  background-color: var(--bg, #d1d5db);

  border-radius: 25px;
  border-top-left-radius: 0;

  padding: 10px;

  width: 100%;
  flex: 1;

  height: 0;
  min-height: 0;

  box-sizing: border-box;

  display: flex;
  flex-direction: column;

  perspective: 1200px;
  overflow: hidden;

  z-index: 2;
}

/* =========================================
   INNER FOLDER
========================================= */

.inner-folder {
  background-color: var(--bg-dark, #9ca3af);

  border-radius: 20px;
  padding: 0 15px;

  width: 100%;
  height: 100%;

  flex: 1;
  min-height: 0;
  min-width: 0;

  box-sizing: border-box;

  display: flex;
  flex-direction: column;

  overflow: hidden;
}

/* =========================================
   FLAP COVER ANIMATION
========================================= */

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
  font-family: 'HeaderFont';
}

.flap-fall-leave-active {
  transition:
    transform 0.65s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.55s ease 0.1s;
}

.flap-fall-leave-to {
  transform: rotateX(-95deg) translateY(40px);
  opacity: 0;
}

/* =========================================
   MOBILE: HORIZONTAL CATEGORY PILLS
========================================= */

@media (max-width: 991.98px) {

  /* Main layout becomes vertical */
  .folder-container {
    display: flex;
    flex-direction: column !important;
    align-items: stretch;
    gap: 10px;
    overflow: hidden;
  }

  /* Hide desktop folder tabs */
  .tabs-header {
    display: none !important;
  }

  /* Show horizontal category pills */
  .mobile-category-nav {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    width: 100%;
    flex-shrink: 0;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 4px 2px 8px;
    box-sizing: border-box;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }

  /* Hide scrollbar */
  .mobile-category-nav::-webkit-scrollbar {
    display: none;
  }

  /* Prevent buttons from shrinking */
  .mobile-category-nav :deep(.btn-custom) {
    flex: 0 0 auto;
    white-space: nowrap;
  }

  /* Keep folder body visible */
  .folder-body {
    flex: 1 1 0 !important;
    width: 100%;
    height: 0 !important;
    min-height: 0;
    border-radius: 25px !important;
}

  /* Keep inner folder sizing */
  .inner-folder {
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }

  /* Inactive outline pills */
  .mobile-category-nav :deep(.category-pill:not(.active)) {
    background: transparent !important;
    border: 1.5px solid var(--color-white) !important;
    color: var(--color-white) !important;
    opacity: 0.8;
  }

  /* Active pill */
  .mobile-category-nav :deep(.category-pill.active) {
    background: var(--bg) !important;
    border: 1.5px solid var(--bg) !important;
    color: var(--text) !important;
    opacity: 1;
  }
}
</style>