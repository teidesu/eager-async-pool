const { CancelToken, asyncPool, asyncPoolCallback } = require('../lib')
const modern = require('../lib/modern')
const { sleep, expectThrowsAsync } = require('./utils')
const { describe, it } = require('mocha')
const { expect } = require('chai')

const test = {
    invalidLimit1: {
        items: [],
        expected: [],
        options: () => ({ limit: 0 })
    },
    invalidLimit2: {
        items: [],
        expected: [],
        options: () => ({ limit: -5 })
    },
    invalidIterable: {
        rawItems: true,
        items: {},
        expected: {}
    },
    noOptions: {
        rawOptions: true,
        items: [...Array(26)].map((_, i) => i),
        expected: [
            ...[...Array(25)].map((_, i) => ({ type: 'start', value: i, idx: i })),
            { type: 'result', item: 0, value: 0, idx: 0 },
            { type: 'start', value: 25, idx: 25 },
            ...[...Array(25)].map((_, i) => ({ type: 'result', item: i + 1, value: i + 1, idx: i + 1 })),
            { type: 'finish' }
        ]
    },

    base: {
        items: [100, 200, 300, 100, 100, 300],
        expected: [
            { type: 'start', value: 100, idx: 0 },
            { type: 'start', value: 200, idx: 1 },
            { type: 'result', item: 100, value: 100, idx: 0 },
            { type: 'start', value: 300, idx: 2 },
            { type: 'result', item: 200, value: 200, idx: 1 },
            { type: 'start', value: 100, idx: 3 },
            { type: 'result', item: 100, value: 100, idx: 3 },
            { type: 'start', value: 100, idx: 4 },
            { type: 'result', item: 300, value: 300, idx: 2 },
            { type: 'start', value: 300, idx: 5 },
            { type: 'result', item: 100, value: 100, idx: 4 },
            { type: 'result', item: 300, value: 300, idx: 5 },
            { type: 'finish' },
        ],
    },
    withError: {
        items: [100, 200, 300, 100],
        expected: [
            { type: 'start', value: 100, idx: 0 },
            { type: 'start', value: 200, idx: 1 },
            { type: 'result', item: 100, value: 100, idx: 0 },
            { type: 'start', value: 300, idx: 2 },
            { type: 'error', item: 300, idx: 2, message: '300 not supported' },
            { type: 'start', value: 100, idx: 3 },
            { type: 'result', item: 200, value: 200, idx: 1 },
            { type: 'result', item: 100, value: 100, idx: 3 },
            { type: 'finish' },
        ],
        onBeforeSleep: (i) => {
            if (i === 300) {
                throw new Error('300 not supported')
            }
        },
    },
    withRetryOnError: {
        items: [100, 200, 300, 100],
        expected: [
            { type: 'start', value: 100, idx: 0 },
            { type: 'start', value: 200, idx: 1 },
            { type: 'result', item: 100, value: 100, idx: 0 },
            { type: 'start', value: 300, idx: 2 },
            { type: 'error', item: 300, idx: 2, message: '300 not supported' },
            { type: 'enqueue', item: 310 },
            { type: 'start', value: 100, idx: 3 },
            { type: 'result', item: 200, value: 200, idx: 1 },
            { type: 'start', value: 310, idx: 4 },
            { type: 'result', item: 100, value: 100, idx: 3 },
            { type: 'result', item: 310, value: 310, idx: 4 },
            { type: 'finish' },
        ],
        onBeforeSleep: (i) => {
            if (i === 300) {
                throw new Error('300 not supported')
            }
        },
        onError: (res, log, items) => {
            log.push({ type: 'enqueue', item: 310 })
            items.push(310)
        },
    },
    withCancelOnError: {
        items: [100, 200, 300, 100],
        expected: [
            { type: 'start', value: 100, idx: 0 },
            { type: 'start', value: 200, idx: 1 },
            { type: 'result', item: 100, value: 100, idx: 0 },
            { type: 'start', value: 300, idx: 2 },
            { type: 'error', item: 300, idx: 2, message: '300 not supported' },
            { type: 'cancel' },
            { type: 'result', item: 200, value: 200, idx: 1 },
            { type: 'finish' },
        ],
        onBeforeSleep: (i) => {
            if (i === 300) {
                throw new Error('300 not supported')
            }
        },
        onError: (res, log, items, src) => {
            log.push({ type: 'cancel' })
            src.cancel()
        },
        hasCancel: true,
    },
}

function createTest_ (obj, runner) {
    return async () => {
        const log = []
        const items = obj.rawItems ? obj.items : [...obj.items]
        const options = obj.rawOptions ? obj.options : { limit: 2, ...(obj.options && obj.options() || {}) }

        const cancelSource = obj.hasCancel ? CancelToken.source() : null
        if (cancelSource) options.cancel = cancelSource.token

        const executor = async (i, idx) => {
            log.push({ type: 'start', value: i, idx })
            if (obj.onBeforeSleep) await obj.onBeforeSleep(i, idx)
            await sleep(i)
            if (obj.onAfterSleep) await obj.onAfterSleep(i, idx)
            return i
        }

        const callback = (result) => {
            if (result.error) {
                log.push({ type: 'error', idx: result.idx, item: result.item, message: result.error.message })
                if (obj.onError) obj.onError(result, log, items, cancelSource)
            } else {
                log.push({ type: 'result', ...result })
            }
        }

        await runner(executor, items, callback, options)

        log.push({ type: 'finish' })
        expect(log).eql(obj.expected)
    }
}

function createTestCase (name, createTest) {
    describe(name, () => {
        describe('parameters', () => {
            it('should throw an error when limit is non-positive', () => {
                expectThrowsAsync(createTest(test.invalidLimit1), 'Pool limit must be a positive integer')
                expectThrowsAsync(createTest(test.invalidLimit2), 'Pool limit must be a positive integer')
            })

            it('should throw an error when iterable is not iterable', () => {
                expectThrowsAsync(createTest(test.invalidIterable), '`iterable` must be iterable or array!')
            })

            it('should fall back to default options when non are passed', createTest(test.noOptions))
        })

        it('should process items in a pool-like manner', createTest(test.base))
        it('should handle errors by yielding object with error', createTest(test.withError))
        it('should support retrying by pushing to items', createTest(test.withRetryOnError))
        it('should support cancelling execution', createTest(test.withCancelOnError))
    })
}

createTestCase(
    'asyncPool',
    (obj) => createTest_(obj, async (executor, items, callback, options) => {
        for await (const result of asyncPool(executor, items, options)) {
            callback(result)
        }
    }),
)

createTestCase(
    'asyncPool modern',
    (obj) => createTest_(obj, async (executor, items, callback, options) => {
        for await (const result of modern.asyncPool(executor, items, options)) {
            callback(result)
        }
    }),
)

createTestCase(
    'asyncPoolCallback',
    (obj) => createTest_(obj, asyncPoolCallback)
)

createTestCase(
    'asyncPoolCallback modern',
    (obj) => createTest_(obj, modern.asyncPoolCallback)
)
