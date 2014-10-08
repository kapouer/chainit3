# chainit [![Build Status](https://travis-ci.org/vvo/chainit.png)](https://travis-ci.org/vvo/chainit) [![Dependency Status](https://david-dm.org/vvo/chainit.svg?theme=shields.io)](https://david-dm.org/vvo/chainit) [![devDependency Status](https://david-dm.org/vvo/chainit/dev-status.svg?theme=shields.io)](https://david-dm.org/vvo/chainit#info=devDependencies)

[![Selenium Test Status](https://saucelabs.com/browser-matrix/chainitvvo.svg)](https://saucelabs.com/u/chainitvvo)

Turn an asynchronous JavaScript api into an asynchronous
[chainable](http://en.wikipedia.org/wiki/Method_chaining) JavaScript api.

## usage

```js
function MyApi() {}
MyApi.prototype.method1 = function(cb) {cb()}
MyApi.prototype.method2 = function(cb) {cb()}

var chainit = require('chainit');
var MyChainApi = chainit(MyApi);
var obj = new MyChainApi();
obj
  .method1()                      // 1st call
  .method2()                      // 2nd call
  .method1(function(/* args */) { // 3rd call
    this.method1();               // 4th call
  })
  .method2();                     // 5th call
```

## Adding or overriding methods

Adding and overriding methods works at both prototype level and instance level.

You must use `chainit.add(chain, methodName, method)`,
you can't do direct assignation (`chain.methodName = method`) because
`object.observe` is not yet ready.

```js
function MyApi() {}
MyApi.prototype.method1 = function(cb) {cb()}
MyApi.prototype.method2 = function(cb) {cb()}

var chainit = require('chainit');
var MyChainApi = chainit(MyApi);

var obj = new MyChainApi();

// override instance method
chainit.add(obj, 'method1', function(cb) {
  cb()
});

obj
  .method1() // calls the newly added method1
  .method2();

// revert original method
chainit.add(obj, 'method1', MyApi.prototype.method1);

// override prototype method
chainit.add(MyChainApi, 'method1', function(cb) {
  cb()
});

var obj2 = new MyChainApi();

obj2.method1(); // calls the newly chained prototype `method1`
```

## error handling

Upon error, execution is stopped and the nearest callback is called,
or the error is thrown:

```js
obj
  .method1()
  .methodError()
  .notactuallycalled(function(err) {
    // the error that happened in methodError
    // but the method "notactuallycalled" is not called !
    console.error(err);
  });
```

Uncaught errors are also caught and handled the same way - which
adds some safety to the original API.

## features

Features:

* supports async apis
* supports (crazy) nested calls
* supports static and prototype methods
* preserves nested calls order
* preserves context in cb()
* preserves cb(args)
* stops execution on error
* propagates error to the nearest callback
* throws error if no callback is found
* supports process.nextTick(cb)
* supports setTimeout(cb)
* supports methods redifinition
* supports adding new methods
* fully tested! local: `npm install -g mocha && mocha`, saucelabs: `npm test`

## tests

See [tests](test/).

```shell
npm test
```

## examples

See [examples](examples/).

## mixing async/sync apis

There is no easy way to mix sync/async chainable
apis because there is no way to differenciate sync/async calls.

```js
obj
  .asyncMethod()
  .syncMethod()
```

We cannot know that syncMethod is synchronous and that
we do not
need to wait for a callback to be called to continue.

Either your api is fully asynchronous and every method
takes a callback.

Either your api is fully synchronous.
If you want synchronous support, make a pull request
adding `chainit.sync(Constructor)`.

## credits

This module is using [jessetane/queue](https://github.com/jessetane/queue).

A chainable api is queueing methods and reordering calls, so we use a queue.

This module was built to replace the chainable api from
[webdriverjs](https://github.com/camme/webdriverjs).
