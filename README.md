# eager-async-pool
Simple to use, fully asynchronous and iterable-based async pool for JavaScript and TypeScript. 
Works with native Promises.

## Features
 - Zero dependencies
 - Uses native `Promise` and iterators
 - Supports older environments without native iterators
 - Compatible down to ES3
 - Immediate action after processing an item
 - Cancel tokens

## Quick start
`npm install eager-async-pool` or `yarn add eager-async-pool`

```javascript
const { asyncPool } = require('eager-async-pool')

// exceptionally useful executor
const executor = (n) => 'Number is: ' + n
// absolutely realistic dataset
const items = [1, 2, 3, 4]

for await (const { value, error } of asyncPool(executor, items, { limit: 2 })) {
    if (error) {
        console.error(error)
    } else {
        console.log(value)
    }
}
```

## Usage
### Basic
First, write an executor function, which will do some kind of task:
```javascript
const executor = (url) => fetch(url).then(i => i.text())
```

Then, create an array (or any iterable) that contains the data that will be passed to 
the executor one-by-one:
```javascript
const urls = ['https://google.com', 'https://yandex.ru', 'https://bing.com']
```

Finally, call the `asyncPool` and handle the results!
```javascript
for await (const { idx, item, value, error } of asyncPool(executor, urls)) {
    console.log(`${item} title: ${cheerio.load(value).find('title').text()}`)
}
```

Alternatively, you can use `asyncPoolCallback` that wraps over `asyncPool` and allows
you to specify a callback rather than using `for-await` loop:
```javascript
await asyncPoolCallback(executor, urls, ({ idx, item, value, error }) => {
    console.log(`${item} title: ${cheerio.load(value).find('title').text()}`)
})
```

### Handling errors
Of course, while processing items you may very well encounter some kind of error.
Luckily, it is very easy to handle them with `eager-async-pool`!

When `executor` throws an error, iterator will yield an object containing `.error`, 
which will contain that very error. To retry the failed item, just push it to the array!
```javascript
for await (const { idx, item, value, error } of asyncPool(executor, urls)) {
    if (error) {
        urls.push(item)
        continue
    }
    // ...rest of the logic...
}
```

### Cancelling
`eager-async-pool` also supports cancel tokens. They are extremely easy to use as well.
Just use `CancelToken.source()`, pass the token to `asyncPool` and `.cancel()` when you feel like:
```javascript
const cancel = CancelToken.source()
for await (const { idx, item, value, error } of asyncPool(executor, urls, { cancel: cancel.token })) {
    if (error) {
        cancel.cancel('An error has occurred')
        break
    }
    console.log(`${item} title: ${cheerio.load(value).find('title').text()}`)
}
```

> **Note**: `break` in an iterable `asyncPool` will also effectively cancel the pool,
> but `break` is (for obvious reasons) not available in `asyncPoolCallback`.
> 
> Also, cancel token is compatible with other libraries that support it,
> so you can use it inside executors as well.

> **Note**: cancelling an async pool only guarantees that executor will not be called
> anymore. It DOES NOT cancel pending operations, nor does it ignore them.  
> If you want to cancel pending operations as well, you must handle
> cancel token inside executor manually (or provide it to some library).

### Modern mode
Default exported entrypoint is compatible down to ES3. If your environment supports 
ES6, you can instead use `require('eager-async-pool/modern')`, which exports the same API,
but written using modern JavaScript.

## API
Please see [`index.d.ts`](https://github.com/teidesu/eager-async-pool/blob/master/lib/index.d.ts)

## Motivation
Consider the common task of batch file upload/download.  
You could try to do that using built-in `Promise.all()`, but that's probably not 
the best idea, since it will probably slow down the process and use a lot of resources, 
and server might be limiting concurrent connections.

Also, when downloading you might encounter an error (e.g. rate limit), and you
won't want that error to interrupt the entire download process, and instead you'd want
to retry downloading that particular file.

You may also want to do something immediately after the file is downloaded, and not wait
until all other files are downloaded as well.
