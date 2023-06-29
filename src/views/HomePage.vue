<template>
  <div class="home-container">
    <h1>Welcome to My Game</h1>
    <p>Here is some information about the game...</p>
    <button @click="startGame">Start Game</button>
    <button @click="openLeaderboard">Leaderboard</button> <!-- Restored leaderboard button -->
    <transition name="modal">
      <div v-if="showModal || showLeaderboardModal">
        <!-- Subscription Modal -->
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
        <!-- Leaderboard Modal -->
        <div v-if="showLeaderboardModal" class="modal-mask">
          <div class="modal-wrapper">
            <div class="leaderboard-container">
              <h3>Leaderboard</h3>
              <div class="table-responsive"> <!-- Add the table-responsive container -->
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th class="rank">Rank</th>
                      <th class="player">Player</th>
                      <th>Score</th>
                      <th>Updated Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="player in sortedLeaderboard" :key="player.id">
                      <td class="rank">{{ player.player_rank }}</td>
                      <td>
                        <div class="d-flex">
                          <img class="avatar" :src="player.avatar" alt="Player Avatar" />
                          <span>{{ player.nickname }}</span>
                        </div>
                      </td>
                      <td>
                        <span class="score-container">{{ player.score }}</span>
                      </td>
                      <td>{{ player.update_time }}</td>
                    </tr>
                  </tbody>
                </table>
              </div> <!-- Close the table-responsive container -->
              <button class="btn btn-secondary" @click="showLeaderboardModal = false">Close</button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>
  
<script setup lang="ts">
  import { useRouter } from 'vue-router';
  import { onMounted, ref, computed } from 'vue';
  import state from '../state';

  interface Player {
    id: number;
    score: number;
    player_rank: number;
    update_time: string;
    avatar: string;
    nickname: string
  }

  const showModal = ref(false);
  const leaderboard = ref<Player[]>([]);
  const showLeaderboardModal = ref(false); // New ref for controlling leaderboard modal visibility
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
      // Pass the playerId as a query parameter when navigating to the /game page
      router.push({ name: 'game', query: { playerId: playerId.value } });
    } else {
      // Show an error message or handle the case when the user is not subscribed
      showModal.value = true;
    }
  } catch (error) {
    console.error("Error:", error);
    // Handle the error, e.g., show an error message to the user
  }
};

  const openLeaderboard = async () => {
    await fetchLeaderboard();
    showLeaderboardModal.value = true;
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8080/api/player/leaderboard');

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard data');
      }

      const data = await response.json();
      leaderboard.value = data;
    } catch (error) {
      console.error('Error:', error);
      // Handle the error, e.g., show an error message to the user
    }
  };

  const sortedLeaderboard = computed(() => {
    return leaderboard.value.sort((a, b) => a.player_rank - b.player_rank);
  });

</script>
  
<style lang="scss" scoped>
  @import "@/../node_modules/bootstrap/scss/bootstrap";

  /* Existing media query */
  @media (max-width: 767px) {
    .leaderboard-container {
      width: 100%;
    }

    .table {
      table-layout: fixed;
      word-wrap: break-word;
    }
  }

  /* New media query for mobile view adjustments */
  @media (max-width: 480px) {
    .leaderboard-container {
      h3 {
        font-size: 1.5rem; /* Decrease the font size for the heading */
      }

      .avatar {
        width: 24px; /* Decrease the avatar size */
        height: 24px;
      }

      .table {
        font-size: 0.8rem; /* Decrease the font size for the table */
      }
      
      .btn {
        font-size: 0.8rem; /* Decrease the font size for the button */
        padding: 0.25rem 0.5rem; /* Reduce the padding for the button */
      }

      .rank {
        width: 50px;
      }

      .player {
        width: 110px;
      }

    }
  }
</style>

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
  margin-bottom: 10px; /* Add spacing between the buttons */
  }    

  .table td {
    vertical-align: middle;
    padding: 5px; /* Add padding to table cells for more spacing */
  }

  .rank {
    text-align: center;
  }

  .player-info {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    margin-right: 5px;
  }

  .leaderboard-container {
    width: 500px;
    margin: 0px auto;
    padding: 20px 30px;
    background-color: #fff;
    border-radius: 2px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
    transition: all 0.3s ease;
    font-family: Helvetica, Arial, sans-serif;
  }

  .score-container {
    display: inline-block;
    padding: 5px 10px;
    background-color: black;
    color: white;
    border-radius: 5px;
  } 
</style>