import { createApp } from 'vue'
import App from './App.vue'

// Detect Android and apply color correction class
if (/Android/i.test(navigator.userAgent)) {
  document.body.classList.add('android-device');
}

createApp(App).mount('#app')
