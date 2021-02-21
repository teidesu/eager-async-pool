import { CancelToken } from './cancel'

/**
 * Function that is passed to the async pool that does some kind of job.
 *
 * @param item  Item from a dataset that this instance of executor should work on
 * @param idx  Index in array (or sequence number of an iterable) of `item`
 */
export type AsyncPoolExecutor<Input, Result> = (item: Input, idx: number) => Result | Promise<Result>

/**
 * Object that is yielded from `asyncPool` and is provided to `asyncPoolCallback` callback.
 */
export interface AsyncPoolYieldItem<Input, Result> {
    /**
     * Index in array (or sequence number of an iterable) of `item`
     */
    idx: number
    /**
     * Original item from dataset that was passed to the executor.
     * In case of arrays, `inputArray[idx] === item`
     */
    item: Input

    // I couldn't think of a more type-safe way. PRs are welcome!
    /**
     * Result of executor's work. Either `value` or `error` is always present.
     */
    value?: Result
    /**
     * Error that occurred during execution.
     */
    error?: Error
}

/**
 * Type that the async pool returns.
 * Is an async iterable, and also contains `.next()` function
 * for simpler use as a raw iterable
 */
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

/**
 * The async pool.
 *
 * @param executor  Executor for the pool
 * @param iterable  Dataset from which the items will be taken
 * @param options  Options for the pool
 */
export function asyncPool<Input, Result> (
    executor: AsyncPoolExecutor<Input, Result>,
    iterable: Iterable<Input> | AsyncIterable<Input>,
    options?: AsyncPoolOptions<Input, Result>
): AsyncPoolReturnType<Input, Result>

/**
 * Wrapper over `asyncPool`, that instead calls `callback`
 * every time executor returned something
 *
 * @param executor  Executor for the pool
 * @param iterable  Dataset from which the items will be taken
 * @param callback  Callback which will be called for every result
 * @param options  Options for the pool
 */
export function asyncPoolCallback<Input, Result> (
    executor: AsyncPoolExecutor<Input, Result>,
    iterable: Iterable<Input> | AsyncIterable<Input>,
    callback: (item: AsyncPoolYieldItem<Input, Result>) => void,
    options?: AsyncPoolOptions<Input, Result>
): Promise<void>

export * from './cancel'
