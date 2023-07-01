<script setup lang="ts">
import { onMounted, ref, onUnmounted } from 'vue'
import Card from '../components/card.vue'
import { useGame } from '../core/useGame'
import { basicCannon, schoolPride } from '../core/utils'
import { useRoute, useRouter } from "vue-router";
import inGameMusic from '../assets/music/in-game.mp3';

const route = useRoute();
const router = useRouter();
const playerId = route.query.playerId;
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

const joinGroup_flag = ref(false)
const loseTitle_flag = ref(false)

const LevelConfig = [
  { cardNum: 4, layerNum: 2, trap: false },
  { cardNum: 9, layerNum: 3, trap: false },
  { cardNum: 15, layerNum: 6, trap: false },
]

const isWin = ref(false)

const {
  nodes,
  selectedNodes,
  handleSelect,
  handleBack,
  backFlag,
  handleRemove,
  removeFlag,
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
    schoolPride()
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
    <div text-44px text-center w-full color="#000" fw-600 h-60px flex items-center justify-center mt-10px>
      兔了个兔
    </div>
    <div ref="containerRef" flex-1 flex>
      <div w-full relative flex-1>
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
      <transition name="bounce">
        <div v-if="isWin" color="#000" flex items-center justify-center w-full text-28px fw-bold>
          成功加入兔圈~
        </div>
      </transition>
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
    </div>

    <div text-center h-50px flex items-center justify-center>
      <Card
        v-for="item in removeList" :key="item.id" :node="item"
        is-dock
        @click-card="handleSelectRemove"
      />
    </div>
    <div w-full flex items-center justify-center>
      <div border="~ 4px dashed #000" w-295px h-44px flex>
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
      <button :disabled="removeFlag" mr-10px @click="handleRemove">
        移出前三个
      </button>
      <button :disabled="backFlag" @click="handleBack">
        回退
      </button>
    </div>
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
body{
  background-color: #c3fe8b;
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
</style>
