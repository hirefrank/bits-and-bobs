# Incentfit Sleep Syncing

This script records the user's sleep duration to [Incentfit](https://incentfit.com) on an ongoing basis. Currently, the script generates a random duration but could be extended to support an API call to a sleep tracking system or external source (e.g. spreadsheet). Inspired by [@dholdren's](https://github.com/dholdren) incentsleep. ;)

## Getting Started

1. Create a new [Google App Script](https://script.google.com/home/my) project with the contents of `Code.gs`.
1. Create the `email`, `password`, and `hour_of_day` (optional) script properties -- see below. (File > Project properties > Script properties)
1. Run the setup function to configure the script to run daily. (Run > Run function > setup)
1. (Optional) Enable Stackdriver Logging. (View > Stackdriver Logging)

## Script Properties

Property name | Value
------------ | -------------
email | **Required.** The user's email address used for authentication on incentfit.com
password | **Required.** The user's password used for authentication on incentfit.com
hour_of_day | Triggers the script at `n` hour of day; 24 hour clock (default: 12)

## Recording Sleep for Multiple Days

Configure the dates in the `bulkRecordSleep` function and then run the function. (Run > Run function > bulkRecordSleep)

```
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
```

## Withings Sleep Sensor Support

In progress.
