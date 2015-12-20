var GmailChannel = (function() {
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

  var testChannel = new GmailChannel({
    keywords: ['the', '-abcdefghijilmn']
    , labels: ['inbox', '-trash']
    , limit: 1
    , doneLabel: 'OutOfGmailChannel'
  })

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
  
  testChannel.done()
  ```
  */

  var VERSION = '0.1.0'
  
  var DEFAULT = {
    name: 'GmailChannel v' + VERSION
    , labels: ['inbox', '-trash']
    , dayspan: '365'   // only check in last 365 days
    , limit: 500       // default max return 999 threads
    , doneLabel: null
    , res: {}
    , keywords: []
  }
  
  /************************************************************************************************
  *
  * Class GmailChannel
  * ------------------
  *
  * @param object optoins
  *    options.name string Channel Name
  *    options.labels array gmail channel labels. default: label:inbox label:unread -label:trash
  *    optoins.keywords array gmail search keywords
  *
  *    options.query string gmail search query string
  *    options.dayspan number newer_than:{{dayspan}}d
  *    options.limit number no more then {{limit}} results
  *
  *    options.doneLabel message labeled with {{doneLabel}} will be ignored
  */
  var GmailChannel = function (options) {
       
    if (!options) throw Error('options must be defined for GmailChannel!')
    
    var dayspan = options.dayspan || DEFAULT.dayspan

    /**
    *
    * 1. if we don't set doneLabel, then it should be the default label name.
    * 2. but if we set it to null, then we will not use doneLabel anymore.
    *
    * so we use "typeof options.doneLabel === 'undefined'" to check if use defined it.
    *
    */
    if ((typeof options.doneLabel)==='undefined') {
      var doneLabel = options.doneLabel || DEFAULT.doneLabel
    } else {
      doneLabel = options.doneLabel
    }
  
    var labels = options.labels || DEFAULT.labels
    var keywords = options.keywords || DEFAULT.keywords
    if (!(labels instanceof Array) || !(keywords instanceof Array)) {
      throw Error('options.keywords or options.labels must be array for GmailChannel!')
    }
  
    var limit = options.limit || DEFAULT.limit
    if (limit%1 !== 0 || limit>500) throw Error('limit must be integer(<500) for GmailChannle! error: limit=' + limit );
  
    var name = options.name || DEFAULT.name
    var res = options.res || DEFAULT.res

    
    /////////////////////////////////////////////////////
    //
    // queryString start building. to filter out email

    // 1. query
    var queryString  = options.query || ''
    // 2. timespan
    queryString += ' ' + 'newer_than:' + dayspan + 'd'
    // 3. -doneLabel
    if (doneLabel) queryString += ' ' + '-label:' + doneLabel
    // 4. keywords
    keywords.forEach(function (k) {
        queryString += ' ' + k
    })
    // 5. labels
    labels.forEach(function (l) {
      if (!l) return // tolearnt empty label
      
      var minusLabel = /^-(.+)$/.exec(l)
      if (minusLabel) {
        queryString += ' ' + '-label:' + minusLabel[1]
      } else {
        queryString += ' ' + 'label:' + l
      }
    })

    // queryString has been built.
    //
    ///////////////////////////////////////////////////////
    

    ///////////////////////////////////////////////////////
    //
    // UPPER_CASE varibles for quota in instance methods

    if (doneLabel) {
      var DONE_LABEL = GmailApp.getUserLabelByName(doneLabel)
      if (!DONE_LABEL) DONE_LABEL = GmailApp.createLabel(doneLabel)
    } else {
      DONE_LABEL = null
    }
  
    var NAME = name
    var LIMIT = limit
    var QUERY_STRING = queryString
    var RES = res
    var MIDDLEWARES = [] // for use() use

    // UPPER_CASE variables set
    //
    ///////////////////////////////////////////////////////
    
    /**
    * Instance of this
    */

    this.use = use
    this.done = done
    
    this.getName = getName
    this.getQueryString = function () { return QUERY_STRING }
    this.getMiddlewares = function () { return MIDDLEWARES }
    
    return this
    

    ////////////////////////////////////////////////////////
    //
    // Instance Methods
    
    function use(middleware) {
            
      if (middleware instanceof Array) return middleware.map(function (m) { return use(m) })
      
      if (!(middleware instanceof Function)) throw Error('must use function(s) for middleware! error[' + middleware + ']')
      
      MIDDLEWARES.push(middleware)
      
      /**
      *
      * in case of use(fn1, fn2....)
      *
      */
      if (arguments.length>1) {
        return Array.prototype.slice.call(arguments, 1).map(function (m) { return use(m) })
      }
      
      return true
    }
    
    function done() {
            
      var mailThreads = getNewThreads(LIMIT)
      
      for (var i=0; i<mailThreads.length; i++) {
        
        var res = RES
        var req = {
          getChannelName: getName
          , getThread: (function (t) { return function () { return t } })(mailThreads[i]) // closure for the furture possible run in nodejs, because of async call back
//          thread: mailThreads[i] // Deprecated
        }        
        
        for (var j=0; j<MIDDLEWARES.length; j++) {
          
          var middleware = MIDDLEWARES[j]
          
          var isNextCalled = false
          
          middleware(req, res, function () {
            isNextCalled = true
          })
          
          if (!isNextCalled) {
            // loop end, because middleware did not call next
            break
          }
          
        } // END for loop of MIDDLEWARES
        
        if (DONE_LABEL) mailThreads[i].addLabel(DONE_LABEL)
        
      } // END for loop of mailThreads 
      
    }
  
    function getName() { return NAME }
    
    /**
    *
    * return arrary[]
    *
    */
    function getNewThreads(limit) {
      
      if (!limit) limit = 500 // 500 is the max number that gmail permit.
      if (!QUERY_STRING) return []
      
      // search for mails
      var threads = GmailApp.search(QUERY_STRING, 0, limit)
      
      return threads
    }
  }
  
  /**
  * Class GmailChannel
  */
  
  GmailChannel.getVersion = getVersion
  
  return GmailChannel
  
  
  ////////////////////////////////////////////////
  //                                           //
  // Class Static Methods                     //
  //                                         //
  ////////////////////////////////////////////
  
  function getVersion() {
    return VERSION
  }
  
}())
