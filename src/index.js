import {
	formatTime,
	scorm_params,
	deepmerge,
	isFunction,
	inArray,
	scaleNumberBelow,
	isDomElement
} from './utils.js'

const _NoError = {
	"code": "0",
	"string": "No Error",
	"diagnostic": "No Error"
};;
const _GeneralException = {
	"code": "101",
	"string": "General Exception",
	"diagnostic": "General Exception"
};
const _AlreadyInitialized = {
	"code": "103",
	"string": "Already Initialized",
	"diagnostic": "Already Initialized"
};

const defaults_confirm = {
	confirm: false,
	label: "Are you sure you want to quit the program ?"
}

const noOp = function noOp() {}

let ErrorHandler = function(sc) {
	let error = {
		"code": _NoError.code,
		"string": _NoError.string,
		"diagnostic": _NoError.diagnostic
	};
	let api = sc.getApiHandle();
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
}

export default class Scorm {
	constructor(settings = {}, init) {
		this.version = settings.version || null;
		this.initialized = false;
		this.api = null;
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
		this.params = (v) => {
			return scorm_params[this.version][v] || "";
		};
		let result = this.initialize();
		if (result != "true") {
			return false;
		} else {

			window.onunload = (event) => {
				if (!this.finished) {
					this.terminate();
				}
			};
			window.onbeforeunload = (event) => {
				if (!this.finished) {
					this.terminate();
				}
			};

			if (settings.score != null) {
				if (!settings.score.min) settings.score.min = 0;
				this.scoreMin = scaleNumberBelow(settings.score.min, 100);
				this.setValue(this.params('score.min'), settings.score.min);
				if (!settings.score.max) settings.score.max = 100;
				this.scoreMax = scaleNumberBelow(settings.score.max, 100);
				this.setValue(this.params('score.max'), settings.score.max);
			}

			if (isFunction(init)) {
				init(this, result);
			}
		}
	}

	userName() {
		return this.getValue(this.params('name'));
	}

	userId() {
		return this.getValue(this.params('id'));
	}

	/**
	 * bindClose
	 * @description bindClose and close window
	 */
	bindCloseToElement(el, config) {
		let settings = deepmerge(defaults_confirm, config);
		if (isDomElement(el)) {
			el.addEventListener('click', () => {
				let x = true;
				if (settings.confirm) {
					x = false;
					if (confirm(settings.label) == true) {
						x = true;
					} else {
						x = false;
					}
				}
				if (x) {
					let result = this.terminate();
					if (result == "true") {
						window.top.close();
					}
				}
			});
		}
	}

	status(value) {
		let cmi = "";
		switch (this.version) {
			case "1.2":
				cmi = "cmi.core.lesson_status";
				break;
			case "2004":
				cmi = "cmi.completion_status";
				break;
		}
		if (value != null) {
			let values = {
				"1.2": ["not attempted", "completed", "incomplete", "passed", "failed", "browsed"],
				"2004": ["not attempted", "completed", "incomplete", "unknown"]
			};
			let permitedValues = values[this.version];
			if (inArray(permitedValues, value)) {
				return this.setValue(cmi, value);
			} else {
				this.message(_NoError, "status value not supported");
				return;
			}
		} else {
			return this.getValue(cmi);
		}
	}

