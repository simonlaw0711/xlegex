<template>
    <div class="home-container">
      <h1>Welcome to My Game</h1>
      <p>Here is some information about the game...</p>
      <button @click="startGame">Start Game</button>
      <transition name="modal">
        <div v-if="showModal" class="modal-mask">
          <div class="modal-wrapper">
            <div class="modal-container">
              <h3>Please follow the link to play the game</h3>
              <p>
                Join our Telegram group: <a href="https://t.me/dali" target="_blank">https://t.me/dali</a>
              </p>
              <button @click="showModal = false">Close</button>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </template>
  
  <script setup lang="ts">
  import { useRouter } from 'vue-router';
  import { onMounted, ref } from 'vue';
  import state from '../state';
  
  const showModal = ref(false);
  const router = useRouter();
  const playerId = ref<string | null>(null);
  
  onMounted(() => {
    playerId.value = (router.currentRoute.value.query.playerId as string) || null;
  });
  
  const startGame = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8080/api/check-subscription/${playerId.value}`);
      
      if (!response.ok) {
        throw new Error("Failed to check subscription");
      }
  
      const data = await response.json();
  
      if (data.subscribed) {
        state.gameStarted = true;
        router.push("/game");
      } else {
        // Show an error message or handle the case when the user is not subscribed
        showModal.value = true;
      }
    } catch (error) {
      console.error("Error:", error);
      // Handle the error, e.g., show an error message to the user
    }
  };
  </script>
  
  <style>
    .modal-mask {
    position: fixed;
    z-index: 9998;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: table;
    transition: opacity 0.3s ease;
    }

    .modal-wrapper {
    display: table-cell;
    vertical-align: middle;
    }

    .modal-container {
    width: 300px;
    margin: 0px auto;
    padding: 20px 30px;
    background-color: #fff;
    border-radius: 2px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
    transition: all 0.3s ease;
    font-family: Helvetica, Arial, sans-serif;
    }

    .modal-transition-enter,
    .modal-transition-leave-to {
    opacity: 0;
    }

    .modal-transition-enter-active,
    .modal-transition-leave-active {
    transition: opacity 0.3s;
    }

    .home-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    color: #000; /* Make all text black */
    }

    .home-container button {
    color: #fff; /* Reset the button text color to inherit from the parent element */
    }    
  </style>