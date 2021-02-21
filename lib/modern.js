const {
    symbolAsyncIterator,
    symbolIterator,
    arrayIterator,
    createEvent,
} = require('./utils')

function asyncPool (executor, iterable, options = {}) {
    const { limit = 25, cancel = null } = options
    if (limit <= 0) throw new Error('Pool limit must be a positive integer')

    let iteratorFactory = iterable[symbolIterator] || iterable[symbolAsyncIterator]
    /* istanbul ignore next */
    if (!iteratorFactory && Array.isArray(iterable)) iteratorFactory = arrayIterator(iterable)
    if (!iteratorFactory) throw new Error('`iterable` must be iterable or array!')
    const iterator = iteratorFactory.call(iterable)

    let idx = 0
    let iteratorNext = null
    let working = 0
    let buffer = []
    let bufferHasItems = createEvent()

    function startNext () {
        let currentIdx = idx++
        const it = iteratorNext.value
        let prom = Promise.resolve(executor(it, currentIdx))
        working += 1
        prom.then((res) => {
            buffer.push({ idx: currentIdx, item: it, value: res })
        }).catch((err) => {
            buffer.push({ idx: currentIdx, item: it, error: err })
        }).then(() => {
            working -= 1
            bufferHasItems.emit()
        })
    }

    async function next () {
        /* istanbul ignore if */
        if (buffer.length)
            return { done: false, value: buffer.shift() }
        if (working === 0 && (iteratorNext && iteratorNext.done || cancel && cancel.reason))
            return { done: true }

        while (working !== limit && !(iteratorNext && iteratorNext.done || cancel && cancel.reason)) {
            iteratorNext = await iterator.next()

            if (!iteratorNext.done) {
                startNext()
            }
        }
        await bufferHasItems
        bufferHasItems = createEvent()
        return { done: false, value: buffer.shift() }
    }

    return {
        next,
        [Symbol.asyncIterator]: () => ({ next })
    }
}

async function asyncPoolCallback (executor, iterable, callback, options) {
    for await (const result of asyncPool(executor, iterable, options)) {
        callback(result)
    }
}

module.exports = {
    asyncPool,
    asyncPoolCallback,
    ...require('./cancel')
}
