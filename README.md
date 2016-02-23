# GmailChannel
Pub/Sub &amp; Middleware framework for easy dealing with Gmails by Channel

Github: https://github.com/zixia/gas-gmail-channel

Run in Google Apps Script, make life easier to classify and process emails in Gmail.

## How to use GmailChannel

Copy/Paste the following lines into google script editor, then execute it for testing (you need to put the code into a function).

```javascript
var myChannel = new GmailChannel({
  name: 'My Channel'
  , keywords: ['the']
  , labels: ['inbox']
  , limit: 1
  , doneLabel: 'OutOfGmailChannel'
})

myChannel.use(
  firstStep
  , secondStep
  , thirdStep
)

myChannel.done(function(req, res, next) {
  Logger.log('finalize after middlewares')
})


///////////////////////////////////////////////////
function firstStep(req, res, next) {
  Logger.log('Mail Subject: ' 
             + '[' + req.thread.getFirstMessageSubject() + ']')
  req.data = 'This data was set in the firstStep'
  next()
}

function secondStep(req, res, next) {
  Logger.log('Data got by secondStep: '
             + '[' + req.data + ']')
  // NO next() here
}

function thirdStep(req, res,next) {
  throw Error('should not run to here')
}
```

More examples can be found at [unite tests](https://github.com/zixia/gas-gmail-channel/blob/master/src/gas-gmail-channel-tests.js) and source code.

Don't forgot to include GmailChannel library in your code to [enable GmailChannel](#library).

Script editor - https://script.google.com/a/zixia.net/macros/d/Mta4oea1VMIugfSGRo4QrAnKRT9d30hqB/edit?uiv=2&mid=ACjPJvGt4gnXjJwXnToB0jIMEbSvqKUF6vH-uq-m59SqnjXqTQ03NDn_khlNE6ha_mPnrOAYEnyFk80nHYmt_hppO3AgDkO_vVLrYJXzcPPagwRromd0znfLreNFAu4p0rYTC-Jlo-sAKOM

### Channel

`GmailChannel` is defined to filter emails that match specific conditions. After you created a Channel, you can attach `Middleware` to handle emails from that channel.

To create a new GmailChannel, just new one:

```javascript
var myChannel = new GmailChannel({
  name: 'MyTestChannel'
  keywords: ['the', '-abcdefghijilmn']
  , labels: ['inbox', '-trash']
  , limit: 1
  , dayspan: 1
  , doneLabel: 'OutOfGmailChannel'
  , res: {
    data: 'used by middlewares'
  }
})
```

About the parameters of constructor:

1. `name`: String. Channel Name. 
  - DEFAULT: `GmailChannel vVERSION`
1. `keywords`: Array. The keywords that email should include('-keyword' means NOT include). 
  - DEFAULT: `[]`
1. `labels`: Array. The labels that email should be labeled('-label' means NOT labeled).
  - DEFAULT: `['inbox', '-trash']`
1. `conversation`: Bool. if set to `true`, call middlewares for each thread. if set to `false`, call middlewares for each message.
  - DEFAULT: `true` (thread mode)
1. `limit`: Max number of email threads that channel will process. 
  - DEFAULT: `500` (maximum of gmail limitation)
  - if conversation is off(false), limit is still set for threads. that means if we set limit to 1, and the mail message thread has 3 messages, the middleware will loop 3 times.
1. `dayspan`: Only process emails in the past `dayspan` days. 
  - DEFAULT: `365`
  - set to `null` to DISABLE it.
1. `doneLabel`: GmailChannel will only get out the emails without the `doneLabel`, and label them as `doneLabel` after processed them.
  - DEFAULT: `OutOfGmailChannel`
  - set to `null` to DISABLE it
1. `res`: You can set it to anything for later use. This object will be accessable in the middleware as `res` parameter.
  - DEFAULT: `{}`

That's all.

#### `GmailChannel.getName()`

instance method `getName()` will return Channel Name for current instance.

#### `use()`: chain middlewares

`use()` is used to define which middleware function to be used.

the param of use() could be:

1. a single function 
2. a function list
3. a array of functions

all the functions as middleware will be executed in order.

```javascript
myChannel.use(
  function (req, res, next) {
    Logger.log(req.thread.getFirstMessageSubject())
    req.data = 'set'
    next()
  }
  , function (req, res, next) {
    Logger.log('req.data got: ' + req.data)
    // NO next() here
  }
  , function (req, res,next) {
    throw Error('should not run to here')
  }
)
```

#### `done(cb)`: run and finalize

`done(cb)` is used to start run all middlewares, then run a function to finalize(if specified).

The parameter `cb` is optional, should be a middleware function, to finalize the loop. only one parameter is permited.

```javascript
myChannel.done(function(req, res, next) {
  Logger.log('finalize after middlewares')
})
```

### Middleware

`Middleware` is a function that does the work. In GmailChannel, the middleware works very similar like [Express](http://expressjs.com/en/guide/using-middleware.html)(There's also a good article [here](https://stormpath.com/blog/how-to-write-middleware-for-express-apps/)).

```javascript
function (req, res, next) {
  var thread = req.thread
  // deal with emails in thread
  next()
}
```

#### `req.getThread()`: Email thread filtered out by Channel

method `req.getThread()` return a [Class GmailThread](https://developers.google.com/apps-script/reference/gmail/gmail-thread) object in GAS(Google Apps Script).

#### `req.getChannelName()`: Channel Name of req

method `req.getChannelName()` will return the current channel name.

#### `req.getErrors()`: Errors from middlewares

Return a errors array, which used to store middle errors.

If a middleware throws a exception, or called next(err) with `err` param, then the error of exception, or the err param of next function, will be stored in this errors array.

```javascript
myChannel.done(function(req, res, next) {
  var errors = req.getErrors()
  Logger.log('there are '
    + errors.length
    + ' errors total. they are: '
    + errors.join(',')
    + '.'
})
```

#### `res`: User defined variable, usable in all middlewares' functions

`res` is used to store a object that is ready to be used by middlewares. It was initialized when a channel was constructed, and init as a fresh `res` for each gmail message in channel.

"fresh" means that if you change `res`(or it's property) to the other value, it will be reset after this message had been processed. When you start to process the next gmail message, res will be re-inited as it first be defined.

```javascript
var myChannel = new GmailChannel({
  res: {
    data: 'used by middlewares'
  }
})
```

#### `next(err)`: call this to let the middleware chain continue.

If a middleware called `next()`, then the next middleware will be executed after this middleware return, 

If `next()` is not called by a middleware, then the other middlewares will not be executed, they will all be skipped.

If call `next(err)` with a param `err`, the `err` will be treated as a error message, and be stored in a array which can be retrieved by `req.getErrors()`.


## How to enable GmailChannel in your code<a name="library"></a>

Enable GmailChannel by including library from github. Copy/paste the following javascript code into your Code.gs file, then you are set.

```javascript
/**
* GmailChannel - Pub/Sub & Middleware framework for easy dealing with Gmails by Channel
* Github: https://github.com/zixia/gas-gmail-channel
*/
if ((typeof GmailChannel)==='undefined') { // GmailChannel Initialization. (only if not initialized yet.)
  eval(UrlFetchApp.fetch('https://raw.githubusercontent.com/zixia/gas-gmail-channel/master/src/gas-gmail-channel-lib.js').getContentText())
  GmailApp.getAliases() // Require permission
} // Class GmailChannel is ready for use now!
```

### How to run tests?

You can go to my develop environment(read only) to run, and feel free to clone it if you want. Follow this link: https://script.google.com/a/zixia.net/macros/d/Mta4oea1VMIugfSGRo4QrAnKRT9d30hqB/edit?uiv=2&mid=ACjPJvGt4gnXjJwXnToB0jIMEbSvqKUF6vH-uq-m59SqnjXqTQ03NDn_khlNE6ha_mPnrOAYEnyFk80nHYmt_hppO3AgDkO_vVLrYJXzcPPagwRromd0znfLreNFAu4p0rYTC-Jlo-sAKOM, then click `gas-gmail-channel-tests.gs` in file browser on the left.


## Support

The GmailChannel source code repository is hosted on GitHub. There you can file bugs on the issue tracker or submit tested pull requests for review. ( https://github.com/zixia/gas-gmail-channel/issues )

## Version history

### v0.3.0 (February 24, 2015)
* add req.getErrors() to replace req.errors array

### v0.2.0 (December 25, 2015)
* add done(finalizeCallback)
* bug fix
* add document

### v0.1.0 (December 18, 2015)
* Initial commit
* simple unit tests
* express like middleware

-------------------------------------------
© 2015 Zhuohuan LI. GmailChannel is released under APACHE license; see LICENSE for details.
