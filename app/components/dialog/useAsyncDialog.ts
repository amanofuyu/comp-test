export class AsyncDialogCloseReason {
  constructor(
    public message: string,
    public next?: 'back',
  ) { }
}

type MaybePromise<T> = T | Promise<T>

interface AsyncDialogProps<P extends any[]> {
  beforeOpen?: (...params: P) => MaybePromise<any>
  afterOpen?: (...params: P) => MaybePromise<any>
}

export function useAsyncDialog<P extends any[] = [], R = any>(props: AsyncDialogProps<P> = {}) {
  const show = ref(false)
  let $resolve: (value: R) => void = () => { }
  let $reject: (reason: any) => void = () => { }

  const close = async (reason?: AsyncDialogCloseReason) => {
    show.value = false
    $reject(reason ?? new AsyncDialogCloseReason('user close'))
  }

  const open = async (...params: P) => {
    const { resolve, reject, promise } = Promise.withResolvers<R>()
    $resolve = resolve
    $reject = reject

    const res = await safe(Promise.resolve(props.beforeOpen?.(...params)))

    if (!res.success) {
      reject(new AsyncDialogCloseReason('error on open', 'back'))
    }
    else {
      show.value = true

      const res = await safe(Promise.resolve(props.afterOpen?.(...params)))

      if (!res.success) {
        close(new AsyncDialogCloseReason('error on open', 'back'))
      }
    }

    return promise
  }

  const submit = async (data: R) => {
    $resolve(data)
    show.value = false
  }

  return {
    show: readonly(show),
    open,
    close,
    submit,
  }
}
