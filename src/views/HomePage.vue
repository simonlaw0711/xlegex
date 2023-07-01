<template>
  <div class="home-container">
    <div class="animated-text">
      <h1>达利担保官方比赛</h1>
      <p>羊了个羊争霸赛，过关就给钱</p>
    </div>
    <button @click="startGame">开始游戏</button>
    <button @click="openLeaderboard">排行榜</button> <!-- Restored leaderboard button -->
    <transition name="modal">
      <div v-if="showModal || showLeaderboardModal">
        <!-- Subscription Modal -->
        <div v-if="showModal" class="modal-mask">
          <div class="modal-wrapper">
            <div class="modal-container">
              <h3>请先关注下面频道，然后开始游戏</h3>
              <p>
                加入频道: <a href="https://t.me/dali" target="_blank">https://t.me/dali</a>
              </p>
              <button @click="showModal = false">Close</button>
            </div>
          </div>
        </div>
        <!-- Leaderboard Modal -->
        <div v-if="showLeaderboardModal" class="modal-mask">
          <div class="modal-wrapper">
            <div class="leaderboard-container">
              <h3>排行榜</h3>
              <div class="table-responsive"> <!-- Add the table-responsive container -->
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th class="rank">排名</th>
                      <th class="player">玩家</th>
                      <th>通关次数</th>
                      <th>更新时间</th>
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
              <button class="btn btn-secondary" @click="showLeaderboardModal = false">关闭</button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>
  
<script setup lang="ts">
  import { useRouter } from 'vue-router';
  import { onMounted, ref, computed, onUnmounted } from 'vue';
  import state from '../state';
  import gameStartSound from '../assets/music/home.mp3';
  import inGameMusic from '../assets/music/in-game.mp3';

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
  const user_id = ref<string | null>(null);
  const audio = ref(new Audio(gameStartSound));
  
  onMounted(() => {
    user_id.value = (router.currentRoute.value.query.user_id as string) || null;
    // Play audio when component is mounted
    audio.value.loop = true;
    audio.value.play();
  });

  onUnmounted(() => {
    // Stop the audio when the component is unmounted
    audio.value.pause();
  });

  const startGame = async () => {
  try {
    const response = await fetch(`https://m447he.smartdevops.uk/api/check-subscription/${user_id.value}`);

    if (!response.ok) {
      throw new Error("Failed to check subscription");
    }

    const data = await response.json();

    if (data.subscribed) {
      state.gameStarted = true;
      // Pass the user_id as a query parameter when navigating to the /game page
      router.push({ name: 'game', query: { user_id: user_id.value } });
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
      const response = await fetch('https://m447he.smartdevops.uk/api/player/leaderboard');

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
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@700&display=swap'); /* Import a font that supports Chinese characters */

  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-20px);
    }
  }

  @keyframes shooting-stars {
    0% {
      background-position: 0% 0%;
    }
    100% {
      background-position: 100% 100%;
    }
  }

  .animated-text {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: black;
    text-align: center;
    font-family: 'Noto Sans SC', sans-serif; /* Use the imported font */
  }

  .animated-text h1, .animated-text p {
    animation: bounce 2s ease infinite;
  }
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