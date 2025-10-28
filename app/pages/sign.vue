<script setup lang="ts">
import type { UnencodedFrame } from 'modern-gif'
import { createTimeline } from 'animejs'
import { encode } from 'modern-gif'
import workerUrl from 'modern-gif/worker?url'

const signRef = useTemplateRef<SVGElement>('signRef')

const isGeneratingImage = ref(false)

async function generateSignImage() {
  if (!signRef.value)
    return

  const signSvg = signRef.value.querySelector('svg')?.cloneNode(true) as SVGElement | undefined

  if (!signSvg)
    return

  const viewBoxStr = signSvg.getAttribute('viewBox')

  if (!viewBoxStr)
    return

  const [_x, _y, width, height] = viewBoxStr.trim().split(/\s+|,/).map(Number)

  if (!width || !height)
    return

  isGeneratingImage.value = true

  try {
    const fileHandle = await Fsa.file({
      suggestedName: 'non-sign.png',
      create: true,
    })

    Array.from(signSvg.querySelectorAll('path')).map((path) => {
      path.removeAttribute('style')
      path.setAttribute('stroke-dashoffset', '0')
      path.setAttribute('stroke', '#fff')

      return path
    })

    const serializer = new XMLSerializer()

    const scale = 20

    const scaleCanvas = new OffscreenCanvas(width * scale, height * scale)

    const renderScale = 2

    const renderCanvas = new OffscreenCanvas(width * renderScale, height * renderScale)

    const scaleCtx = scaleCanvas.getContext('2d', {
      willReadFrequently: true,
    })!
    scaleCtx.imageSmoothingEnabled = true
    scaleCtx.imageSmoothingQuality = 'high'

    const renderCtx = renderCanvas.getContext('2d', {
      willReadFrequently: true,
    })!
    renderCtx.imageSmoothingEnabled = true
    renderCtx.imageSmoothingQuality = 'high'

    const svgString = serializer.serializeToString(signSvg)
    const svgUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`

    console.log(svgUrl)

    const img = new Image()
    img.src = svgUrl
    await img.decode()

    scaleCtx.clearRect(0, 0, scaleCanvas.width, scaleCanvas.height)
    scaleCtx.drawImage(img, 0, 0, scaleCanvas.width, scaleCanvas.height)

    renderCtx.clearRect(0, 0, renderCanvas.width, renderCanvas.height)
    renderCtx.drawImage(scaleCanvas, 0, 0, renderCanvas.width, renderCanvas.height)

    renderCtx.globalCompositeOperation = 'lighter'
    renderCtx.fillStyle = '#202020'
    renderCtx.fillRect(0, 0, renderCanvas.width, renderCanvas.height)

    const blob = await renderCanvas.convertToBlob()

    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')

    await Fsa.write(blob, fileHandle)
  }
  finally {
    isGeneratingImage.value = false
  }
}

const isGeneratingGif = ref(false)

function getDuration(length: number) {
  const minK = 2 // 最小系数
  const maxK = 10 // 最大系数（极短路径）
  const refLength = 100 // 参考长度

  // 对数衰减
  const k = minK + (maxK - minK) * Math.exp(-length / (refLength * 2))
  return length * k
}

/**
 *
 * @param t [0, 1]
 */
function easeInOutSine(t: number) {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

async function generateSignGif() {
  if (!signRef.value)
    return

  const signSvg = signRef.value.querySelector('svg')?.cloneNode(true) as SVGElement | undefined

  if (!signSvg)
    return

  const viewBoxStr = signSvg.getAttribute('viewBox')

  if (!viewBoxStr)
    return

  const [_x, _y, width, height] = viewBoxStr.trim().split(/\s+|,/).map(Number)

  if (!width || !height)
    return

  isGeneratingGif.value = true

  try {
    const fileHandle = await Fsa.file({
      suggestedName: 'non-sign.gif',
      create: true,
    })

    const paths = Array.from(signSvg.querySelectorAll('path')).map((path) => {
      path.removeAttribute('style')

      return path
    })

    const frames: Array<UnencodedFrame> = []

    const serializer = new XMLSerializer()

    const scale = 20

    const scaleCanvas = new OffscreenCanvas(width * scale, height * scale)

    const renderScale = 2

    const renderCanvas = new OffscreenCanvas(width * renderScale, height * renderScale)

    const scaleCtx = scaleCanvas.getContext('2d', {
      willReadFrequently: true,
    })!
    scaleCtx.imageSmoothingEnabled = true
    scaleCtx.imageSmoothingQuality = 'high'

    const renderCtx = renderCanvas.getContext('2d', {
      willReadFrequently: true,
    })!
    renderCtx.imageSmoothingEnabled = true
    renderCtx.imageSmoothingQuality = 'high'

    for (let i = 0; i < paths.length; i++) {
      const path = paths[i]!
      const length = Math.ceil(path.getTotalLength())

      const duration = getDuration(length)
      const frameCount = Math.ceil(duration / 30)

      const dashoffsets = Array.from({ length: frameCount }, (_, index) => {
        const t = index / (frameCount - 1)
        const progress = easeInOutSine(t)
        return length * (1 - progress)
      })

      for (let j = 0; j < frameCount; j++) {
        const { promise, resolve } = Promise.withResolvers<void>()

        requestAnimationFrame(async () => {
          const dashoffset = dashoffsets[j]!
          path.setAttribute('stroke-dashoffset', String(dashoffset))
          path.setAttribute('stroke', '#fff')

          const svgString = serializer.serializeToString(signSvg)
          const svgUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`

          const img = new Image()
          img.src = svgUrl
          await img.decode()

          scaleCtx.clearRect(0, 0, scaleCanvas.width, scaleCanvas.height)
          scaleCtx.drawImage(img, 0, 0, scaleCanvas.width, scaleCanvas.height)

          renderCtx.clearRect(0, 0, renderCanvas.width, renderCanvas.height)
          renderCtx.drawImage(scaleCanvas, 0, 0, renderCanvas.width, renderCanvas.height)

          renderCtx.globalCompositeOperation = 'lighter'
          renderCtx.fillStyle = '#202020'
          renderCtx.fillRect(0, 0, renderCanvas.width, renderCanvas.height)

          frames.push({
            width: renderCanvas.width,
            height: renderCanvas.height,
            data: renderCtx.getImageData(0, 0, renderCanvas.width, renderCanvas.height).data,
            delay: j === frameCount - 1 ? 1000 : 30,
          })

          resolve()
        })

        await promise
      }
    }

    const gifBuffer = await encode({
      frames,
      width: renderCanvas.width,
      height: renderCanvas.height,
      workerUrl,
    })

    const blob = new Blob([gifBuffer], { type: 'image/gif' })

    await Fsa.write(blob, fileHandle)
  }
  finally {
    isGeneratingGif.value = false
  }
}

