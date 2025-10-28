export type FasFileOptions
  = | (FilePickerOptions & { create?: false })
    | (SaveFilePickerOptions & { create: true })

export class Fsa {
  public static isSupport() {
    return (
      'showOpenFilePicker' in window
      && 'showSaveFilePicker' in window
      && 'showDirectoryPicker' in window
    )
  }

  public static async file({ create, ...options }: FasFileOptions = {}) {
    let fileHandle: FileSystemFileHandle
    if (create) {
      fileHandle = await showSaveFilePicker(options)
    }
    else {
      [fileHandle] = await showOpenFilePicker(options)
    }

    return fileHandle
  }

  public static async write(
    input:
      | Blob
      | string
      | ArrayBuffer
      | Response
      | Uint8Array
      | ReadableStream<Uint8Array>,
    destination?: string | FileSystemFileHandle,
  ) {
    let fileHandle: FileSystemFileHandle
    if (!destination || typeof destination === 'string') {
      fileHandle = await this.file({
        create: true,
        suggestedName: destination,
      })
    }
    else {
      fileHandle = destination
    }

    let inputReadableStream: ReadableStream<Uint8Array>
    if (input instanceof Response) {
      inputReadableStream = input.body!
    }
    else if (input instanceof ReadableStream) {
      inputReadableStream = input
    }
    else if (input instanceof Blob) {
      inputReadableStream = input.stream()
    }
    else if (typeof input === 'string') {
      inputReadableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(input))
        },
      })
    }
    else {
      inputReadableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(input))
        },
      })
    }

    const writableStream = await fileHandle.createWritable()

    await inputReadableStream.pipeTo(writableStream)
  }

  public static async dir(options: DirectoryPickerOptions = {}) {
    const dirHandle = await showDirectoryPicker(options)

    return dirHandle
  }

  public static async verifyPermission(
    handle: FileSystemFileHandle | FileSystemDirectoryHandle,
    withWrite: boolean,
  ) {
    const opts = {} as FileSystemHandlePermissionDescriptor
    if (withWrite) {
      opts.mode = 'readwrite'
    }

    if ((await handle.queryPermission(opts)) === 'granted') {
      return true
    }

    if ((await handle.requestPermission(opts)) === 'granted') {
      return true
    }

    return false
  }
}
