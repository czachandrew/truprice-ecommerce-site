import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { DefaultApolloClient } from '@vue/apollo-composable'
import router from './router'
import App from './App.vue'
import { apolloClient } from './plugins/apollo'
import './style.css'

const app = createApp(App)

// Install plugins
app.use(createPinia())
app.use(router)

// Provide Apollo Client
app.provide(DefaultApolloClient, apolloClient)

app.mount('#app')
