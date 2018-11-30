const pad = (num, size) => {
  let s = String(num);
  while (s.length < size) s = `0${s}`;
  return s;
};

export function isFunction(v) {
  return typeof v === 'function' || false; // avoid IE problems
}

function centisecsToISODuration(n, bPrecise) {
  var str = "P";
  var nCs = n;
  var nY = 0,
    nM = 0,
    nD = 0,
    nH = 0,
    nMin = 0,
    nS = 0;
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
  nCs -= nMin * 6000
    // Now we can construct string
  if (nY > 0) str += nY + "Y";
  if (nM > 0) str += nM + "M";
  if (nD > 0) str += nD + "D";
  if ((nH > 0) || (nMin > 0) || (nCs > 0)) {
    str += "T";
    if (nH > 0) str += nH + "H";
    if (nMin > 0) str += nMin + "M";
    if (nCs > 0) str += (nCs / 100) + "S";
  }
  if (str == "P") str = "PT0H0M0S";
  // technically PT0S should do but SCORM test suite assumes longer form.
  return str;
}

export function isDomElement(value) {
  return !!value && typeof value === 'object' && value.nodeType === 1;
};

export function formatTime(duration, version = "1.2") {
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
};

export function inArray(arr, item) {
  return arr.indexOf(item) > -1;
}

export let deepmerge = (function() {
  let dp = function(target, src) {
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
          })
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
  }
  return dp;
})()

export let scaleNumberBelow = (function(){
  let sc = function(value, max) {
    if(value > max){
      return sc(value/10, max);
    }else{
      return value;
    }
  }
  return sc;
})()

export let scorm_params = {
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
}

export default null;