const signWidth = ref('auto')
const signHeight = ref('auto')

function autoFit() {
  const width = window.innerWidth
  const height = window.innerHeight

  if (width / height > 3 / 2) {
    signWidth.value = 'auto'
    signHeight.value = '100%'
  }
  else {
    signWidth.value = '100%'
    signHeight.value = 'auto'
  }
}

useEventListener('resize', autoFit)

function startSignAnimation() {
  if (!signRef.value)
    return

  const pathEls = signRef.value.querySelectorAll('path')

  const tl = createTimeline({ frameRate: 60, autoplay: true, loop: true, loopDelay: 1000 })

  for (let i = 0; i < pathEls.length; i++) {
    const pathEl = pathEls[i]!
    const length = pathEl.getTotalLength()

    tl.sync().add(pathEls[i]!, {
      strokeDashoffset: 0,
      easing: 'easeInOutSine',
      duration: getDuration(length),
      delay: 300,
    })
  }

  return () => tl.pause()
}

onMounted(() => {
  autoFit()

  const stop = startSignAnimation()

  onUnmounted(() => {
    stop?.()
  })
})
</script>

<template>
  <main class="w-full h-dvh flex flex-col items-center justify-center relative z-10">
    <div ref="signRef" class="absolute -z-10 aspect-3/2 text-white pointer-events-none [6>svg]:w-full [6>svg]:h-full" :style="{ width: signWidth, height: signHeight }">
      <svg viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M37 93C37.5 89 40.5 78 46 78C52.5 78 53 88.5 56 91.5C58.2986 92.9366 72 81.3689 82 73.5C112.5 49.5 134 31 130.5 28.5C122.5 28 107.5 48 106.5 56C106.25 58 106.5 62 111.5 64C116.5 66 122.5 61.5 124 60C125.5 58.5 135 48.6 131 47C129.5 46.4 123.833 50 122.5 54C121.5 58.5 127 56.5833 130.5 56C135.5 55.5 156.5 42.5 158 42C159.5 41.5 153.5 51 155.5 52C158.5 52.5 178 39 181 39C184 39 187.5 46 190.5 46.5C194.486 47.1643 202 44.5 209 39.5C216 34.5 224.5 26.5 229.5 22"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="366" stroke-dashoffset="366"
        />
        <path
          d="M150 83.5C153 83.5 174 79 177 78.5C180 78 204.5 73.2457 211.5 72C218.5 70.7543 234 66.5 235 66"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          stroke-dasharray="87" stroke-dashoffset="87"
        />
        <path
          d="M181.5 76.0001C182.5 80.0001 184 85 185.5 85C187 85 190.5 80.5 192 77.5C192.5 78.5 195.5 82.0001 197 82.0001C198.5 82.0001 202.5 78 203 74.5C204.5 79.5 205.5 79.5001 206.5 80.0001C208 80.0001 211.5 76.5 212.5 76.0001C214 76.5 216 78.2222 221.5 77C227 75.7778 227.5 71 227.5 71C227.5 71 228 66.5 226.5 61.5"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          stroke-dasharray="80" stroke-dashoffset="80"
        />
        <path
          d="M137 99.5C140.5 100.5 141 101 144 101C147 101 152 98 153.5 97C155 96 159 93 161.5 93C164.5 93 167.2 97 168 99C168.293 99.732 172.5 108.5 169.5 109.5C168.5 107 171.5 106 173.5 106C175.5 106 187.009 107.624 194.5 107C206.5 106 224 99.5 232.5 94C236.899 91.1534 247 79 249.5 74.5C252 70 262.5 49.5 263.5 37C263.703 34.4681 262.5 29.5 261 26.5"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          stroke-dasharray="193" stroke-dashoffset="193"
        />
        <path
          d="M232 43L232.5 43.5" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round"
          stroke-dasharray="1" stroke-dashoffset="1"
        />
        <path
          d="M139 126.362C138.5 127.862 136.429 135.071 134 137.5C131.571 139.929 129 141 127 140.5C125 140 124 138 124 135.5C124 133 125.5 130.333 129 128C129.838 127.441 133 126 137.5 126C142 126 146.5 128.5 148 130.5C148.375 131 149.5 133 149 136C148.589 138.466 146.5 141 140.5 147.5"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          stroke-dasharray="77" stroke-dashoffset="77"
        />
        <path
          d="M129.5 161.5C129.5 162.5 128.946 164.608 128.5 165.5C127 168.502 124 172.5 122.5 174.5C128.5 171 131 170.5 131.5 170.5C132 170.5 136 175.5 137.5 177C139 178.5 141.5 178.5 143.5 177.5C146 176.25 149.5 173 151 171"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          stroke-dasharray="51" stroke-dashoffset="51"
        />
      </svg>
    </div>

    <div class="absolute bottom-5 w-full max-w-3xl flex items-center justify-end gap-4">
      <button class="cursor-pointer" @click="generateSignImage">
        生成图片{{ isGeneratingImage ? '中...' : '' }}
      </button>
      <button class="cursor-pointer" @click="generateSignGif">
        生成 GIF {{ isGeneratingGif ? '中...' : '' }}
      </button>
    </div>
  </main>
</template>

<style scoped></style>
