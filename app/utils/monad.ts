// Functions map: a => b
// Functors map with context: Functor(a) => Functor(b)
// Monads flatten (unwrap the value from the context) and map with context: Monad(Monad(a)) => Monad(b)

type FirstInArray<T extends any[]> = T extends [infer F, ...any[]] ? F : never
type LastInArray<T extends any[]> = T extends [...any[], infer L] ? L : never

type NestFn<K extends string | number | symbol> = (...args: any[]) => { [key in K]: NestFn<K> }

type ComposeMonads = <CM extends string | number | symbol>(
  chainMethod: CM,
) => <M extends NestFn<CM>, MS extends Array<M>>(
  ...ms: MS
) => (...args: Parameters<FirstInArray<MS>>) => ReturnType<LastInArray<MS>>

export const composeM: ComposeMonads
  = chainMethod =>
    (...ms) =>
    // @ts-expect-error TODO
      ms.reduce(
        (f, g) =>
        // @ts-expect-error TODO
          (...x) =>
            f(...x)[chainMethod](g),
      )

export const composePromises = composeM('then')

// Example
// const label = 'API call composition';

// // a => Promise(b)
// const getUserById = (id: number) =>
//   Promise.resolve(id === 3 ? { name: 'Kurt', role: 'Author' } : {});

// // b => Promise(c)
// const hasPermission = ({ role }) => Promise.resolve(role === 'Author');

// const log = (t: boolean) => Promise.resolve(t ? label : 'no permission');

// // Compose the functions (this works!)
// const authUser = composePromises(getUserById, hasPermission, log);
// authUser(3).then(console.log); // true
