// compatibility stuff
/* istanbul ignore next */
var symbolIterator = typeof Symbol !== 'undefined' && Symbol.iterator !== undefined
    ? Symbol.iterator
    : 'Symbol.iterator'
/* istanbul ignore next */
var symbolAsyncIterator = typeof Symbol !== 'undefined' && Symbol.asyncIterator !== undefined
    ? Symbol.asyncIterator
    : 'Symbol.asyncIterator'

// helper async one-time lock
function createEvent () {
    var emit
    var prom = new Promise(function (resolve) {
        emit = resolve
    })
    prom.emit = emit
    return prom
}


// ponyfill iterator for arrays
function arrayIterator (arr) {
    if (!Array.isArray(arr)) throw new Error('Not an array!')
    var pos = 0

    function next () {
        if (pos < arr.length) {
            return { done: false, value: arr[pos++] }
        }
        return { done: true }
    }

    return function () {
        return { next: next }
    }
}

module.exports = {
    symbolAsyncIterator: symbolAsyncIterator,
    symbolIterator: symbolIterator,
    createEvent: createEvent,
    arrayIterator: arrayIterator
}
