# GmailChannel
Pub/Sub &amp; Middleware framework for easy dealing with Gmails classified by Channel

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
  - DEFAULT: []
1. `labels`: Array. The labels that email should be labeled('-label' means NOT labeled).
  - DEFAULT: ['inbox', '-trash']
1. `limit`: Max number of email threads that channel will process. 
  - DEFAULT: 500(maximum of gmail limitation)
1. `dayspan`: Only process emails in the past `dayspan` days. 
  - DEFAULT: 365
1. `doneLabel`: GmailChannel will only get out the emails without the `doneLabel`, and label them as `doneLabel` after processed them.
  - DEFAULT: `OutOfGmailChannel`
  - set to `null` to DISABLE it
1. `res`: You can set it to anything for later use. This object will be accessable in the middleware as `res` parameter.
  - DEFAULT: {}

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
testChannel.use(
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

#### `done()`: run and finalize

`done()` is used to start run all middlewares, then run a function to finalize(if specified).

the param of done() should be a function, and the params as same as middleware.

```javascript
myChannel.done(function(req, res, next) {
  Logger.log('finalize after middlewares')
})
```

### Middleware

`Middleware` is a functions that do the work. In GmailChannel, the middleware works very similar like it in [Express](http://expressjs.com/en/guide/using-middleware.html)(There's also a good article [here](https://stormpath.com/blog/how-to-write-middleware-for-express-apps/)).

```javascript
function (req, res, next) {
  var thread = req.thread
  // deal with emails in thread
}
```

#### `req.getThread()`: Email thread filtered out by Channel

method `req.getThread()` return a [Class GmailThread](https://developers.google.com/apps-script/reference/gmail/gmail-thread) object in GAS(Google Apps Script).

#### `req.getChannelName()`: Channel Name of req

method `req.getChannelName()` will return the current channel name.

#### `req.errors`: Errors from middlewares

req.errors is a array, which used to store middle errors.

If a middleware throws a exception, or called next(err) with `err` param, then the error of exception, or the err param of next function, will be stored in req.errors.

```javascript
myChannel.done(function(req, res, next) {
  Logger.log('there are '
    + req.errors.length
    + ' errors total. they are: '
    + req.errors.join(',')
    + '.'
})
```

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

## Support

The GmailChannel source code repository is hosted on GitHub. There you can file bugs on the issue tracker or submit tested pull requests for review. ( https://github.com/zixia/gas-gmail-channel/issues )

## Version history

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
