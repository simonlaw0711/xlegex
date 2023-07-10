<script setup lang="ts">
import { onMounted, ref, onUnmounted } from 'vue'
import Card from '../components/card.vue'
import { useGame } from '../core/useGame'
import { basicCannon, schoolPride } from '../core/utils'
import { useRoute, useRouter } from "vue-router";
import inGameMusic from '../assets/music/in-game.mp3';
import { Modal, message } from 'ant-design-vue';
import axios from 'axios';
import { styleProviderProps } from 'ant-design-vue/es/_util/cssinjs/StyleContext';

const api = axios.create({
  baseURL: 'https://zh8mi2pxff.execute-api.ap-east-1.amazonaws.com/prod'
});

let ThandleRemoveCounter = 0;
let ThandleBackCounter = 0;

const route = useRoute();
const router = useRouter();
const user_id = route.query.user_id;
const isSkillExceededModalVisible = ref(false);
const isModalVisible = ref(false);
const containerRef = ref<HTMLElement | undefined>()
const clickAudioRef = ref<HTMLAudioElement | undefined>()
const dropAudioRef = ref<HTMLAudioElement | undefined>()
const winAudioRef = ref<HTMLAudioElement | undefined>()
const loseAudioRef = ref<HTMLAudioElement | undefined>()
const welAudioRef = ref<HTMLAudioElement | undefined>()
const curLevel = ref(1)
const showTip = ref(false)
const showLevel = ref(false)
const audio = ref(new Audio(inGameMusic));
const removeFlag = ref(false);
const backFlag = ref(false);
const loseTitle_flag = ref(false)

const LevelConfig = [
  { cardNum: 4, layerNum: 2, trap: false },
  { cardNum: 9, layerNum: 3, trap: false },
  { cardNum: 15, layerNum: 6, trap: true },
]

const isWin = ref(false)

const {
  nodes,
  selectedNodes,
  handleSelect,
  handleBack,
  handleRemove,
  removeList,
  handleSelectRemove,
  initData,
} = useGame({
  container: containerRef,
  cardNum: 4,
  layerNum: 2,
  trap: false,
  events: {
    clickCallback: handleClickCard,
    dropCallback: handleDropCard,
    winCallback: handleWin,
    loseCallback: handleLose,
  },
})

function goToHomepage() {
  router.push({
    path: "/",
    query: {
      user_id: user_id
    }
  });
}

function handleClickCard() {
  if (clickAudioRef.value?.paused) {
    clickAudioRef.value.play()
  }
  else if (clickAudioRef.value) {
    clickAudioRef.value.load()
    clickAudioRef.value.play()
  }
}

function handleDropCard() {
  dropAudioRef.value?.play()
}

function handleWin() {
  winAudioRef.value?.play()
  // fireworks()
  showLevel.value = true
  setTimeout(() => {
    showLevel.value = false
  }, 3000) // Increase this duration if needed  
  if (curLevel.value < LevelConfig.length) {
    basicCannon()
    showTip.value = true
    setTimeout(() => {
      showTip.value = false
    }, 1500)
    setTimeout(() => {
      initData(LevelConfig[curLevel.value])
      curLevel.value++
    }, 2000)
  }
  else {
    isWin.value = true
    api.post(`/api/player/win/${user_id}`)
    schoolPride()
  }
}

function handleOk(){
  isModalVisible.value = false;
  // Redirect to the game bot for earning points
  window.location.href = "https://t.me/jibagame_bot";
}

function handleCancel() {
  isModalVisible.value = false;
}

function handleSkillExceededOk() {
  isSkillExceededModalVisible.value = false;
}

async function ThandleRemove() {
  if (ThandleRemoveCounter >= 1) {
    isSkillExceededModalVisible.value = true;
    return;
  }
  
  try {
    const response = await api.post(`/api/player/useItem/${user_id}?points=2`);

    if (response.data.status === "success") {
      handleRemove();
      removeFlag.value = true; // Set removeFlag to true when the API call is successful

      // Reset the flag after 0.5 seconds (500 ms)
      setTimeout(() => {
        removeFlag.value = false;
      }, 300);

      ThandleRemoveCounter++;  // Increment the counter
    } else {
      isModalVisible.value = true;
    }
  } catch (error) {
    console.error("Error using 'remove': ", error);
  }
}

async function ThandleBack() {
  if (ThandleBackCounter >= 1) {
    isSkillExceededModalVisible.value = true;
    return;
  }

  try {
    const response = await api.post(`/api/player/useItem/${user_id}?points=1`);

    if (response.data.status === "success") {
      handleBack();
      backFlag.value = true; // Set backFlag to true when the API call is successful

      // Reset the flag after 0.5 seconds (500 ms)
      setTimeout(() => {
        backFlag.value = false;
      }, 300);

      ThandleBackCounter++;  // Increment the counter
    } else {
      isModalVisible.value = true;
    }
  } catch (error) {
    console.error("Error using 'back': ", error);
  }
}

function handleLose() {
  loseTitle_flag.value = true
  loseAudioRef.value?.play()
  nodes.value = [] // Immediately remove the game elements
  removeList.value = []
  selectedNodes.value = []
  setTimeout(() => {
    loseTitle_flag.value = false
  }, 3000) // This delay should match with the duration of your bounce animation
}

function handleAfterLoseLeave() {
  welAudioRef.value?.play()
  curLevel.value = 0
  showTip.value = true
  setTimeout(() => {
    showTip.value = false
    setTimeout(() => {
      initData(LevelConfig[curLevel.value])
      curLevel.value++
    }, 1000) // Reduced delay to 1000 milliseconds
  }, 1500)
}

