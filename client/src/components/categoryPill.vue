<script setup>
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

const categoryThemeMap = {
  'tech': 'theme-blue',
  'arts': 'theme-orange',
  'culture': 'theme-yellow',
  'community-service': 'theme-purple',
  'sports-outdoors': 'theme-red',
  'career': 'theme-purple',
  'overseas': 'theme-orange',
  'networking': 'theme-blue',
  'workshops': 'theme-purple',
  'food': 'theme-red',
  'wellness': 'theme-green',
  'talks': 'theme-yellow'
}

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
    const key = name.toLowerCase().replace(/\s+/g, '-')
    return categoryThemeMap[key] || 'theme-grey'
  }
}
</script>

<template>
  <span class="cat-pill" :class="getThemeClass(category, type)">
    {{ category }}
  </span>
</template>

<style scoped>
.cat-pill {
  display: inline-block;
  height: 22px;
  border-radius: 9999px;
  padding: 7px 12px 0px 12px;
  font-size: 11px;
  background-color: var(--bg);
  color: var(--text);
  line-height: 1;
  white-space: nowrap;
}
</style>