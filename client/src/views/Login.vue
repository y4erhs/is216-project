<script setup>

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

import BaseButton from '../components/BaseButton.vue'


</script>

<template>

    <div class="page-wrapper">
        <div class="container my-5" style="max-width: 400px;">
            <div class="sign-in">
            <h1>Sign In</h1>
                <form>
                    <input id="username" type="text" placeholder="Username"> <br>
                    <br>
                    <input id="password" type="text" placeholder="Password"> <br>
                    <br>
                    <BaseButton class="w-100" variant="primary">Sign In</BaseButton>
                </form>
            </div>
        </div> 
    </div>

</template>

<style scoped>

.page-wrapper {
    font-family: Arial, Helvetica, sans-serif;
}

h1 {
    font-weight: bold;
    margin-bottom: 20px;
}

input {
    border: none;                      
    border-bottom: 1.5px solid #0a1d2b;     
    background: transparent;           
    outline: none;                    
    padding: 8px 0;                    
    width: 100%;                       
    box-sizing: border-box;            
}

.sign-in {
    background-color: #f1f2f7;
    padding: 40px;
    border-radius: 10px;
}

input::placeholder {
    color: #0a1d2b;
}
    
</style>