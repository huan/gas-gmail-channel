# GmailChannel
Pub/Sub &amp; Middleware framework for easy dealing with Gmails by Channel

Github: https://github.com/zixia/gas-gmail-channel

Run in Google Apps Script, make life easier to classify and process emails in Gmail.

## How to use GmailChannel

Copy/Paste the following lines into google script editor, then execute it for testing (you need to put the code into a function).

```javascript
var theChannel = new GmailChannel({
  keywords: ['the']
  , labels: ['inbox']
  , limit: 1
  , doneLabel: 'OutOfGmailChannel'
})

theChannel.use(
  firstStep
  , secondStep
  , thirdStep
)

theChannel.done()

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

### Channel

`GmailChannel` is created to filter emails that match specific conditions. After you created a Channel, you can attach `Middleware` to handle emails from channel.

### Middleware

`Middleware` is a set of functions that do the work. In GmailChannel, the middleware works very similar as `Express`.

```javascript
function (req, res, next) {
  var thread = req.thread
  // deal with emails in thread
}
```

### `req.thread`: Email thread filtered out by Channel

`req.thread` is a [Class GmailThread](https://developers.google.com/apps-script/reference/gmail/gmail-thread) object in GAS(Google Apps Script).

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

### v0.1.0 (December 18, 2015)
* Initial commit
* simple unit tests
* express like middleware

-------------------------------------------
© 2015 Zhuohuan LI. GmailChannel is released under APACHE license; see LICENSE for details.
