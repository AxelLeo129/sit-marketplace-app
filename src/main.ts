import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { setUnauthorizedHandler } from './services/api'
import { useAuthStore } from './stores/auth'
// Montserrat servida desde la propia app (sin Google Fonts): menos terceros y una CSP más estricta.
import '@fontsource/montserrat/latin-400.css'
import '@fontsource/montserrat/latin-500.css'
import '@fontsource/montserrat/latin-600.css'
import '@fontsource/montserrat/latin-700.css'
import './assets/main.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// Si la API rechaza el token (venció o desactivaron al usuario), se vuelve al login.
setUnauthorizedHandler(() => {
  useAuthStore().clear()
  const current = router.currentRoute.value
  if (!current.meta.guest) {
    router.push({ name: 'login', query: { redirect: current.fullPath } })
  }
})

app.mount('#app')
