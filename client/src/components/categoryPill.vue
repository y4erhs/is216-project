<script setup>
import { interestLabel, interestTheme } from '../utils/interests'

const props = defineProps({
  category: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'category'
  }
})

const clubThemes = ['theme-purple', 'theme-orange', 'theme-green', 'theme-blue', 'theme-yellow', 'theme-red']

function getThemeClass(name, type) {
  if (!name) return 'theme-grey'
  
  if (type === 'club') {
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    
    let index = Math.abs(hash) % clubThemes.length
    
    return clubThemes[index]
  } else {
    return interestTheme(name.toLowerCase().replace(/\s+/g, '-'))
  }
}
</script>

<template>
  <span class="cat-pill" :class="getThemeClass(category, type)">
    {{ type === 'club' ? category : interestLabel(category) }}
  </span>
</template>

<style scoped>
.cat-pill {
  display: inline-block;
  height: 22px;
  border-radius: 9999px;
  padding: 8px 12px 0px 12px;
  font-size: 11px;
  background-color: var(--bg);
  color: var(--text);
  line-height: 1;
  white-space: nowrap;
}
</style>