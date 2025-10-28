<script setup lang="ts">
import type { VNodeChild } from 'vue'
import { defineComponent } from 'vue'

const props = defineProps<{
  vnode: VNodeChild | VNodeChild[]
}>()

const Content = defineComponent({
  setup() {
    return () => props.vnode
  },
})
</script>

<template>
  <Content />
</template>

<style scoped></style>
