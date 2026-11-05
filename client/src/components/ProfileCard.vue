<script setup>
import { computed, onMounted, onBeforeUnmount, defineEmits, ref } from 'vue'
import BaseButton from './BaseButton.vue'
import BaseInput from './BaseInput.vue'
import CategoryPill from './categoryPill.vue'
import { userImageUrl } from '../utils/userDisplay'

const props = defineProps({
    profile: Object,
    profileError: String,
    eventsAttended: Number,
    friendCount: Number,
    selectedCourse: String,
    courses: Array,
    selectedYear: String,
    yearOptions: Array,
    selectedGrad: String,
    gradOptions: Array,
    clubs: Array,
    newClub: String,
    showClubDropdown: Boolean,
    categories: Array,
    allAvailableInterests: Array,
    showInterestDropdown: Boolean,
    saveMessage: String,
    bannerPreview: String,
    bannerFailed: Boolean,
    avatarPreview: String,
    avatarFailed: Boolean
})

const emit = defineEmits([
    'update:selectedCourse',
    'update:selectedYear',
    'update:selectedGrad',
    'update:newClub',
    'update:showClubDropdown',
    'update:showInterestDropdown',
    'update:bannerFailed',
    'update:avatarFailed',
    'handleBannerSelection',
    'handleAvatarSelection',
    'addClub',
    'removeClub',
    'toggleInterest'
])

const profileName = computed(() =>
    props.profile?.displayName || props.profile?.fullName || props.profile?.username || '')

const initials = computed(() =>
    profileName.value.split(' ').map(word => word[0]).slice(0, 2).join('').toUpperCase())

// Auto close dropdown
const handleClickOutside = (event) => {
    if (!event.target.closest('.club-dropdown-container') && props.showClubDropdown) {
        emit('update:showClubDropdown', false)
    }
    if (!event.target.closest('.interest-dropdown-container') && props.showInterestDropdown) {
        emit('update:showInterestDropdown', false)
    }
}

onMounted(() => {
    document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside)
})


const bannerInputFile = ref(null)
const avatarInputFile = ref(null)

function triggerBannerInput() {
  bannerInputFile.value?.click()
}

function triggerAvatarInput() {
  avatarInputFile.value?.click()
}
</script>

