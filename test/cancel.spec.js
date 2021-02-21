// this only covers basic Cancel interface and not pool's interaction with it
// mostly taken from axios
const { isCancel, Cancel, CancelToken } = require('..')
const { describe, it } = require('mocha')
const { expect } = require('chai')


describe('Cancel', function () {
    describe('toString', function () {
        it('returns correct result when message is not specified', function () {
            const cancel = new Cancel()
            expect(cancel.toString()).eq('Cancel')
        })

        it('returns correct result when message is specified', function () {
            const cancel = new Cancel('Operation has been canceled.')
            expect(cancel.toString()).eq('Cancel: Operation has been canceled.')
        })
    })
})

describe('CancelToken', function () {
    describe('constructor', function () {
        it('throws when executor is not specified', function () {
            expect(function () {
                new CancelToken()
            }).to.throw('executor must be a function.')
        })

        it('throws when executor is not a function', function () {
            expect(function () {
                new CancelToken(123)
            }).to.throw('executor must be a function.')
        })
    })

    describe('reason', function () {
        it('returns a Cancel if cancellation has been requested', function () {
            let cancel
            const token = new CancelToken(function (c) {
                cancel = c
            })
            cancel('Operation has been canceled.')
            expect(token.reason).to.have.instanceOf(Cancel)
            expect(token.reason.message).eq('Operation has been canceled.')
        })

        it('returns first Cancel if cancellation has been requested more than once', function () {
            let cancel
            const token = new CancelToken(function (c) {
                cancel = c
            })
            cancel('Operation has been canceled.')
            cancel('Operation has been canceled for the second time.')
            expect(token.reason).to.have.instanceOf(Cancel)
            expect(token.reason.message).eq('Operation has been canceled.')
        })

        it('returns undefined if cancellation has not been requested', function () {
            const token = new CancelToken(function () {
            })
            expect(token.reason).to.be.undefined
        })
    })

    describe('promise', function () {
        it('returns a Promise that resolves when cancellation is requested', function (done) {
            let cancel
            const token = new CancelToken(function (c) {
                cancel = c
            })
            token.promise.then(function onFulfilled (value) {
                expect(token.reason).to.have.instanceOf(Cancel)
                expect(token.reason.message).eq('Operation has been canceled.')
                done()
            })
            cancel('Operation has been canceled.')
        })
    })

    describe('throwIfRequested', function () {
        it('throws if cancellation has been requested', function () {
            // Note: we cannot use expect.toThrowError here as Cancel does not inherit from Error
            let cancel
            const token = new CancelToken(function (c) {
                cancel = c
            })
            cancel('Operation has been canceled.')
            try {
                token.throwIfRequested()
                throw new Error('Expected throwIfRequested to throw.')
            } catch (thrown) {
                if (!(thrown instanceof Cancel)) {
                    throw new Error('Expected throwIfRequested to throw a Cancel, but it threw ' + thrown + '.')
                }
                expect(thrown.message).eq('Operation has been canceled.')
            }
        })

        it('does not throw if cancellation has not been requested', function () {
            const token = new CancelToken(function () {
            })
            token.throwIfRequested()
        })
    })

    describe('source', function () {
        it('returns an object containing token and cancel function', function () {
            const source = CancelToken.source()
            expect(source.token).to.have.instanceOf(CancelToken)
            expect(source.cancel).to.have.instanceOf(Function)
            expect(source.token.reason).to.be.undefined
            source.cancel('Operation has been canceled.')
            expect(source.token.reason).to.have.instanceOf(Cancel)
            expect(source.token.reason.message).eq('Operation has been canceled.')
        })
    })
})

describe('isCancel', function () {
    it('returns true if value is a Cancel', function () {
        expect(isCancel(new Cancel())).eq(true)
    })

    it('returns true if value is like Cancel', function () {
        expect(isCancel({ __CANCEL__: true })).eq(true)
    })

    it('returns false if value is not a Cancel', function () {
        expect(isCancel({ foo: 'bar' })).eq(false)
    })
})