	score(value) {
		let r = null;
		if (value != null) {
			let scaledScore = 0;
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
	}

	success(v) {
		if (v != null) {
			if (v) {
				if (this.version != "1.2") {
					this.setValue("cmi.success_status", "passed");
				} else {
					this.status("passed");
				}
			} else {
				if (this.version != "1.2") {
					this.setValue("cmi.success_status", "passed");
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
	}

	suspend_data(value) {
		if (value != null) {
			this.storage = deepmerge(this.storage, value);
			this.setValue(this.params('suspend_data'), JSON.stringify(this.storage));
		} else {
			let data = this.getValue(this.params('suspend_data'));
			if (data) {
				this.storage = JSON.parse(data);
			}else{
				this.setValue(this.params('suspend_data'), JSON.stringify(this.storage));
			}
			return this.storage;
		}
	}

	language(value) {
		if (value != null) {
			this.suspend_data({
				lng: value
			});
		} else {
			return this.getValue(this.params("language"));
		}
	}

	location(value) {
		if (value != null) {
			this.setValue(this.params('location'), value);
		}
		return this.getValue(this.params('location'));
	}

	session_time(v) {
		if (this.startTime != null) {
			let sessionTime = new Date().getTime() - this.startTime + this.idleTime;
			if (v != null) {
				if (sessionTime > 1000) {
					this.setValue(this.params('session_time'), formatTime(sessionTime, this.version));
				}
			}
			return formatTime(sessionTime, this.version);
		}
	}

	total_time() {
		return this.getValue(this.params('total_time'));
	}

	initialize() {
		if (this.initialized) return "true";
		let api = this.getApiHandle();
		if (api == null) {
			this.message(_GeneralException, "Unable to locate the LMS's API Implementation.\n" + this.prefix + "Initialize was not successful.");
			return "false";
		}
		let cmd = this.prefix + "Initialize";
		let result = api[cmd]("");
		if (result.toString() != "true") {
			let err = ErrorHandler(this);
			this.message(err, cmd + " failed with error code: " + err.code, "initialize");
		} else {
			this.initialized = true;
			let completionStatus = this.status();
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
	}
	terminate(value) {
		if (!this.initialized) return "true";
		let api = this.getApiHandle();
		let result = "false";
		if (api == null) {
			this.message(_GeneralException, "Unable to locate the LMS's API Implementation.\n" + this.prefix + "Finish was not successful.");
			return "false";
		} else {
			let success = false;
			let exitValue = value;

			if (value != null) {
				if (value === "logout" || value === "normal") {
					if (this.version === "1.2") {
						exitValue = "logout";
					} else {
						exitValue = "normal";
					}
				}
			}

			if (this.completion_status !== "completed" && this.completion_status !== "passed") {
				exitValue = "suspend";
			}


			this.session_time("save");
			success = this.commit();

			// call the LMSFinish function that should be implemented by the API
			let _terminate = noOp;
			let cmd = "Terminate";
			if (this.version === "1.2") {
				if (exitValue != null) success = this.setValue("cmi.core.exit", exitValue);
				cmd = "LMSFinish";
				_terminate = function(v) {
					return api.LMSFinish(v);
				};
			} else {
				if (exitValue != null) success = this.setValue("cmi.exit", exitValue);
				cmd = "Terminate";
				_terminate = function(v) {
					return api.Terminate(v);
				};
			}
			if (success == "true") {
				result = _terminate("");
				if (result.toString() != "true") {
					let err = ErrorHandler(this);
					this.message(err, cmd + " failed with error code: " + err.code, "terminate");
				}
			}
		}

		this.initialized = false;
		if (this.finished != "true") {
			this.finished = result.toString();
		}
		return result.toString();
	}
	getValue(parameter) {
		let api = this.getApiHandle();
		let result = "";
		let cmd = this.prefix + "GetValue";
		if (api == null) {
			this.message(_GeneralException, "Unable to locate the LMS's API Implementation.\nLMSGetValue was not successful.");
		} else if (!this.initialized && !this.initialize()) {
			let err = ErrorHandler(this); // get why initialize() returned false
			this.message(err, cmd + " failed - Could not initialize communication with the LMS - error code: " + err.code);
		} else {
			result = api[cmd](parameter);

			let error = ErrorHandler(this);
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
						// 	this.exit_status = result;
						// 	break;
				}
			}
		}
		return result.toString();
	}
	setValue(parameter, value) {
		let api = this.getApiHandle();
		let result = "false";
		let cmd = this.prefix + "SetValue";
		if (api == null) {
			this.message(_GeneralException, "Unable to locate the LMS's API Implementation.\nLMSSetValue was not successful.");
		} else if (!this.initialized && !this.initialize()) {
			let err = ErrorHandler(this); // get why initialize() returned false
			this.message(err, cmd + " failed - Could not initialize communication with the LMS - error code: " + err.code);
		} else {
			result = api[cmd](parameter, value);
			if (result.toString() != "true") {
				let err = ErrorHandler(this);
				this.message(err, cmd + "(" + parameter + ", " + value + ") failed. \n" + err.code + ": " + err.string, "setValue", parameter);
			} else {
				if (parameter === "cmi.core.lesson_status" || parameter === "cmi.completion_status") {
					this.completion_status = value;
				}
			}
		}

		return result.toString();
	}
	commit() {
		let api = this.getApiHandle();
		let result = "false";
		let cmd = this.prefix + "Commit";
		if (api == null) {
			this.message(_GeneralException, "Unable to locate the LMS's API Implementation.\nLMSCommit was not successful.");
		} else if (!this.initialized && !this.initialize()) {
			let err = ErrorHandler(this); // get why initialize() returned false
			this.message(err, cmd + " failed - Could not initialize communication with the LMS - error code: " + err.code);
		} else {
			result = api[cmd]("");
			if (result != "true") {
				let err = ErrorHandler(this);
				this.message(err, cmd + " failed - error code: " + err.code, "commit");
			}
		}

		return result.toString();
	}
	getLastError() {
		let api = this.getApiHandle();
		if (api == null) {
			//since we can't get the error code from the LMS, return a general error
			return _GeneralException.code; //General Exception
		}
		return api[this.prefix + "GetLastError"]().toString();
	}
	getErrorString(errorCode) {
		let api = this.getApiHandle();
		if (api == null) {
			return _GeneralException.string;
		}
		return api[this.prefix + "GetErrorString"](errorCode).toString();
	}
	getDiagnostic(errorCode) {
		let api = this.getApiHandle();
		if (api == null) {
			return "Unable to locate the LMS's API Implementation. LMSGetDiagnostic was not successful.";
		}
		return api[this.prefix + "GetDiagnostic"](errorCode).toString();
	}
	getApiHandle() {
		if (this.api == null) {
			this.api = this.getApi();
		}
		return this.api;
	}
	findAPI(win) {
		let api = null;
		let findAPITries = 0;
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
				return win.API_1484_11;
			} else if (win.API) {
				this.version = "1.2";
				this.prefix = "LMS";
				return win.API;
			}
		}
		return api;
	}
	getApi() {
		let theAPI = this.findAPI(window);

		if (!theAPI && window.parent && window.parent != window) {
			theAPI = this.findAPI(window.parent);
		}

		if (!theAPI && window.opener && window.opener) {
			theAPI = this.findAPI(window.opener);
		}

		if (!theAPI && window.top && window.top.opener) {
			theAPI = findAPI(window.top.opener);
		}

		//Special handling for Plateau
		if (!theAPI && window.top && window.top.opener && window.top.opener.document) {
			theAPI = findAPI(window.top.opener.document);
		}

		return theAPI;
	}

	//2004 Scorm version related

	findObjective(objId) {
		if (this.version !== "2004") return;
		let num = this.getValue("cmi.objectives._count");
		let objIndex = -1;

		for (let i = 0; i < num; ++i) {
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
	}
	findDataStore(id) {
		if (this.version !== "2004") return;
		let num = this.getValue("adl.data._count");
		let index = -1;

		// if the get value was not null and is a number 
		// in other words, we got an index in the adl.data array
		if (num != null && !isNaN(num)) {
			for (let i = 0; i < num; ++i) {
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
	}
}