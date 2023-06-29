import { createRouter, createWebHistory } from "vue-router";
import state from "./state";
import HomePage from "./views/HomePage.vue";
import GamePage from "./views/GamePage.vue";

const routes = [
  {
    path: "/",
    name: "home",
    component: HomePage
  },
  {
    path: "/game",
    name: "game",
    component: GamePage
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  if (to.path.startsWith("/game") && !state.gameStarted) {
    next({ name: "home" });
  } else {
    next();
  }
});

export default router;