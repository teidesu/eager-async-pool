import { CancelToken } from './cancel'

export type AsyncPoolExecutor<Input, Result> = (item: Input, idx: number) => Result | Promise<Result>

export interface AsyncPoolYieldItem<Input, Result> {
    idx: number
    item: Input

    // I couldn't think of a more type-safe way. PRs are welcome!
    value?: Result
    error?: Error
}

export type AsyncPoolReturnType<Input, Result> = AsyncIterable<AsyncPoolYieldItem<Input, Result>> & {
    next: Promise<IteratorResult<Result>>
}

export interface AsyncPoolOptions<Input, Result> {
    /**
     * Maximum number of concurrently working executors.
     * Must be positive integer.
     * Defaults to 25
     */
    limit?: number

    /**
     * Optional: cancel token.
     * Can be used to interrupt async pool execution,
     * and can be used inside executor as well.
     */
    cancel?: CancelToken
}

export function asyncPool<Input, Result> (
    executor: AsyncPoolExecutor<Input, Result>,
    iterable: Iterable<Input> | AsyncIterable<Input>,
    options?: AsyncPoolOptions<Input, Result>
): AsyncPoolReturnType<Input, Result>

export function asyncPoolCallback<Input, Result> (
    executor: AsyncPoolExecutor<Input, Result>,
    iterable: Iterable<Input> | AsyncIterable<Input>,
    callback: (item: AsyncPoolYieldItem<Input, Result>) => void,
    options?: AsyncPoolOptions<Input, Result>
): Promise<void>

export * from './cancel'
