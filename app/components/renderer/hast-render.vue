<script setup lang="ts">
import type { VNodeChild } from 'vue'
import { fromHtml } from 'hast-util-from-html'
import { computed, Fragment, h } from 'vue'
import VnodeRender from './vnode-render.vue'

const props = defineProps<{
  html: string
}>()

const slots = defineSlots<{
  [key: string]: (props: Record<string, any> & { children: VNodeChild[] }) => any
}>()

const tree = computed(() => fromHtml(props.html, { fragment: true }))

type Root = ReturnType<typeof fromHtml>

type RootContent = Root['children'][0]

function transformProperties(props: { className?: Array<string>, style?: string }): { class?: string, style?: string } {
  if (!props.className)
    return { ...props }

  const properties = Object.assign({}, props, { class: props.className?.join(' ') })
  delete properties.className

  return properties
}

function renderTree(tree: Root | RootContent): VNodeChild {
  if (tree.type === 'root') {
    return h(Fragment, tree.children.map(node => renderTree(node)))
  }
  else if (tree.type === 'element') {
    const tagName = tree.tagName

    if (slots[tagName]) {
      return h(slots[tagName], { ...transformProperties(tree.properties), children: tree.children.map(node => renderTree(node)) })
    }

    return h(tagName, transformProperties(tree.properties), tree.children.map(node => renderTree(node)))
  }
  else if (tree.type === 'text') {
    return tree.value
  }
  else {
    return null
  }
}
</script>

<template>
  <VnodeRender :vnode="renderTree(tree)" />
</template>

<style scoped></style>
