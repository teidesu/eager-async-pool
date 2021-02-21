/**
 * A `Cancel` is an object that is thrown when an operation is canceled.
 */
export class Cancel {
    constructor (message?: string)

    message: string
}

export interface Canceler {
    (message?: string): void
}

/**
 * A `CancelToken` is an object that can be used to request cancellation of an operation.
 */
export class CancelToken {
    constructor (executor: (cancel: Canceler) => void)

    /**
     * Returns an object that contains a new `CancelToken` and a function that, when called,
     * cancels the `CancelToken`.
     */
    static source (): CancelTokenSource

    promise: Promise<Cancel>
    reason?: Cancel

    /**
     * Throws a `Cancel` if cancellation has been requested.
     */
    throwIfRequested (): void
}

export interface CancelTokenSource {
    token: CancelToken
    cancel: Canceler
}

export function isCancel (obj: any): obj is Cancel
