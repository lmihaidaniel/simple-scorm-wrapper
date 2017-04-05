`version 0.1.7`

## Documentation

Javascript API wrapper for Scorm 1.2 and/or Scorm 2004

## Installation

```bash
npm install simple-scorm-wrapper
```

## Usage examples

```javascript
import scorm from 'simple-scorm-wrapper';

let api = new Scorm({
  exitValue: null, //optional use to enforce value sent when the program is terminated
  score: {
    min: 0,
    max: 100
  },
  debugger: function(err, msg, param, value) {
    console.log(err, param, value);
  }
}, function(api, message) {
  //success callback - triggered if the initialization of the LMS apiHandler was successful
  //your program/code logic here
});
```

## Methods

api.exitValue = ""; // force cmi.exit value. Accepts one of these values : "", "normal", "logout", "suspend";