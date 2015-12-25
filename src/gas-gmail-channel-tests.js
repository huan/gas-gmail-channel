function gmailChannelTestRunner() {
  'use strict'
  /**
  *
  * GmailChannel - Pub/Sub & Middleware framework for easy dealing with Gmails by Channel
  *
  * GmailChannel provide a easy way to filter out the emails in gmail by search options to a named Channel, 
  * then you could Sub to this Channel, and use Middleware to process them.
  *
  * Github - https://github.com/zixia/gas-gmail-channel
  *
  * Example:
  ```javascript
  if ((typeof GmailChannel)==='undefined') { // GmailChannel Initialization. (only if not initialized yet.)
    eval(UrlFetchApp.fetch('https://raw.githubusercontent.com/zixia/gas-gmail-channel/master/src/gas-gmail-channel-lib.js').getContentText())
  } // Class GmailChannel is ready for use now!

  var myChannel = new GmailChannel({
    name: 'myChannel'
    keywords: ['the']
    , labels: ['inbox']
    , limit: 1
    , doneLabel: 'OutOfGmailChannel'
  })

  myChannel.use(
    function (req, res, next) {
      Logger.log(req.getThread().getFirstMessageSubject())
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
  
  myChannel.done()
  ```
  */
  
  if ((typeof GasTap)==='undefined') { // GasT Initialization. (only if not initialized yet.)
    eval(UrlFetchApp.fetch('https://raw.githubusercontent.com/zixia/gast/master/src/gas-tap-lib.js').getContentText())
  } // Class GasTap is ready for use now!
  
  var test = new GasTap()
  
  if ((typeof GmailChannel)==='undefined') { // GmailChannel Initialization. (only if not initialized yet.)
    eval(UrlFetchApp.fetch('https://raw.githubusercontent.com/zixia/gas-gmail-channel/master/src/gas-gmail-channel-lib.js').getContentText())
  } // Class GmailChannel is ready for use now!

  
  testBasic()
  testMiddleware()
  
  
  return test.finish()
  
  
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
  
  function testBasic() {
    
    test('Query string', function (t) {
      
      var EXPECTED_QUERY_STRING = ' newer_than:1d -label:OutOfGmailChannel 融资申请 最简单的创业计划书 '
      + '-abcdefghijklmnopqrstuvwxyz -label:trash'
      var testChannel = new GmailChannel({
        keywords: [
          '融资申请'
          , '最简单的创业计划书'
          , '-abcdefghijklmnopqrstuvwxyz'
        ]
        , labels: [
          ''
          , '-' + 'trash'
        ]
        , dayspan: '1' 
        , query: ''
        , doneLabel: 'OutOfGmailChannel'
      })
      t.equal(testChannel.getQueryString(), EXPECTED_QUERY_STRING, 'query string built')
      
    })
    
    test('Class Constructor', function (t) {
      var EXPECTED_NAME = 'test channel'
      
      var c = new GmailChannel({
        name: EXPECTED_NAME
      })
      
      t.equal(c.getName(), EXPECTED_NAME, 'set name right')
    })
    
    test('Copy Object', function (t) {
      var SRC_OBJ = {a:1, b:2}
      var DEST_OBJ = {}
      
      GmailChannel.copyKeys(DEST_OBJ, SRC_OBJ)
      
      t.ok(SRC_OBJ!=DEST_OBJ, 'SRC_OBJ is not reference of DEST_OBJ')
      t.deepEqual(SRC_OBJ, DEST_OBJ, 'SRC_OBJ equal to DEST_OBJ')
      
      DEST_OBJ = SRC_OBJ
      t.equal(SRC_OBJ, DEST_OBJ, 'SRC_OBJ is referenceing to DEST_OBJ')
    })
  }
  
  function testMiddleware() {
    test('Middleware chains', function (t) {
      var EXPECTED_MIDDLEWARES_NUM = 3
      var RES_DATA_EXPECTED = 'res data set in constructor'
      var REQ_DATA_EXPECTED = 'req data set set in middleware'
      var RES_DATA_GOTTEN = ''
      var REQ_DATA_GOTTEN = ''

      var EXPECTED_ERROR_NUM = 1
      var EXPECTED_ERROR_MSG = 'error1'
      
      var COUNTER = 0
      var testChannel = new GmailChannel({
        limit: 1
        , res: {
          data: RES_DATA_EXPECTED
        }
      })    
      testChannel.use(
        step1
        , step2
        , step3
      )
      
      function step1(req, res, next) {
        req.data = REQ_DATA_EXPECTED
        COUNTER++;
        next(EXPECTED_ERROR_MSG)
      }
      function step2(req, res, next) {
        REQ_DATA_GOTTEN = req.data
        RES_DATA_GOTTEN = res.data
        COUNTER++;
        // NO next() here!
      }
      function step3(req, res, next) {
        COUNTER++;
        next()
      }
      
      t.equal(testChannel.getMiddlewares().length, EXPECTED_MIDDLEWARES_NUM, 'num of middlewares function is 3')
      
      var errNum, errMsg
      testChannel.done(function (req, res, next) {
        errNum = req.errors.length
        errMsg = req.errors[0]
      })
      t.equal(errNum, EXPECTED_ERROR_NUM, 'finallCallback got middleware error number')
      t.equal(errMsg, EXPECTED_ERROR_MSG, 'finallCallback got middleware error message')
      
      t.equal(COUNTER, 2, '1 next to 2, but 2 not next to 3')
      t.equal(REQ_DATA_GOTTEN, REQ_DATA_EXPECTED, 'req.data right')
      t.equal(RES_DATA_GOTTEN, RES_DATA_EXPECTED, 'res.data right')
      
      COUNTER = 0
      RES_DATA_GOTTEN = ''
      REQ_DATA_GOTTEN = ''
      var c2 = new GmailChannel({
        limit: 1
        , res: {
          data: RES_DATA_EXPECTED
        }
      })    
      var mws = [
        step1
        , step2
        , step3
      ]      
      c2.use(mws)
      t.equal(c2.getMiddlewares().length, EXPECTED_MIDDLEWARES_NUM, 'use(array): num of middlewares function is 3')
      c2.done()
      t.equal(COUNTER, 2, 'use(array): 1 next to 2, but 2 not next to 3')
      t.equal(REQ_DATA_GOTTEN, REQ_DATA_EXPECTED, 'use(array): req.data right')
      t.equal(RES_DATA_GOTTEN, RES_DATA_EXPECTED, 'use(array): res.data right')
      
    })
  }
  
  
}