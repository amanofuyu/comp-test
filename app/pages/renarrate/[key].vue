<script setup lang="ts">
import { RendererHastRender } from '#components'
import { pick } from 'es-toolkit'

interface CollectData {
  url: string
  title: string
  date: string
  content: string
  html: string
}

const route = useRoute()
const request = useRequestURL()

const key = route.params.key as string

const { data } = await useAsyncData(`renarrate-${key}`, async () => {
  const path = `${request.origin}/collect/${key}`

  const res = await $fetch(`${path}/data.json`, { method: 'get' }) as CollectData

  return markRaw(pick(res, ['url', 'title', 'date', 'content', 'html']))
})

if (!data.value)
  throw createError({ statusCode: 404 })

useSeoMeta({
  title: `${data.value.title} - Renarrate`,
  description: `${data.value.content.slice(0, 50)}...`,
})
</script>

<template>
  <div class="h-dvh overflow-auto scrollbar-hidden relative select-none px-5">
    <div v-if="data" class="w-full max-w-[65ch] py-8 md:py-16 mx-auto">
      <h1 class="text-3xl font-bold mb-2">
        {{ data.title }}
      </h1>
      <p class="text-sm opacity-60 mb-6">
        {{ data.date }}
      </p>

      <div class="text-base-content/90 prose prose-img:inline prose-img:m-0">
        <RendererHastRender :html="data.html" />
      </div>

      <div class="flex items-center justify-between gap-4 mt-12">
        <NuxtLink class="opacity-50 hover:opacity-100 transition-opacity" to="/renarrate">
          > cd ..
        </NuxtLink>

        <NuxtLink class="opacity-50 hover:opacity-100 transition-opacity" :to="data.url" target="_blank" rel="noopener noreferrer" external>
          source ↗
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
