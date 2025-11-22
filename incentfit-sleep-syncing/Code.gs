/***********************************************************************************
 * INCENTFIT SLEEP SYNCING
 * ---
 * Author: Frank Harris (frank@hirefrank.com)
 * Initial Date: Mar 2, 2019
 * MIT License
 *
 * https://github.com/hirefrank/incentfit-sleep-syncing/blob/master/README.md
 ***********************************************************************************/

var BASE_URL = 'https://webapp.incentfit.com/ajax/ironhide.php';

/**
 * Sets up the time-based trigger and runs the initial sync.
 * ---
 * This should only be run once. Running it more frequently will create multiple
 * triggers. To see the project's triggers: Edit > Current project's triggers
 */

function setup() {
  // if no property override, use the default: 12
  const HOUR_OF_DAY = PropertiesService.getScriptProperties().getProperty('hour_of_day') || 12;
  
  // create the trigger
  // runs at noon in the timezone of the script
  ScriptApp.newTrigger("recordSleep")
    .timeBased()
    .atHour(HOUR_OF_DAY)
    .everyDays(1)
    .create();
  
  // run the initial sync
  recordTodaysSleep();
}

/**
 * Record multiple days of sleep tracking
 */

function bulkRecordSleep() {
  // format is YYYY, MM, DD; 00 is Jan
  var start_date = new Date(2019,00,01); // Jan 1, 2019
  var end_date = new Date(2019,02,01); // March 1, 2019
  
  var d = start_date;
  while (d <= end_date) {
    recordSleep(d);
    Utilities.sleep(5000);
    d.setDate(d.getDate() + 1);
  }  
}

/**
 * Record today's sleep
 */

function recordTodaysSleep() {
  var date = new Date();
  recordSleep(date);
}

/**
 * Record sleep tracking for a given day
 */

function recordSleep(date) {
  var date = date;
  
  // randomly return hours slept between max and min
  // you could replace this with an api call to a 
  // sleep tracking system or external source (e.g. spreadsheet)
  var sleep_max = 8;
  var sleep_min = 6;
  var sleep_hours = Math.floor(Math.random() * (sleep_max - sleep_min) ) + sleep_min;
  
  // assumes today is the activity date
  // you could replace this with an api call to a 
  // sleep tracking system or external source (e.g. spreadsheet)
  var activity_date = formatDate(date);
  
  var params = {                                                                 
    'ts': Date.now(),
    'svc': 'AddActivity%5CAddReportActivity',
    'timezone': 300, // nyc timezone
    'dst': false,
    'hasdst': true,
    'activityTypeID': 74, // the ID for sleep tracking
    'whenOccur': activity_date,
    'IPATS[0][BaseUnitID]': 49, // hours
    'IPATS[0][Value]': sleep_hours,
    'IPATS[0][Title]': '',
  }

  // add sleep activity 
  logIt(params);
  incentfit(params);
}

/**
 * Makes an authenticated Incentfit request and returns the response
 * ---
 * Accepts params for activity date, type, value, etc. Requires authentication
 * via email and password variable declared in the script properties.
 */

function incentfit(params) {  
  // assembles the options
  // sets the headers, method
  var options = {                                                                                                                
    'headers': getHeaders('https://webapp.incentfit.com/add-activity/report-activity?activitytypeid=74', getAuthCookie()),
    'method': 'get',                                                          
    'muteHttpExceptions': true,
  };
  
  // constructs the url, makes the request, returns the response
  var path = Object.keys(params).map(function(key) { return encodeURIComponent(key) + '=' + params[key] }).join('&');
  var url = BASE_URL + '?' + path;

  var response = UrlFetchApp.fetch(url, options);
  logIt(response);
}

/**
 * Return the user's EmployeeIDLong needed for authentication
 */

function getEmployeeIDLong() {
  var form = {                                                                 
    'emailorid': PropertiesService.getScriptProperties().getProperty('email'),
    'cacheoffset': 0,
    'dst': false,
    'featuresetCode': null,
    'hasdst': true,
    'svc': "AuthIdentify",
    'timezone': 300,
    'ts': Date.now(),
  };
    
  // assembles the options
  // sets the headers, method
  var options = {                                                                                                                
    'headers': getHeaders(),
    'payload': form,
    'method': 'post',                                                          
  };
  
  var response = UrlFetchApp.fetch(BASE_URL, options);
  return JSON.parse(response).payload.Individual.EmployeeIDLong;
}

/**
 * Return the user's authentication cookie
 */

function getAuthCookie() {
  var form = {                                                                 
    'emailorid': PropertiesService.getScriptProperties().getProperty('email'),
    'password': PropertiesService.getScriptProperties().getProperty('password'),
    'cacheoffset': 0,
    'dst': false,
    'featuresetCode': null,
    'hasdst': true,
    'svc': "AuthLogin",
    'employeeIDLong': getEmployeeIDLong(),
    'timezone': 300,
    'ts': Date.now(),
  };
  
  // assembles the options
  // sets the headers, method
  var options = {                                                                                                                
    'headers': getHeaders(),
    'payload': form,
    'method': 'post',                                                          
  };
  
  var response = UrlFetchApp.fetch(BASE_URL, options);
  return response.getHeaders()['Set-Cookie'].split(';')[0];
}

/**
 * Assemble the header, spoof user-agent, origin, referer
 */

function getHeaders(referer, cookie) {
  const ORIGIN_URL = 'https://webapp.incentfit.com';
  const REFERER_URL = referer || 'https://webapp.incentfit.com/login';
  const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.119 Safari/537.36';
  
  var headers = {                                                              
    'User-Agent': USER_AGENT,
    'Origin': ORIGIN_URL,
    'Referer': REFERER_URL
  };
  
  if (cookie !==undefined) headers['Cookie'] = cookie;
  return headers;
}

/**
 * Returns the date in an Incentfit friendly format, e.g. YYYY-MM-DD
 */

function formatDate(date) {
  var d = new Date(date),
  month = '' + (d.getMonth() + 1),
  day = '' + d.getDate(),
  year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
}

/**
 * Logs locally and in Stackdriver for debugging
 */

function logIt(msg) {
  Logger.log(msg);
  console.log(msg); // Stackdriver
}
