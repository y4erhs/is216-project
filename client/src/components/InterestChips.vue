<script setup>
    import {ref, computed, onMounted} from 'vue'
    import axios from 'axios'

    // for GET requests (to get all entries/specific entry)
    const interests = ref([]) 
    //RMB TO CHANGE AFT LOGIN AND SIGN UP IS DONE
    const userId = '6acd9e65046b9013f579fc79'
    const selected = ref('for-you')
    const allInterests = ref([])
    const hidden = ref(false)
    const selectedInterests = ref([])


    async function loadPreferences () {
        let url = "http://localhost:8000/api/users/" + userId + "/preferences"

        try {
            let response = await axios.get(url, {})

            console.log(response.data)

            interests.value = response.data
        } catch(error) {
            console.log(error.message)
        }
    }

    onMounted(loadPreferences)

    async function loadAllInterests (){
        hidden.value = true
        let url = "http://localhost:8000/api/events/"

        try {
            let response = await axios.get(url, {})

            console.log(response.data)

            for (let element of response.data) {
                for (let t of element.tags) {
                    if (allInterests.value.includes(t) == false) {
                        allInterests.value.push(t)
                    }
                }
            }

            console.log(allInterests.value)

        } catch(error) {
            console.log(error.message)
        }
    }

    async function saveInterests () {
        try {
            let url = "http://localhost:8000/api/users/" + userId

            const response = await axios.put(url, {
                preferences:selectedInterests.value
            })
            console.log(response.data)
        } catch (error) {
            console.log('There was an error: ' + error.message)
        }

        loadPreferences()
        hidden.value = false
    }
</script>

<template>
    <div class="d-flex align-items-center flex-wrap gap-2">
    <span class="text-muted me-1">Your interests</span>

    <button class="btn btn-sm rounded-pill" v-bind:class="selected == 'for-you' ? 'btn-primary' : 'btn-outline-secondary'" v-on:click="selected = 'for-you'">
      For you
    </button>

    <button v-for="interest in interests" v-bind:key="interest" class="btn btn-sm rounded-pill" v-bind:class="selected == interest ? 'btn-primary' : 'btn-outline-secondary'" v-on:click="selected = interest">
      {{ interest }}
    </button>

    <button class="btn btn-sm btn-link text-decoration-none" v-on:click="loadAllInterests" v-if="hidden == false">
      + Edit interests
    </button>

    <div v-else>
        <div class="form-check" v-for="interest in allInterests" :key="interest">
            <input class="form-check-input" type="checkbox" v-bind:id="interest" v-bind:value="interest" v-model="selectedInterests">
            <label class="form-check-label text-dark" v-bind:for="interest">{{ interest }}</label>
        </div>

        <button class="btn btn-sm btn-primary mt-2" v-on:click="saveInterests">
            Save
        </button>
        <button class="btn btn-sm btn-link mt-2" v-on:click="hidden = false">
            Cancel
        </button>        
    </div>
  </div>
</template>