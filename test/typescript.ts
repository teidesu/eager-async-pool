// this file is only tested against compiler and never actually run
import { asyncPool, AsyncPoolExecutor } from '..'

const executor: AsyncPoolExecutor<number, string> = (n) => n + ''

async function main () {
    for await (const result of asyncPool(executor, [1, 2, 3])) {
        if (result.error) {
            const error: Error = result.error
        } else {
            const value: string = result.value!
        }
    }
}

main()
