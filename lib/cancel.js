// this cancel token is fully compatible with axios
// (and it was actually taken from there!)
// https://github.com/axios/axios/blob/master/lib/cancel/CancelToken.js

function Cancel (message) {
    this.message = message
}

Cancel.prototype.toString = function toString () {
    return 'Cancel' + (this.message ? ': ' + this.message : '')
}

Cancel.prototype.__CANCEL__ = true

function isCancel (value) {
    return !!(value && value.__CANCEL__)
}

function CancelToken (executor) {
    if (typeof executor !== 'function') {
        throw new TypeError('executor must be a function.')
    }

    var resolvePromise
    this.promise = new Promise(function promiseExecutor (resolve) {
        resolvePromise = resolve
    })

    var token = this
    executor(function cancel (message) {
        if (token.reason) {
            // Cancellation has already been requested
            return
        }

        token.reason = new Cancel(message)
        resolvePromise(token.reason)
    })
}

CancelToken.prototype.throwIfRequested = function throwIfRequested () {
    if (this.reason) {
        throw this.reason
    }
}

CancelToken.source = function source () {
    var cancel
    var token = new CancelToken(function executor (c) {
        cancel = c
    })
    return {
        token: token,
        cancel: cancel,
    }
}

module.exports = {
    Cancel: Cancel,
    CancelToken: CancelToken,
    isCancel: isCancel
}
