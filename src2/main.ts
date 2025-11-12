import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.mount('#app');

// Remove loading screen after Vue app is mounted
const loadingElement = document.getElementById('loading');
if (loadingElement) {
  loadingElement.remove();
}