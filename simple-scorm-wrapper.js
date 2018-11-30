/**
 * @name simple-scorm-wrapper
 * @version 0.2.1
 * @description Simple SCORM Wrapper for JavaScript
 * @author lmihaidaniel <lacatusu.mihai.daniel@gmail.com>
 * @license MIT
 */

var Scorm = (function () {
  'use strict';

  var pad = function (num, size) {
    var s = String(num);
    while (s.length < size) { s = "0" + s; }
    return s;
  };

  function isFunction(v) {
    return typeof v === 'function' || false; // avoid IE problems
  }

  function centisecsToISODuration(n, bPrecise) {
    var str = "P";
    var nCs = n;
    var nY = 0,
      nM = 0,
      nD = 0,
      nH = 0,
      nMin = 0;
    n = Math.max(n, 0); // there is no such thing as a negative duration
    var nCs = n;
    // Next set of operations uses whole seconds
    nCs = Math.round(nCs);
    if (bPrecise == true) {
      nD = Math.floor(nCs / 8640000);
    } else {
      nY = Math.floor(nCs / 3155760000);
      nCs -= nY * 3155760000;
      nM = Math.floor(nCs / 262980000);
      nCs -= nM * 262980000;
      nD = Math.floor(nCs / 8640000);
    }
    nCs -= nD * 8640000;
    nH = Math.floor(nCs / 360000);
    nCs -= nH * 360000;
    var nMin = Math.floor(nCs / 6000);
    nCs -= nMin * 6000;
      // Now we can construct string
    if (nY > 0) { str += nY + "Y"; }
    if (nM > 0) { str += nM + "M"; }
    if (nD > 0) { str += nD + "D"; }
    if ((nH > 0) || (nMin > 0) || (nCs > 0)) {
      str += "T";
      if (nH > 0) { str += nH + "H"; }
      if (nMin > 0) { str += nMin + "M"; }
      if (nCs > 0) { str += (nCs / 100) + "S"; }
    }
    if (str == "P") { str = "PT0H0M0S"; }
    // technically PT0S should do but SCORM test suite assumes longer form.
    return str;
  }

  function isDomElement(value) {
    return !!value && typeof value === 'object' && value.nodeType === 1;
  }
  function formatTime(duration, version) {
    if ( version === void 0 ) version = "1.2";

    if (version != "1.2") {
      return centisecsToISODuration(Math.round(duration / 1000) * 100, true);
    } else {
      var milliseconds = parseInt((duration % 1000) / 100),
        seconds = parseInt((duration / 1000) % 60),
        minutes = parseInt((duration / (1000 * 60)) % 60),
        hours = parseInt((duration / (1000 * 60 * 60)) % 24);

      hours = pad(hours, 4);
      minutes = pad(minutes, 2);
      seconds = pad(seconds, 2);

      return hours + ":" + minutes + ":" + seconds + "." + milliseconds;
    }
  }
  function inArray(arr, item) {
    return arr.indexOf(item) > -1;
  }

  var deepmerge = (function() {
    var dp = function(target, src) {
      if (src) {
        var array = Array.isArray(src);
        var dst = array && [] || {};

        if (array) {
          target = target || [];
          dst = dst.concat(target);
          src.forEach(function(e, i) {
            if (typeof dst[i] === 'undefined') {
              dst[i] = e;
            } else if (typeof e === 'object') {
              dst[i] = dp(target[i], e);
            } else {
              if (target.indexOf(e) === -1) {
                dst.push(e);
              }
            }
          });
        } else {
          if (target && typeof target === 'object') {
            Object.keys(target).forEach(function(key) {
              dst[key] = target[key];
            });
          }
          Object.keys(src).forEach(function(key) {
            if (typeof src[key] !== 'object' || !src[key]) {
              dst[key] = src[key];
            } else {
              if (!target[key]) {
                dst[key] = src[key];
              } else {
                dst[key] = dp(target[key], src[key]);
              }
            }
          });
        }
        return dst;
      } else {
        target = target || [];
        return target;
      }
    };
    return dp;
  })();

  var scaleNumberBelow = (function(){
    var sc = function(value, max) {
      if(value > max){
        return sc(value/10, max);
      }else{
        return value;
      }
    };
    return sc;
  })();

  var scorm_params = {
    "1.2": {
      id: "cmi.core.student_id",
      name: "cmi.core.student_name",
      language: "cmi.student_preference.language",
      audio: "cmi.student_preference.audio",
      location: "cmi.core.lesson_location",
      credit: "cmi.core.credit",
      entry: "cmi.core.entry",
      launch_data: "cmi.launch_data",
      lesson_mode: "cmi.core.lesson_mode",
      max_time_allowed: "cmi.student_data.max_time_allowed",
      session_time: "cmi.core.session_time",
      "score.min": "cmi.core.score.min",
      "score.max": "cmi.core.score.max",
      "score.raw": "cmi.core.score.raw",
      "score.scaled": "cmi.core.score.raw",
      suspend_data: "cmi.suspend_data",
      status: "cmi.core.lesson_status",
      total_time: "cmi.core.total_time"
    },
    "2004": {
      id: "cmi.learner_id",
      name: "cmi.learner_name",
      language: "cmi.learner_preference.language",
      audio: "cmi.learner_preference.audio_level",
      location: "cmi.location",
      credit: "cmi.credit",
      entry: "cmi.entry",
      launch_data: "cmi.launch_data",
      lesson_mode: "cmi.mode",
      max_time_allowed: "cmi.max_time_allowed",
      session_time: "cmi.session_time",
      "score.min": "cmi.score.min",
      "score.max": "cmi.score.max",
      "score.raw": "cmi.score.raw",
      "score.scaled": "cmi.score.scaled",
      suspend_data: "cmi.suspend_data",
      status: "cmi.completion_status",
      total_time: "cmi.total_time"
    }
  };

  var _NoError = {
  	"code": "0",
  	"string": "No Error",
  	"diagnostic": "No Error"
  };var _GeneralException = {
  	"code": "101",
  	"string": "General Exception",
  	"diagnostic": "General Exception"
  };

  var defaults_confirm = {
  	confirm: false,
  	label: "Are you sure you want to quit the program ?"
  };

  var exitValues = ["", "normal", "suspend", "logout"];

  var noOp = function noOp() {};

  var ErrorHandler = function(sc) {
  	var error = {
  		"code": _NoError.code,
  		"string": _NoError.string,
  		"diagnostic": _NoError.diagnostic
  	};
  	var api = sc.getApiHandle();
  	if (api == null) {
  		error.code = _GeneralException.code;
  		error.string = _GeneralException.string;
  		error.diagnostic = "Unable to locate the LMS's API Implementation. Cannot determine LMS error code.";
  		sc.message(error, "Unable to locate the LMS's API Implementation.\nCannot determine LMS error code.");
  		return error;
  	}

  	// check for errors caused by or from the LMS
  	error.code = sc.getLastError().toString();
  	if (error.code != _NoError.code) {
  		// an error was encountered so display the error description
  		error.string = sc.getErrorString(error.code);
  		error.diagnostic = sc.getDiagnostic("");
  	}

  	return error;
  };

  var Scorm = function Scorm(settings, init) {
  	var this$1 = this;
  	if ( settings === void 0 ) settings = {};

  	this.version = settings.version || null;
  	if(this.version != null){
  		this.version = this.version.toString();
  	}
  	this.initialized = false;
  	this.api = null;
  	this.exitValue = settings.exitValue || null;
  	this.prefix = "";
  	this.completion_status = null;
  	this.message = settings.debugger || noOp;
  	this.finished = false;
  	this.startTime = new Date().getTime();
  	this.idleTime = 0;
  	this.window = null;
  	this.scoreMin = null;
  	this.scoreMax = null;
  	this.storage = {};
  	this.params = function (v) {
  		return scorm_params[this$1.version][v] || "";
  	};
  	var result = this.initialize();
  	if (result != "true") {
  		if (isFunction(init)) {
  			init.bind(this)(result);
  		}
  		return false;
  	} else {

  		window.onunload = function (event) {
  			if (!this$1.finished) {
  				this$1.terminate();
  			}
  		};
  		window.onbeforeunload = function (event) {
  			if (!this$1.finished) {
  				this$1.terminate();
  			}
  		};

  		if (settings.score != null) {
  			if (!settings.score.min) { settings.score.min = 0; }
  			this.scoreMin = scaleNumberBelow(settings.score.min, 100);
  			this.setValue(this.params('score.min'), settings.score.min);
  			if (!settings.score.max) { settings.score.max = 100; }
  			this.scoreMax = scaleNumberBelow(settings.score.max, 100);
  			this.setValue(this.params('score.max'), settings.score.max);
  		}

  		if (isFunction(init)) {
  			init.bind(this)(result);
  		}

  		return this;
  	}
  };

  Scorm.prototype.userName = function userName () {
  	return this.getValue(this.params('name'));
  };

  Scorm.prototype.userId = function userId () {
  	return this.getValue(this.params('id'));
  };

  /**
  	 * bindClose
  	 * @description bindClose and close window
  	 */
  Scorm.prototype.bindCloseToElement = function bindCloseToElement (el, config) {
  		var this$1 = this;

  	var settings = deepmerge(defaults_confirm, config);
  	if (isDomElement(el)) {
  		el.addEventListener('click', function () {
  			var x = true;
  			if (settings.confirm) {
  				x = false;
  				if (confirm(settings.label) == true) {
  					x = true;
  				} else {
  					x = false;
  				}
  			}
  			if (x) {
  				var result = this$1.terminate();
  				if (result == "true") {
  					window.top.close();
  				}
  			}
  		});
  	}
  };

  Scorm.prototype.status = function status (value) {
  	var cmi = "";
  	switch (this.version) {
  		case "1.2":
  			cmi = "cmi.core.lesson_status";
  			break;
  		case "2004":
  			cmi = "cmi.completion_status";
  			break;
  	}
  	if (value != null) {
  		var values = {
  			"1.2": ["not attempted", "completed", "incomplete", "passed", "failed", "browsed"],
  			"2004": ["not attempted", "completed", "incomplete", "unknown"]
  		};
  		var permitedValues = values[this.version];
  		if (inArray(permitedValues, value)) {
  			return this.setValue(cmi, value);
  		} else {
  			this.message(_NoError, "status value not supported");
  			return;
  		}
  	} else {
  		return this.getValue(cmi);
  	}
  };

  Scorm.prototype.score = function score (value) {
  	var r = null;
  	if (value != null) {
  		var scaledScore = 0;
  		value = scaleNumberBelow(value, 100);
  		if (this.version != "1.2") {
  			scaledScore = ((value - this.scoreMin) / (this.scoreMax - this.scoreMin));
  			this.setValue(this.params('score.raw'), value);
  			this.setValue("cmi.score.scaled", scaledScore);
  		} else {
  			scaledScore = ((value - this.scoreMin) * (100 / (this.scoreMax - this.scoreMin)));
  			this.setValue(this.params('score.raw'), scaledScore);
  		}

  		if (value >= this.scoreMax) {
  			if (this.version != "1.2") {
  				this.setValue("cmi.success_status", "passed");
  			} else {
  				this.status("passed");
  			}
  		}
  	} else {
  		r = parseInt(this.getValue(this.params('score.raw')));
  	}
  	return r;
  };

  Scorm.prototype.success = function success (v) {
  	if (v != null) {
  		if (v) {
  			if (this.version != "1.2") {
  				this.setValue("cmi.success_status", "passed");
  			} else {
  				this.status("passed");
  			}
  		} else {
  			if (this.version != "1.2") {
  				this.setValue("cmi.success_status", "failed");
  			} else {
  				this.status("failed");
  			}
  		}
  	} else {
  		if (this.version != "1.2") {
  			return this.getValue("cmi.success_status");
  		} else {
  			return this.status();
  		}
  	}
  };

  Scorm.prototype.suspend_data = function suspend_data (value) {
  	if (value != null) {
  		this.storage = deepmerge(this.storage, value);
  		this.setValue(this.params('suspend_data'), JSON.stringify(this.storage));
  	} else {
  		var data = this.getValue(this.params('suspend_data'));
  		if (data) {
  			this.storage = JSON.parse(data);
  		}else{
  			this.setValue(this.params('suspend_data'), JSON.stringify(this.storage));
  		}
  		return this.storage;
  	}
  };

  Scorm.prototype.language = function language (value) {
  	if (value != null) {
  		this.suspend_data({
  			lng: value
  		});
  	} else {
  		return this.getValue(this.params("language"));
  	}
  };

  Scorm.prototype.location = function location (value) {
  	if (value != null) {
  		this.setValue(this.params('location'), value);
  	}
  	return this.getValue(this.params('location'));
  };

  Scorm.prototype.session_time = function session_time (v) {
  	if (this.startTime != null) {
  		var sessionTime = new Date().getTime() - this.startTime + this.idleTime;
  		if (v != null) {
  			if (sessionTime > 1000) {
  				this.setValue(this.params('session_time'), formatTime(sessionTime, this.version));
  			}
  		}
  		return formatTime(sessionTime, this.version);
  	}
  };

  Scorm.prototype.total_time = function total_time () {
  	return this.getValue(this.params('total_time'));
  };

  Scorm.prototype.initialize = function initialize () {
  	if (this.initialized) { return "true"; }
  	var api = this.getApiHandle();
  	if (api == null) {
  		this.message(_GeneralException, "Unable to locate the LMS's API Implementation.\n" + this.prefix + "Initialize was not successful.");
  		return "false";
  	}
  	var cmd = this.prefix + "Initialize";
  	var result = api[cmd]("");
  	if (result.toString() != "true") {
  		var err = ErrorHandler(this);
  		this.message(err, cmd + " failed with error code: " + err.code, "initialize");
  	} else {
  		this.initialized = true;
  		var completionStatus = this.status();
  		if (completionStatus) {
  			switch (completionStatus) {
  				//Both SCORM 1.2 and 2004
  				case "not attempted":
  					this.status("incomplete");
  					break;
  					//SCORM 2004 only
  				case "unknown":
  					this.status("incomplete");
  					break;
  					//Additional options, presented here in case you'd like to use them
  					//case "completed"  : break;
  					//case "incomplete" : break;
  					//case "passed"     : break;    //SCORM 1.2 only
  					//case "failed"     : break;    //SCORM 1.2 only
  					//case "browsed"    : break;    //SCORM 1.2 only
  			}
  		}
  	}

  	return result.toString();
  };
  Scorm.prototype.beforeTerminate = function beforeTerminate (){

  };
  Scorm.prototype.terminate = function terminate (value) {
  		if ( value === void 0 ) value = "";

  	if (!this.initialized) { return "true"; }
  	var api = this.getApiHandle();
  	var result = "false";
  	if (api == null) {
  		this.message(_GeneralException, "Unable to locate the LMS's API Implementation.\n" + this.prefix + "Finish was not successful.");
  		return "false";
  	} else {
  		var success = false;
  		var exitValue = value;

  		if (value === "logout" || value === "normal") {
  			if (this.version === "1.2") {
  				exitValue = "logout";
  			} else {
  				exitValue = "normal";
  			}
  		}

  		if (this.completion_status !== "completed" && this.completion_status !== "passed") {
  			exitValue = "suspend";
  		}

  		if(inArray(exitValues,this.exitValue)) { exitValue = this.exitValue; }

  		this.session_time("save");
  		if(isFunction(this.beforeTerminate)){
  			this.beforeTerminate();
  		}
  		success = this.commit();

  		// call the LMSFinish function that should be implemented by the API
  		var _terminate = noOp;
  		var cmd = "Terminate";
  		if (this.version === "1.2") {
  			success = this.setValue("cmi.core.exit", exitValue);
  			cmd = "LMSFinish";
  			_terminate = function(v) {
  				return api.LMSFinish(v);
  			};
  		} else {
  			success = this.setValue("cmi.exit", exitValue);
  			cmd = "Terminate";
  			_terminate = function(v) {
  				return api.Terminate(v);
  			};
  		}
  		if (success == "true") {
  			result = _terminate("");
  			if (result.toString() != "true") {
  				var err = ErrorHandler(this);
  				this.message(err, cmd + " failed with error code: " + err.code, "terminate");
  			}
  		}
  	}

  	this.initialized = false;
  	if (this.finished != "true") {
  		this.finished = result.toString();
  	}
  	return result.toString();
  };
  Scorm.prototype.getValue = function getValue (parameter) {
  	var api = this.getApiHandle();
  	var result = "";
  	var cmd = this.prefix + "GetValue";
  	if (api == null) {
  		this.message(_GeneralException, "Unable to locate the LMS's API Implementation.\nLMSGetValue was not successful.");
  	} else if (!this.initialized && !this.initialize()) {
  		var err = ErrorHandler(this); // get why initialize() returned false
  		this.message(err, cmd + " failed - Could not initialize communication with the LMS - error code: " + err.code);
  	} else {
  		result = api[cmd](parameter);

  		var error = ErrorHandler(this);
  		if (error.code != _NoError.code) {
  			// an error was encountered so display the error description
  			this.message(error, cmd + "(" + parameter + ") failed. \n" + error.code + ": " + error.string, "getValue", parameter);
  			result = "";
  		} else {
  			switch (parameter) {
  				case "cmi.core.lesson_status":
  				case "cmi.completion_status":
  					this.completion_status = result;
  					break;
  					// case "cmi.core.exit":
  					// case "cmi.exit":
  					// this.exit_status = result;
  					// break;
  			}
  		}
  	}
  	return result.toString();
  };
  Scorm.prototype.setValue = function setValue (parameter, value) {
  	var api = this.getApiHandle();
  	var result = "false";
  	var cmd = this.prefix + "SetValue";
  	if (api == null) {
  		this.message(_GeneralException, "Unable to locate the LMS's API Implementation.\nLMSSetValue was not successful.");
  	} else if (!this.initialized && !this.initialize()) {
  		var err = ErrorHandler(this); // get why initialize() returned false
  		this.message(err, cmd + " failed - Could not initialize communication with the LMS - error code: " + err.code);
  	} else {
  		result = api[cmd](parameter, value);
  		if (result.toString() != "true") {
  			var err$1 = ErrorHandler(this);
  			this.message(err$1, cmd + "(" + parameter + ", " + value + ") failed. \n" + err$1.code + ": " + err$1.string, "setValue", parameter);
  		} else {
  			if (parameter === "cmi.core.lesson_status" || parameter === "cmi.completion_status") {
  				this.completion_status = value;
  			}
  		}
  	}

  	return result.toString();
  };
  Scorm.prototype.commit = function commit () {
  	var api = this.getApiHandle();
  	var result = "false";
  	var cmd = this.prefix + "Commit";
  	if (api == null) {
  		this.message(_GeneralException, "Unable to locate the LMS's API Implementation.\nLMSCommit was not successful.");
  	} else if (!this.initialized && !this.initialize()) {
  		var err = ErrorHandler(this); // get why initialize() returned false
  		this.message(err, cmd + " failed - Could not initialize communication with the LMS - error code: " + err.code);
  	} else {
  		result = api[cmd]("");
  		if (result != "true") {
  			var err$1 = ErrorHandler(this);
  			this.message(err$1, cmd + " failed - error code: " + err$1.code, "commit");
  		}
  	}

  	return result.toString();
  };
  Scorm.prototype.getLastError = function getLastError () {
  	var api = this.getApiHandle();
  	if (api == null) {
  		//since we can't get the error code from the LMS, return a general error
  		return _GeneralException.code; //General Exception
  	}
  	return api[this.prefix + "GetLastError"]().toString();
  };
  Scorm.prototype.getErrorString = function getErrorString (errorCode) {
  	var api = this.getApiHandle();
  	if (api == null) {
  		return _GeneralException.string;
  	}
  	return api[this.prefix + "GetErrorString"](errorCode).toString();
  };
  Scorm.prototype.getDiagnostic = function getDiagnostic (errorCode) {
  	var api = this.getApiHandle();
  	if (api == null) {
  		return "Unable to locate the LMS's API Implementation. LMSGetDiagnostic was not successful.";
  	}
  	return api[this.prefix + "GetDiagnostic"](errorCode).toString();
  };
  Scorm.prototype.getApiHandle = function getApiHandle () {
  	if (this.api == null) {
  		this.api = this.getApi();
  	}
  	return this.api;
  };
  Scorm.prototype.findAPI = function findAPI (win) {
  	var api = null;
  	var findAPITries = 0;
  	while ((!win.API && !win.API_1484_11) &&
  		(win.parent) &&
  		(win.parent != win) &&
  		(findAPITries <= 500)) {
  		findAPITries++;
  		win = win.parent;
  	}
  	this.window = win;
  	if (win.API_1484_11 != null && win.API != null && this.version != null) {
  		if (this.version == "1.2") {
  			this.prefix = "LMS";
  			api = win.API;
  		}
  		if (this.version == "2004") {
  			this.prefix = "";
  			api = win.API_1484_11;
  		}
  	} else {
  		if (win.API_1484_11) {
  			this.version = "2004";
  			this.prefix = "";
  			api = win.API_1484_11;
  		} else if (win.API) {
  			this.version = "1.2";
  			this.prefix = "LMS";
  			api = win.API;
  		}
  	}
  	return api;
  };
  Scorm.prototype.getApi = function getApi () {
  	var theAPI = this.findAPI(window);

  	if (!theAPI && window.parent && window.parent != window) {
  		theAPI = this.findAPI(window.parent);
  	}

  	if (!theAPI && window.opener && window.opener) {
  		theAPI = this.findAPI(window.opener);
  	}

  	if (!theAPI && window.top && window.top.opener) {
  		theAPI = this.findAPI(window.top.opener);
  	}

  	//Special handling for Plateau
  	if (!theAPI && window.top && window.top.opener && window.top.opener.document) {
  		theAPI = this.findAPI(window.top.opener.document);
  	}

  	return theAPI;
  };

  //2004 Scorm version related

  Scorm.prototype.findObjective = function findObjective (objId) {
  	if (this.version !== "2004") { return; }
  	var num = this.getValue("cmi.objectives._count");
  	var objIndex = -1;

  	for (var i = 0; i < num; ++i) {
  		if (this.getValue("cmi.objectives." + i + ".id") == objId) {
  			objIndex = i;
  			break;
  		}
  	}

  	if (objIndex == -1) {
  		this.message(_GeneralException, "Objective " + objId + " not found.");
  		objIndex = num;
  		this.message(_GeneralException, "Creating new objective at index " + objIndex);
  		this.setValue("cmi.objectives." + objIndex + ".id", objId);
  	}
  	return objIndex;
  };
  /**
  	 * [findDataStore description]
  	 * @param  {[string]} id [description]
  	 * @return {[integer]}    [data store index]
  	 */
  Scorm.prototype.findDataStore = function findDataStore (id) {
  	if (this.version !== "2004") { return; }
  	var num = this.getValue("adl.data._count");
  	var index = -1;

  	// if the get value was not null and is a number
  	// in other words, we got an index in the adl.data array
  	if (num != null && !isNaN(num)) {
  		for (var i = 0; i < num; ++i) {
  			if (this.getValue("adl.data." + i + ".id") == id) {
  				index = i;
  				break;
  			}
  		}

  		if (index == -1) {
  			this.message(_GeneralException, "Data store " + id + " not found.");
  		}
  	}

  	return index;
  };

  return Scorm;

}());