onMounted(() => {
  audio.value.loop = true;
  audio.value.play();
  initData()
})

onUnmounted(() => {
  audio.value.pause();
});

</script>

<template>
  <div flex flex-col w-full h-full>
    <div class="bouncing-text">
      羊了个羊争霸赛
    </div>
    <div ref="containerRef" flex-1 flex>
      <div class="Card" w-full relative flex-1>
        <template v-for="item in nodes" :key="item.id">
          <transition name="slide-fade">
            <Card
              v-if="[0, 1].includes(item.state)"
              :node="item"
              @click-card="handleSelect"
            />
          </transition>
        </template>
      </div>
      <div class="outer-container flex justify-center items-center mt-[-50px]">
        <transition name="bounce">
          <div v-if="showTip" color="#000" flex items-center justify-center w-full text-28px fw-bold>
            第{{ curLevel + 1 }}关
          </div>
        </transition>
        <transition name="bounce" @after-leave="handleAfterLoseLeave">
          <div v-show="loseTitle_flag" color="#000" flex items-center justify-center w-full text-28px fw-bold>
            你输了，再来一次吧
          </div>
        </transition>
        <transition name="bounce">
          <div class="content-container flex flex-col items-center justify-center" v-if="isWin">
            <div color="#000" w-full text-28px fw-bold class="bounce-win">
              <span v-for="(char, index) in '成功加入羊圈~ 通关次数+1'.split('')" :key="index" class="letter" :style="{ animationDelay: (index * 0.1) + 's' }">
                {{ char }}
              </span>
            </div>
            <button @click="goToHomepage" class="return-button mt-4">返回主页</button>
          </div>
        </transition>
      </div>
    </div>
    <div text-center h-50px flex items-center justify-center>
      <Card
        v-for="item in removeList" :key="item.id" :node="item"
        is-dock
        @click-card="handleSelectRemove"
      />
    </div>
    <div w-full flex items-center justify-center>
      <div class="card-holder">
        <template v-for="item in selectedNodes" :key="item.id">
          <transition name="bounce">
            <Card
              v-if="item.state === 2"
              :node="item"
              is-dock
            />
          </transition>
        </template>
      </div>
    </div>
    <div h-50px flex items-center w-full justify-center>
      <img src="../assets/skill_remove.png" :disabled="removeFlag" 
          :style="{opacity: removeFlag ? '0.5' : '1'}"
          mr-10px @click="ThandleRemove" 
          w-100px mb-50px>

      <img src="../assets/skill_revoke.png" :disabled="backFlag" 
          :style="{opacity: backFlag ? '0.5' : '1'}"
          @click="ThandleBack" 
          w-100px mb-50px>
    </div>
    <Modal v-model:visible="isModalVisible" @ok="handleOk" @cancel="handleCancel">
      您的积分不足，请前往游戏机器人 https://t.me/jibagame_bot 获取道具以赚取更多积分。
    </Modal>
    <Modal v-model:visible="isSkillExceededModalVisible"
       @ok="handleSkillExceededOk" 
       :cancel-button-props="{ disabled: true }">
      你已经用过了，不能再用啦
    </Modal>
    <audio
      ref="clickAudioRef"
      style="display: none;"
      controls
      src="./audio/click.mp3"
    />
    <audio
      ref="dropAudioRef"
      style="display: none;"
      controls
      src="./audio/drop.mp3"
    />
    <audio
      ref="winAudioRef"
      style="display: none;"
      controls
      src="./audio/win.mp3"
    />
    <audio
      ref="loseAudioRef"
      style="display: none;"
      controls
      src="./audio/lose.mp3"
    />
    <audio
      ref="welAudioRef"
      style="display: none;"
      controls
      src="./audio/welcome.mp3"
    />
  </div>
</template>

<style>
body {
  background: url(../assets/game_bg.png) no-repeat center center fixed;
  -webkit-background-size: cover;
  -moz-background-size: cover;
  -o-background-size: cover;
  background-size: cover;
}

.card-holder {
  width: 295px;
  height: 80px;
  display: flex;
  background-image: url('../assets/queue_bg.png');
  background-size: 295px 50px;
  background-position: center top;
  background-repeat: no-repeat;
}

.bounce-enter-active {
  animation: bounce-in 0.5s;
}
.bounce-leave-active {
  animation: bounce-in 0.5s reverse;
}
@keyframes bounce-in {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.25);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-30px);
  }
  60% {
    transform: translateY(-15px);
  }
}

.Card {
  z-index: 1000;
}

.bouncing-text {
  animation: bounce 2s infinite;
  font-size: 44px;
  text-align: center;
  width: 100%;
  color: #000;
  font-weight: 600;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 50px;
}

.border-wrapper {
  background: url();
}

.slide-fade-enter-active {
  transition: all 0.2s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(25vh);
  opacity: 0;
}

.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}

.outer-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.bounce-win {
  display: block;
  text-align: center;
  width: 100%;
  height: 100%;
  white-space: nowrap;
}

.letter {
  display: inline-block;
  margin-top: 0.5em;
  text-shadow: rgba(255, 255, 255, 0.4) 0 0 0.05em;
  animation: bounce-win 0.75s cubic-bezier(0.05, 0, 0.2, 1) infinite alternate;
}

@keyframes bounce-win {
  0% {
    transform: translate3d(0, 0, 0);
  }
  100% {
    transform: translate3d(0, -1em, 0);
  }
}
</style>
