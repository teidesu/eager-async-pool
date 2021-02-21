const { createEvent, arrayIterator } = require('../lib/utils')
const { describe, it } = require('mocha')
const { expect } = require('chai')

describe('createEvent', () => {
    it('should return a Promise', () => {
        expect(createEvent()).to.have.instanceOf(Promise)
    })

    it('should resolve itself by calling emit()', (done) => {
        const event = createEvent()
        let resolved = false
        event.then(() => resolved = true)
        event.emit()
        setImmediate(() => {
            expect(resolved).to.eq(true)
            done()
        })
    })
})

describe('arrayIterator', () => {
    it('should not accept non arrays', () => {
        expect(() => arrayIterator({})).to.throw('Not an array!')
    })

    it('should accept Arrays', () => {
        expect(() => arrayIterator([])).not.to.throw('Not an array!')
    })

    it('should act as an iterator for arrays', () => {
        const iter = arrayIterator([1, 2, 3])()
        expect(iter.next()).eql({ done: false, value: 1 })
        expect(iter.next()).eql({ done: false, value: 2 })
        expect(iter.next()).eql({ done: false, value: 3 })
        expect(iter.next()).eql({ done: true })
        expect(iter.next()).eql({ done: true })
    })
})