<template>
    <div class="profile-card">
        <div class="profile-header-visual">
            <div class="banner-container" @click="triggerBannerInput">
                <div class="profile-banner">
                    <img v-if="bannerPreview || (userImageUrl(profile?.banner) && !bannerFailed)"
                        :src="bannerPreview || userImageUrl(profile.banner)" alt=""
                        @error="emit('update:bannerFailed', true)" />
                    <div class="edit-banner-overlay">
                        <span class="edit-text">Edit Banner</span>
                    </div>
                </div>
                <input type="file" ref="bannerInputFile" @change="e => emit('handleBannerSelection', e)"
                    accept="image/*" class="d-none" />
            </div>

            <div class="avatar-container" @click="triggerAvatarInput">
                <div class="avatar">
                    <img v-if="avatarPreview || (userImageUrl(profile?.avatar) && !avatarFailed)"
                        :src="avatarPreview || userImageUrl(profile.avatar)" alt=""
                        @error="emit('update:avatarFailed', true)" />
                    <p v-else class="header-style">{{ initials }}</p>
                </div>
                <div class="edit-avatar-overlay">
                    <span class="edit-text">Edit</span>
                </div>
                <input type="file" ref="avatarInputFile" @change="e => emit('handleAvatarSelection', e)"
                    accept="image/*" class="d-none" />
            </div>
        </div>

        <div class="user-info">
            <p v-if="profileError" class="profile-error" role="alert">{{ profileError }}</p>

            <!-- Nama & Username full width di atas -->
            <div class="profile-meta">
                <p class="full-name header-style">{{ profileName }}</p>
                <p class="username"> @{{ profile?.username }}</p>
            </div>

            <!-- Stats dipindahin ke bawah secara horizontal -->
            <div class="stats-row">
                <div class="stat-item">
                    <div class="stat-number header-style">{{ eventsAttended }}</div>
                    <div class="stat-label">EVENTS ATTENDED</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number header-style">{{ friendCount }}</div>
                    <div class="stat-label">FRIENDS</div>
                </div>
            </div>
        </div>

        <div class="dropdowns">
            <BaseInput type="select" label="Course" :modelValue="selectedCourse"
                @update:modelValue="val => emit('update:selectedCourse', val)" :options="courses" />
        </div>

        <div class="two-col-inputs">
            <BaseInput type="select" label="Year of Study" :modelValue="selectedYear"
                @update:modelValue="val => emit('update:selectedYear', val)" :options="yearOptions" />
            <BaseInput type="select" label="Graduation" :modelValue="selectedGrad"
                @update:modelValue="val => emit('update:selectedGrad', val)" :options="gradOptions" />
        </div>

        <div class="badges-section">
            <!-- CLUBS -->
            <div class="badge-group">
                <span class="badge-title">Your Clubs</span>
                <div class="badge-row">
                    <CategoryPill v-for="(club, index) in clubs" :key="index" :category="club" type="club" />

                    <div class="club-dropdown-container" style="position: relative; display: inline-block;">
                        <BaseButton variant="small" @click.stop="emit('update:showClubDropdown', !showClubDropdown)">+
                        </BaseButton>

                        <!-- Floating Dropdown Box -->
                        <div v-if="showClubDropdown" class="floating-dropdown">
                            <p class="dropdown-header">Your Clubs</p>
                            <div class="club-add">
                                <input :modelValue="newClub" @input="e => emit('update:newClub', e.target.value)"
                                    class="club-input" type="text" maxlength="40" placeholder="Add a club"
                                    aria-label="Add a club" @keyup.enter="emit('addClub')" />
                                <BaseButton variant="small" @click="emit('addClub')">+</BaseButton>
                            </div>
                            <div v-for="club in clubs" :key="club" class="dropdown-item"
                                @click="emit('removeClub', club)">
                                <input class="checkboxes" type="checkbox" checked
                                    @click.stop="emit('removeClub', club)" />
                                <span>{{ club }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- INTERESTS -->
            <div class="badge-group mt-2">
                <span class="badge-title">Interests</span>
                <div class="badge-row">
                    <CategoryPill v-for="(cat, index) in categories" :key="index" :category="cat" />

                    <div class="interest-dropdown-container" style="position: relative; display: inline-block;">
                        <BaseButton variant="small"
                            @click.stop="emit('update:showInterestDropdown', !showInterestDropdown)">
                            +</BaseButton>

                        <!-- Floating Dropdown Box -->
                        <div v-if="showInterestDropdown" class="floating-dropdown">
                            <p class="dropdown-header">Select Interests</p>
                            <div v-for="item in allAvailableInterests" :key="item.id" class="dropdown-item"
                                @click="emit('toggleInterest', item.id)">
                                <input class="checkboxes" type="checkbox" :checked="categories.includes(item.id)"
                                    @click.stop="emit('toggleInterest', item.id)" />
                                <span>{{ item.label }}</span>
                            </div>
                        </div>
                    </div>

                </div>
                <p v-if="saveMessage" class="save-message" role="status">{{ saveMessage }}</p>
            </div>
        </div>
    </div>
</template>

<style scoped>
.profile-card {
    background-color: var(--color-white);
    border-radius: 25px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 15px;
}

.profile-header-visual {
    position: relative;
    width: 100%;
    margin-bottom: 35px;
}

.banner-container {
    position: relative;
    cursor: pointer;
    overflow: hidden;
    width: 100%;
}

.profile-card input[type="file"] {
    display: none;
}

.edit-banner-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(23, 19, 19, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
    border-radius: 21px;
    pointer-events: none;
}

.edit-banner-overlay .edit-text {
    color: var(--color-white);
    font-weight: 600;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 0.9rem;
}

.banner-container:hover .edit-banner-overlay {
    opacity: 1;
}

.avatar-container {
    position: absolute;
    left: 20px;
    bottom: -30px;
    width: 60px;
    height: 60px;
    cursor: pointer;
    border-radius: 20px;
    overflow: hidden;
}

.edit-avatar-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(23, 19, 19, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
    border-radius: 20px;
    pointer-events: none;
}

.edit-avatar-overlay .edit-text {
    color: var(--color-white);
    font-weight: 600;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.8rem;
}

.avatar-container:hover .edit-avatar-overlay {
    opacity: 1;
}

.avatar {
    background-color: var(--color-green);
    width: 100%;
    height: 100%;
    font-size: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
}

.avatar p.header-style {
    margin: 0;
    font-size: 30px;
    color: var(--color-white);
}

.avatar img {
    position: absolute;
    width: 100%;
    height: 100%;
    object-fit: cover;
    top: 0;
    left: 0;
}

.profile-banner {
    aspect-ratio: 5 / 2;
    background-color: var(--color-dark-green);
    border-radius: 20px;
    overflow: hidden;
}

.profile-banner img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.profile-error {
    color: var(--color-dark-red);
    font-size: 11px;
}

/* User info layout diubah jadi stack ke bawah */
.user-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    margin: 0 15px;
}

