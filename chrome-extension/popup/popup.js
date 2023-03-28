document.addEventListener('DOMContentLoaded',function() {
	initOn();
	initCam();
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


/////////////////////////////////////////////

var topMargin;
var leftMargin;
var bottomMargin;
var rightMargin;
var pauseTimeout;
var calibrated;


function parametersChanged() {
	console.log("changed");
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, 
			{msg: "update-parameters", topMarginVal: topMargin.value, leftMarginVal: leftMargin.value,
			rightMarginVal: rightMargin.value, bottomMarginVal: bottomMargin.value,
			pauseTimeoutVal: pauseTimeout.value, calibratedVal: calibrated.checked}, 
			function(response) {
        });
    });
}


window.onload = function() {
	topMargin = document.getElementById("topMargin");
	leftMargin = document.getElementById("leftMargin");
	bottomMargin = document.getElementById("bottomMargin");
	rightMargin = document.getElementById("rightMargin");
	pauseTimeout = document.getElementById("pauseTimeout");
	calibrated = document.getElementById("calibrated");

	topMargin.remove();

	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, 
			{msg: "get-parameters"}, 
			function(response) {
				topMargin.value = response.topMarginVal;
				leftMargin.value = response.leftMarginVal;
				bottomMargin.value = response.bottomMarginVal;
				rightMargin.value = response.rightMarginVal;
				pauseTimeout.value = response.pauseTimeoutVal;
				calibrated.checked = response.calibratedVal;
        });
    });


	topMargin.addEventListener("change", parametersChanged);
	leftMargin.addEventListener("change", parametersChanged);
	bottomMargin.addEventListener("change", parametersChanged);
	rightMargin.addEventListener("change", parametersChanged);
	pauseTimeout.addEventListener("change", parametersChanged);
	calibrated.addEventListener("change", parametersChanged);
}


