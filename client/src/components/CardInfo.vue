<script setup>
import { ref, watch } from 'vue'
import BaseButton from './BaseButton.vue'

const props = defineProps({
  event: {
    type: Object,
    default: () => ({
      title: 'BIDDING WORKSHOP',
      organiser: 'SMUKI',
      venue: 'SOE SR 3-2',
      description: 'Lorem ipsum dolor sit amet consectetur adipiscing elit accusamus adipiscing dolor deleniti occaecati mollitia assumenda et tempor nihil cum in cum consequat vel.',
      date: 'Friday, 31 July 2026',
      time: '7-9 PM',
      signupDeadline: '30 JULY'
    })
  }
})

</script>

<template>
    <div v-if="isOpen" class="info-container">
        <button class="close-btn" @click="emit('close')">X</button>

        <div class="content-grid">
            <!-- LEFT SIDE -->
             <div class="left-grid">
                <p class="event-title">{{ event.title }}</p>

                <div class="event-info">
                    <p>{{ event.date }}</p>
                    <p>{{ event.time }}</p>
                    <p>{{ event.venue }}</p>
                </div>

                <p class="event-desc">{{ event.description }}</p>

                <div class="categories-row">
                    <span class="categ-pill theme-purple">category</span>
                    <span class="categ-pill theme-orange">category</span>
                    <span class="categ-pill theme-green">category</span>
                </div>

             </div>
        </div>
    </div>

</template>

<style scoped>

</style>