.profile-meta {
    width: 100%;
    min-width: 0;
}

.stats-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    width: 100%;
}

.user-info p {
    margin: 0;
}

.username {
    opacity: 70%;
    font-size: 15px;
}

.full-name {
    font-size: 18px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.stat-item {
    display: flex;
    flex-direction: column;
}

.stat-number {
    font-size: 25px;
}

.stat-label {
    opacity: 70%;
    font-size: 13px;
    letter-spacing: 0.2px;
}

.dropdowns {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 10px 15px;
}

.two-col-inputs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin: 15px;
    margin-top: 0;
    align-items: start;
}

.badges-section {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-bottom: 5px;
}

.badge-group {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin: 0 15px 5px 15px;
}

.badge-title {
    font-family: 'TextFont', sans-serif;
    font-size: 12px;
    font-weight: 700;
    color: var(--color-black);
}

.badge-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
}

.checkboxes {
    appearance: none;
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border: 1.5px solid #cbd5e1;
    border-radius: 4px;
    background-color: #ffffff;
    cursor: pointer;
    display: grid;
    place-content: center;
    transition: all 0.2s ease;
    margin: 0;
}

.checkboxes:checked {
    background-color: var(--color-blue);
    border-color: var(--color-blue);
}

.checkboxes:checked::before {
    content: "";
    width: 4px;
    height: 8px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
    margin-bottom: 2px;
}

.floating-dropdown {
    position: absolute;
    bottom: 40px;
    left: 0;
    width: 220px;
    background-color: #ffffff;
    border-radius: 12px;
    box-shadow: 0 -10px 25px rgba(0, 0, 0, 0.15);
    border: 1px solid #e2e8f0;
    padding: 8px 0;
    z-index: 100;
    max-height: 200px;
    overflow-y: auto;
}

.dropdown-header {
    font-size: 11px;
    font-weight: 700;
    color: #94a3b8;
    padding: 4px 12px;
    margin: 0 0 4px 0;
    letter-spacing: 0.5px;
}

.dropdown-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    font-size: 12px;
    color: #1e293b;
    cursor: pointer;
    transition: background-color 0.15s;
    font-weight: 600;
}

.dropdown-item:hover {
    background-color: #f1f5f9;
}

.dropdown-item input[type="checkbox"] {
    cursor: pointer;
}

.club-add {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 2px 12px 6px;
}

.club-input {
    flex: 1;
    min-width: 0;
    height: 28px;
    padding: 2px 10px 0;
    border: 1px solid var(--color-grey);
    border-radius: 999px;
    color: var(--color-black);
    font-size: 12px;
}

.save-message {
    margin: 8px 0 0;
    font-size: 11px;
}
</style>