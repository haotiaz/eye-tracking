document.addEventListener('DOMContentLoaded',function() {
	// initOn();
	// initCam();
});


function initOn() {
  	var toggleOn = document.getElementById('toggleOn');
	chrome.storage.sync.get('state', function(result) {
		console.log('Value currently is ' + result.state);
		toggleOn.checked = (result.state === 'on'?true:false);
	});
	toggleOn.onchange = function () {
		if(this.checked) {
			chrome.storage.sync.set({state: 'on'}, function() {
	 		 	chrome.extension.getBackgroundPage().console.log('Turned on');
			})
			toggleState(true);
		} else {
			console.log('Turned off');
			chrome.storage.sync.set({state: 'off'}, function() {
	 		 	chrome.extension.getBackgroundPage().console.log('Turned off');
			})
			toggleState(false);
		}
	};
}

function initCam() {
	var toggleCam = document.getElementById('toggleCamera');

	chrome.storage.sync.get('showCamera', function(result) {
		console.log('Value currently is ' + result.showCamera);
		toggleCam.checked = result.showCamera;
	});
	toggleCam.onchange = function () {
	  	if(this.checked) {
	  		chrome.storage.sync.set({'showCamera': true}, function() {
	     		 chrome.extension.getBackgroundPage().console.log('Turned camera on');
	    	})
	    	toggleCamera(true);
	  	} else {
	  		console.log('Turned off');
	  		chrome.storage.sync.set({'showCamera': false}, function() {
	     		 chrome.extension.getBackgroundPage().console.log('Turned camera off');
	    	});
	  		toggleCamera(false);
	    }
  	}
}

function toggleState(truth) {
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
	    chrome.tabs.sendMessage(tabs[0].id, {state: truth, toggleCamera: truth}, function(response) {
	      console.log(response);
    	});
	});
}

function toggleCamera(truth) {
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
	    chrome.tabs.sendMessage(tabs[0].id, {toggleCamera: truth}, function(response) {
	      console.log(response);
    	});
	});
}

function sliderValueToTimeout(val) {
	if (val <= 12) {
		return 5*val;
	}
	else if(val == 22) {
		return -1;
	}
	else {
		return (val - 11) * 60;
	}
}

function timeoutToSliderValue(val) {
	if (val == -1) {
		return 22;
	}
	else if (val <= 60) {
		return val/5;
	}
	else {
		return val/60 + 11;
	}
}

function timeoutToText(val) {
	if (val == 0) {
		return "Immediate";
	}
	else if (val == -1) {
		return "Never";
	}
	else {
		if (val < 60) {
			return val + " seconds";
		}
		else {
			return Math.round(val/60) + " minutes";
		}
	}
}


/////////////////////////////////////////////

var pauseTimeout;
var volumeInc;
var volumeDec;
var forward;
var rewind;
var sensitivity;

var pauseTimeoutDisplay;
var sensitivityDisplay;


function parametersChanged() {
	console.log("changed");
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, 
			{msg: "update-parameters", pauseTimeoutVal: sliderValueToTimeout(pauseTimeout.value), volumeIncRateVal: volumeInc.value,
				volumeDecRateVal: volumeDec.value, forwardRateVal: forward.value, rewindRateVal:
				rewind.value, sensitiveVal: sensitivity.value}, 
			function(response) {
        });
    });
}

function updatePauseTimeout() {
	// console.log(sliderValueToTimeout(pauseTimeout.value));
	
	pauseTimeoutDisplay.innerHTML = timeoutToText(sliderValueToTimeout(pauseTimeout.value));
	sensitivityDisplay.innerHTML = sensitivity.value;
}



window.onload = function() {

	pauseTimeout = document.getElementById("pause-timeout");
	volumeInc = document.getElementById("volume-inc-rate");
	volumeDec = document.getElementById("volume-dec-rate");
	forward = document.getElementById("forward-rate");
	rewind = document.getElementById("rewind-rate");
	sensitivity = document.getElementById("sensitivity");

	pauseTimeoutDisplay = document.getElementById("pause-timeout-display");
	sensitivityDisplay = document.getElementById("sensitivity-display");

	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, 
			{msg: "get-parameters"}, 
			function(response) {
				pauseTimeout.value = timeoutToSliderValue(response.pauseTimeoutVal);
				volumeInc.value = response.volumeIncRateVal;
				volumeDec.value = response.volumeDecRateVal;
				forward.value = response.forwardRateVal;
				rewind.value = response.rewindRateVal;
				pauseTimeoutDisplay.innerHTML = timeoutToText(response.pauseTimeoutVal);
				sensitivity.value = response.sensitiveLevelVal;
				sensitivityDisplay.innerHTML = response.sensitiveLevelVal;
        });
    });

	

	volumeInc.addEventListener("change", parametersChanged);
	volumeDec.addEventListener("change", parametersChanged);
	forward.addEventListener("change", parametersChanged);
	rewind.addEventListener("change", parametersChanged);
	pauseTimeout.addEventListener("change", parametersChanged);
	pauseTimeout.addEventListener("input", updatePauseTimeout);

	sensitivity.addEventListener("change", parametersChanged);
	sensitivity.addEventListener("input", updatePauseTimeout);
}


