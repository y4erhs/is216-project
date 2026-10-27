<script setup>
    import {ref, computed, onMounted} from 'vue'
    import axios from 'axios'
    import BaseButton from '../components/BaseButton.vue';


    const props = defineProps({
        showAll: { type: Boolean, default: false },
        // the parent decides which chip is highlighted, so it can reset it
        selected: { type: String, default: null }
    })
    const emit = defineEmits(['select', 'interests-loaded'])
    const interests = ref([])
    //RMB TO CHANGE AFT LOGIN AND SIGN UP IS DONE
    const userId = '6acd9e65046b9013f579fc79'
    const ownSelected = ref(props.showAll ? 'all' : 'for-you')
    const selected = computed(() => props.selected ?? ownSelected.value)


    async function loadPreferences () {
        let url = "http://localhost:8000/api/users/" + userId + "/preferences"

        try {
            let response = await axios.get(url, {})

            console.log(response.data)

            interests.value = response.data
            emit('interests-loaded', response.data)
        } catch(error) {
            console.log(error.message)
        }
    }

    onMounted(loadPreferences)


    function selectChip (value) {
        ownSelected.value = value
        emit('select', value)
    }
</script>

<template>
    <div class="d-flex align-items-center flex-wrap gap-2">
    <span class="text-muted me-1">Your interests</span>

    <BaseButton v-if="showAll" v-bind:class="selected == 'all' ? 'btn-custom' : 'btn-outline-main'" v-on:click="selectChip('all')">
    All
    </BaseButton>

    <BaseButton v-bind:class="selected == 'for-you' ? 'btn-custom' : 'btn-outline-main'" v-on:click="selectChip('for-you')">
    For you
    </BaseButton>

    <BaseButton v-for="interest in interests" v-bind:key="interest" v-bind:class="selected == interest ? 'btn-custom' : 'btn-outline-main'" v-on:click="selectChip(interest)">
    {{ interest }}
    </BaseButton>

    <router-link to="/profile" class="small" style="color: white;">+ Edit interests</router-link>
  </div>
</template>