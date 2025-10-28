export function createWorker(func: (...args: any[]) => any): Worker {
  const blob = new Blob([`(${func.toString()})()`])
  const url = URL.createObjectURL(blob)
  const worker = new Worker(url)

  return worker
}
