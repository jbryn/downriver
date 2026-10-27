import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@fontsource/young-serif/400.css'
import '@fontsource-variable/atkinson-hyperlegible-next/wght.css'
import 'leaflet/dist/leaflet.css'
import './style.css'
import App from './App.vue'

createApp(App).use(createPinia()).mount('#app')
