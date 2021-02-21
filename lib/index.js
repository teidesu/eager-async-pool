var utils = require('./utils')

function asyncPool (executor, iterable, options) {
    if (!options) options = {}

    var limit = options.limit || 25
    var cancel = options.cancel || null
    if (limit <= 0) throw new Error('Pool limit must be a positive integer')

    var iteratorFactory = iterable[utils.symbolIterator] || iterable[utils.symbolAsyncIterator]
    /* istanbul ignore next */
    if (!iteratorFactory && Array.isArray(iterable)) iteratorFactory = utils.arrayIterator(iterable)
    if (!iteratorFactory) throw new Error('`iterable` must be iterable or array!')
    var iterator = iteratorFactory.call(iterable)

    var idx = 0
    var iteratorNext = null
    var working = 0
    var buffer = []
    var bufferHasItems = utils.createEvent()

    function startNext () {
        var currentIdx = idx++
        var it = iteratorNext.value
        var prom = Promise.resolve(executor(it, currentIdx))
        working += 1
        prom.then(function (res) {
            buffer.push({ idx: currentIdx, item: it, value: res })
        }).catch(function (err) {
            buffer.push({ idx: currentIdx, item: it, error: err })
        }).then(function () {
            working -= 1
            bufferHasItems.emit()
        })
    }

    function next () {
        /* istanbul ignore if */
        if (buffer.length)
            return Promise.resolve({ done: false, value: buffer.shift() })
        if (working === 0 && (iteratorNext && iteratorNext.done || cancel && cancel.reason))
            return Promise.resolve({ done: true })

        function handleNext () {
            if (!(working !== limit && !(iteratorNext && iteratorNext.done || cancel && cancel.reason)))
                return Promise.resolve()

            return Promise.resolve(iterator.next())
                .then(function (result) {
                    iteratorNext = result

                    if (!iteratorNext.done) {
                        startNext()
                    }

                    return handleNext()
                })
        }

        return (working !== limit && !(iteratorNext && iteratorNext.done || cancel && cancel.reason)
            ? handleNext()
            : Promise.resolve()
        )
            .then(function () {
                return bufferHasItems
            })
            .then(function () {
                bufferHasItems = utils.createEvent()
                return { done: false, value: buffer.shift() }
            })
    }

    var ret = { next: next }
    ret[utils.symbolAsyncIterator] = function () {
        return { next: next }
    }
    return ret
}

function asyncPoolCallback (executor, iterable, callback, options) {
    return new Promise(function (resolve, reject) {
        var factory = asyncPool(executor, iterable, options)

        function handleNext () {
            factory.next()
                .then(function (result) {
                    if (result.done) {
                        return resolve()
                    }

                    callback(result.value)
                    handleNext()
                })
                .catch(reject)
        }

        handleNext()
    })
}

var cancel = require('./cancel')

module.exports = {
    asyncPool: asyncPool,
    asyncPoolCallback: asyncPoolCallback,
    CancelToken: cancel.CancelToken,
    Cancel: cancel.Cancel,
    isCancel: cancel.isCancel
}
