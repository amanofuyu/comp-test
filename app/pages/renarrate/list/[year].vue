<script setup lang="ts">
import { groupBy } from 'es-toolkit/compat'

interface CollectItem {
  id: string
  title: string
  date: string
  content: string
}

const monthMap = {
  '01': 'January',
  '02': 'February',
  '03': 'March',
  '04': 'April',
  '05': 'May',
  '06': 'June',
  '07': 'July',
  '08': 'August',
  '09': 'September',
  '10': 'October',
  '11': 'November',
  '12': 'December',
} as Record<string, string>

interface ListItem {
  id: string
  title: string
  year: string
  month: string
  day: string
}

const route = useRoute()
const request = useRequestURL()

const year = ref((route.params.year || '2007') as string)

const { data } = await useAsyncData(`renarrate`, async () => {
  const { list } = await $fetch(`${request.origin}/collect/index.json`, { method: 'get' }) as {
    list: Array<CollectItem>
  }

  const res = list.filter(item => item.date.startsWith(`${year.value}`)).map((item) => {
    const [date] = item.date.split(' ')
    const [y, m, d] = date!.split('-')

    return {
      id: item.id,
      title: item.title,
      year: y,
      month: m,
      day: d,
    } as ListItem
  })

  const grouped = Object.entries(groupBy(res, 'month')).sort((a, b) => Number(a[0]) - Number(b[0]))

  return markRaw({
    list: grouped,
    listTotal: res.length,
    total: list.length,
  })
}, {
  watch: [year],
})

useSeoMeta({
  title: `Nounenrena's Blog Archive for ${year.value} - Renarrate`,
  description: `A collection of blog posted by Nounenrena in ${year.value}.`,
})
</script>

<template>
  <div class="h-dvh overflow-auto scrollbar-hidden relative select-none px-5">
    <h1 class="sr-only">
      Nounenrena's Blog Archive for {{ year }}
    </h1>

    <div class="fixed top-1/2 left-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-full max-w-3xl" aria-hidden="true">
      <svg class="w-full h-auto" viewBox="0 0 100 100">
        <text
          x="50" y="50"
          text-anchor="middle"
          dominant-baseline="middle"
          font-size="20"
          font-weight="bold"
          fill="none"
          stroke-width="1"
        >
          <tspan stroke="currentColor" opacity="0.1">{{ year.slice(0, 3) }}</tspan>
          <tspan class="stroke-primary" opacity="0.5">{{ year.slice(3) }}</tspan>
        </text>
      </svg>
    </div>

    <div class="w-full max-w-3xl mx-auto py-16 md:py-20">
      <h2 class="text-3xl font-bold mb-10">
        {{ `${year} · ${data!.listTotal} of ${data!.total}` }}
      </h2>

      <div class="flex flex-col gap-16">
        <section v-for="[month, items] in data!.list" :key="month" class="flex flex-col gap-8">
          <h3 class="text-2xl font-bold">
            {{ `${monthMap[month]} · ${items.length}` }}
          </h3>

          <ul class="flex flex-col gap-6">
            <li v-for="item in items" :key="item.id" class="flex">
              <NuxtLink class="flex flex-col gap-2 md:flex-row md:items-end md:gap-4 text-base-content/80 hover:text-base-content transition-colors" :to="`/renarrate/${item.id}`" prefetch-on="interaction">
                <span class="text-xl font-bold">{{ item.title }}</span>
                <span class="text-sm opacity-60">{{ `${monthMap[item.month]} ${item.day}` }}</span>
              </NuxtLink>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>
