import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  typescript: {
    tsConfig: {
      vueCompilerOptions: {
        target: 3.5,
      },
    },
  },
  modules: [
    '@vueuse/nuxt',
    'dayjs-nuxt',
  ],
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
})
