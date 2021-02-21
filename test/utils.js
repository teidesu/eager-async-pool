const sleep = (ms) => new Promise((res) => setTimeout(res, ms))

const expectThrowsAsync = async (method, errorMessage) => {
    let error = null
    try {
        await method()
    }
    catch (err) {
        error = err
    }
    expect(error).to.be.an('Error')
    if (errorMessage) {
        expect(error.message).to.equal(errorMessage)
    }
}


module.exports = {
    sleep,
    expectThrowsAsync
}
