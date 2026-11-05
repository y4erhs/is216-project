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
  },
  showMobilePills: {
    type: Boolean,
    default: false
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
    <div class="tabs-header" :class="{
      'overflow-mode': tabs.length > 4,
      'hide-on-mobile': showMobilePills
    }">
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
    <div v-if="showMobilePills" class="mobile-category-nav">
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

@media (max-width: 991px) {
  .page-wrapper {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    width: 100%;
    min-height: 80%;
    height: 100dvh;
    box-sizing: border-box;

    padding: 16px;
    overflow-y: auto;
  }

  .main-page-art {
    display: none;
  }

  .rotated-folder {
  transform: none;
  width: 100%;
  max-width: 480px;

  height: 80dvh;
  min-height: 0;
  max-height: 700px;

  margin: auto;
  flex: 0 0 auto;
}

.rotated-folder :deep(.folder-container) {
  height: 100%;
  min-height: 0;
  flex: 1;
}

.rotated-folder :deep(.folder-body) {
  height: 100% !important;
  min-height: 0;
  flex: 1 1 auto !important;
}

  .log-in {
    width: 100%;
    height: auto;
    min-height: 500px;
    padding: 24px 16px;
  }

  form {
    width: 100%;
    transform: none;
  }

  .tabs-header {
    gap: 0;
  }

  .folder-tab {
    flex: 0 1 110px;
    max-width: 120px;
    min-width: 75px;
    margin-right: -10px;
    padding: 0 8px 0 25px;
  }

.mobile-category-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;

  width: 100%;
  box-sizing: border-box;

  margin-bottom: 12px;
  padding: 8px 0 0;

  overflow-x: auto;
  overflow-y: hidden;

  flex: 0 0 auto;
  white-space: nowrap;

  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}


  .mobile-category-nav::-webkit-scrollbar {
    display: none;
  }

.category-pill {
  flex: 0 0 auto;
  white-space: nowrap;
  font-size: 11px;
}

  .category-pill.btn-outline-main {
    border: 1px solid white !important;
    color: var(--color-white);
  }

  .tabs-header.hide-on-mobile {
    display: none !important;
  }

}
</style>