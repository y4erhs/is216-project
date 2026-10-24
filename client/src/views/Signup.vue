<script setup>
    import 'bootstrap/dist/css/bootstrap.min.css'
    import 'bootstrap/dist/js/bootstrap.bundle.min.js'

    import { onMounted, onUnmounted } from 'vue'
    import BaseButton from '../components/BaseButton.vue'
    import FolderTabs from '../components/FolderTabs.vue'
    import '../assets/theme.css'

    const categories = [
  { id: 'create-acc', label: 'CREATE ACCOUNT', theme: 'theme-green' },
  { id: 'edit-profile', label: 'EDIT PROFILE', theme: 'theme-orange' },
  { id: 'interests', label: 'CHOOSE INTERESTS', theme: 'theme-purple' },
  { id: 'personalise', label: 'PERSONALISE', theme: 'theme-red' }

]
</script>

<template>
<div class="page-wrapper">
<FolderTabs :tabs="categories" defaultActive="create-acc">
    <template #create-acc>
      <div class="cards-list">
        <!-- create account event cards -->
         <div>
            <h1> CREATE AN ACCOUNT </h1>
            <form action="">
                <input type="text" placeholder="Full Name">
                <input type="email" placeholder="Email">
                <input type="password" placeholder="Password">
                <input type="password" placeholder="Confirm Password"><br>
                
                <BaseButton type="submit" class="auth-btn">REGISTER</BaseButton>
                <span class="or-text">Or</span>
                <BaseButton type="button" class="auth-btn"> <img src="/google-green-icon.png" style="width: 16px; height: 16px;">  CONTINUE WITH GOOGLE</BaseButton>
                <div class="log-in">
                  <p>Have an account? <router-link to="/login"> Log in</router-link></p>
                </div>
            </form>
         </div>
      </div>
    </template>

    <template #edit-profile>
      <div class="cards-list">
        <!-- profile cards -->
         <h1> CREATE PROFILE</h1>
         <form action="">
                <input type="text" placeholder="Display Name">
                <input type="text" placeholder="Username">
                <select name="Select Course" id="">
                    <option value="">Software Engineering</option>
                </select>
                
                <BaseButton type="submit" class="auth-btn">REGISTER</BaseButton>
            </form>
      </div>
    </template>

    <template #interests>
      <div class="cards-list">
        <!-- interest event cards -->
      </div>
    </template>

    <template #personalise>
      <div class="cards-list">
        <!-- interest event cards -->
      </div>
    </template>
  </FolderTabs>
</div>

</template>

<style scoped>
.page-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 20px;
}

/* Allow the wrapper to take up more space */
.page-wrapper > * {
    width: 90%;
    max-width: 900px; /* Make this as wide as you want the folder to be */
}

/* Force FolderTabs and its internal card lists to respect the new wider size */
:deep(.folder-tabs-container), 
:deep(.cards-list),
:deep(.tab-content) {
    width: 100% !important;
    max-width: 100% !important;
}

:deep(h1) {
    font-family: 'HeaderFont', sans-serif !important;
    color: var(--color-white);
    text-align: center;
    font-size: 2.2rem; /* Optional: make the header text larger to match */
}

form {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 40px auto;
    color: var(--color-white);
    gap: 16px;
    width: 100%;
}

input {
  border: none;
  border-bottom: 2px solid var(--color-white);
  background: transparent;
  outline: none;
  padding: 10px 0;
  color: var(--color-white);
  width: 70%; /* Adjust input line width inside the larger folder */
  max-width: 500px;
  font-size: 16px;
  box-sizing: border-box;
  transition: border-color 0.2s ease;
}

input::placeholder {
    color: var(--color-white);
    opacity: 0.8;
}

input:focus {
  border-bottom-color: var(--color-white);
}

.auth-btn {
  width: 70%;
  max-width: 500px;
}

.log-in {
  margin-top: 16px;
  text-align: center;
}

.log-in a {
  color: var(--color-green);
}
.log-in a:hover {
  color: var(--color-green);
  opacity: 0.75;
}
</style>