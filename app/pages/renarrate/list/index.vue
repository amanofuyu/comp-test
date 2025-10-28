<script setup lang="ts">
definePageMeta({
  middleware() {
    return navigateTo('/renarrate/list/2007', { replace: true, redirectCode: 301 })
  },
})
</script>
