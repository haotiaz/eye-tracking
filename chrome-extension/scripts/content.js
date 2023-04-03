
appendLoop = '';

var player;
var ele;
var volume;
var time;

var playerReady = false;
var calibrated = false;

var width = 300;
var height = 230;
var topDist = '0px';
var leftDist = '0px';

var textPersistTime = 1500;

var topMargin = 220;
var leftMargin = 220;
var bottomMargin = 220;
var rightMargin = 220;

var loaded = false;

var volumeIncRate = 10;
var volumeDecRate = 10;
var forwardRate = 15;
var rewindRate = 30;


// var showGazeDot = true;

var calibrationInstruction = "To calibrate the eye tracking system, gaze at each red stationary dot on the sreen and click on the dot. To test the accuracy of the eye tracking, gaze at a red stationary dot, and make sure the red prediction dot is fluctuating within the area which contains the dot you are gazing at enclosed by the green lines. If you find that the eye tracking is not accurate, repeat the first step. Press Alt+Shift+C (Option+Shift+C on Mac) to finish the calibration. If you find that some commands are not accurately executed, you can return to the calibration step by pressing the same shortcut.";


////////////// EventListeners ///////////////////

document.addEventListener('ready', function(event) {
    console.log('receive ready');
    playerReady = true;
});

document.addEventListener('volume-value', function(event) {
    console.log('receive volume value: ', event.detail);
    volume = event.detail.volume;
    console.log(event.detail.msg);
    if (event.detail.type === "up") {
        console.log("up");
        injectTopText("Volume: " + (volume*100).toFixed(0) + "%", 'body', textPersistTime);
    }
    else {
        console.log("down");
        injectBottomText("Volume: " + (volume*100).toFixed(0) + "%", 'body', textPersistTime);
    }
});

document.addEventListener('playback-value', function(event) {
    console.log('receive playback value: ' + event.detail.time);
    time = event.detail.time;

    var min = Math.floor((time%3600)/60);
    var minString = "" + min;
    if (min < 10) {
        minString = "0" + minString;
    }

    var sec = time%3600%60;
    var secString = "" + sec;
    if (sec < 10) {
        secString = "0" + secString;
    }

    var timeString = Math.floor(time/3600) + ":" + minString + ":" + secString;


    if (event.detail.type === "backward") {
        injectLeftText("<< " + timeString, 'body', textPersistTime);
    }
    else {
        injectRightText(timeString + " >>", 'body', textPersistTime);
    }
    
});

document.addEventListener('played', function(event) {
    injectMiddleText("Playing", 'body', textPersistTime);
});

document.addEventListener('paused', function(event) {
    injectMiddleText("Paused", 'body', textPersistTime);
});

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log(request);

        if (request.msg == "update-parameters") {
            volumeIncRate = request.volumeIncRateVal;
            volumeDecRate = request.volumeDecRateVal;
            forwardRate = request.forwardRateVal;
            rewindRate = request.rewindRateVal;
            pauseTimeout = request.pauseTimeoutVal;

            sendResponse({response: "end"});

            setCalibrationElements();
        }
        

        if (request.msg === "get-parameters") {
            // sendResponse({topMarginVal: topMargin, leftMarginVal: leftMargin, 
            // bottomMarginVal: bottomMargin, rightMarginVal: rightMargin,
            // pauseTimeoutVal: pauseTimeout,calibratedVal: calibrated});
            sendResponse({pauseTimeoutVal: pauseTimeout, volumeIncRateVal: volumeIncRate,
            volumeDecRateVal: volumeDecRate, forwardRateVal: forwardRate, rewindRateVal:
            rewindRate});
        }

        if (request.msg === "toggle-calibration") {
            calibrated = !calibrated;
            setCalibrationElements();
            sendResponse({response: "end"});
        }
        
});

//////////////////////////////////////////////////


////////////////////////// Functions /////////////////////////

function initGazer() {
	var compatible = webgazer.detectCompatibility();
	chrome.storage.sync.get('state', function(result) {
		console.log(result.state);
        var on = (result.state=='on');
        console.log(on);

		if (compatible&&on) {
			//start the webgazer tracker
	    	// webgazer.setRegression('ridge') /* currently must set regression and tracker */
		    //     .setTracker('clmtrackr')
		    //     .setGazeListener(function(data, clock) {
            //         // console.log(data);
            //         if (playerReady == true && calibrated == true) {
            //             handleData(data);
            //         }
		    //     })
		    //     .begin()
		    //     .showPredictionPoints(true); /* shows a square every 100 milliseconds where current prediction is */
            webgazer.setGazeListener(function(data, clock) {
                if (!loaded) {
                    loaded = true;
                    injectCalibrationElements();
                } 
                // console.log(data);
                if (!calibrated) {
                    pause();
                }
                if (playerReady == true && calibrated == true) {
                    handleData(data);
                }
            }).begin();
            webgazer.showPredictionPoints(true);

	        function checkIfReady() {
		        if (webgazer.isReady()) {
		        	console.log('ready');

					chrome.runtime.onMessage.addListener(
					function(request, sender, sendResponse) {
						console.log(sender.tab ?
						  "from a content script:" + sender.tab.url :
						  "from the extension");
						if (request.toggleCamera == false) {
							sendResponse({toggleCamera: false});
							console.log('off');
							document.getElementById('overlay').style.visibility='hidden';
							document.getElementById('faceOverlay').hidden=false;
							document.getElementById('webgazerVideoFeed').style.display='none';
						} else if (request.toggleCamera == true) {
							console.log('on');
							sendResponse({toggleCamera: true});
							document.getElementById('faceOverlay').style.visibility='visible';
							document.getElementById('webgazerVideoFeed').style.display='block';
							document.getElementById('overlay').hidden=true;
							setup();
						}
					});

		            setup();
		        } else {
		            // setTimeout(checkIfReady, 100);
		        }
		    }
		    // setTimeout(checkIfReady,100);
		}
    });
}

//Set up the webgazer video feedback.
var setup = function() {

    //Set up video variable to store the camera feedback
    var video = document.getElementById('webgazerVideoFeed');


    console.log(showCamera);
    //Position the camera feedback to the top left corner.
    video.style.display = 'block';
    video.style.position = 'fixed';
    video.style.top = topDist;
    video.style.left = leftDist;

    //Set up the video feedback box size
    video.width = width;
    video.height = height;
    video.style.margin = '0px';
    video.style.background = '#222222';
    webgazer.params.imgWidth = width;
    webgazer.params.imgHeight = height;

    //Set up the main canvas. The main canvas is used to calibrate the webgazer.
    var overlay = document.createElement('canvas');
    overlay.id = 'overlay';

    //Setup the size of canvas
    overlay.style.position = 'fixed';
    overlay.width = width;
    overlay.height = height;
    overlay.style.top = topDist;
    overlay.style.left = leftDist;
    overlay.style.margin = '0px';

    //Draw the face overlay on the camera video feedback
    var faceOverlay = document.createElement('face_overlay');
    faceOverlay.id = 'faceOverlay';
    faceOverlay.style.position = 'fixed';
    faceOverlay.style.top = '59px';
    faceOverlay.style.left = '107px';
    faceOverlay.style.border = 'solid';

    document.body.appendChild(overlay);
    document.body.appendChild(faceOverlay);

/*
    var canvas = document.getElementById("plotting_canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.position = 'fixed';
*/
    var showCamera;
    chrome.storage.sync.get('showCamera', function(result) {
    	var showCamera = result.showCamera;
		overlay.hidden = !showCamera;
    	faceOverlay.hidden = !showCamera;
	    video.style.display = showCamera?'block':'none';
    });
    var cl = webgazer.getTracker().clm;

    //This function draw the face of the user frame.
    function drawLoop() {
        requestAnimFrame(drawLoop);
        overlay.getContext('2d').clearRect(0,0,width,height);
        if (cl.getCurrentPosition()) {
            cl.draw(overlay);
        }
    }
    drawLoop();
    console.log(width,height);
    if(appendLoop) stopAppending();
    // setTimeout(appendLoop = setInterval(appendData,100),5000);
}

function injectCalibrationElements() {
    var body = document.getElementsByTagName('body')[0];

    var s = document.createElement('div');
    s.style.position = "fixed";
    s.style.top = "0px";
    s.style.left = "0px";
    s.style.width = "100%";
    s.style.height = "100%";
    s.className = "calibration";
    s.id = "calibration_container";
    body.appendChild(s);

    var w = window.innerWidth;
    var h = window.innerHeight;

    var leftDot = document.createElement('span');
    leftDot.style.position = "fixed";
    leftDot.style.left = "10px";
    leftDot.style.top =  (h/2 - 12.5) + "px";
    leftDot.style.width = "25px";
    leftDot.style.height = "25px";
    leftDot.style.borderRadius = "50%";
    leftDot.style.backgroundColor = "red";
    leftDot.className = "calibration";
    s.appendChild(leftDot);

    var rightDot = document.createElement('span');
    rightDot.style.position = "fixed";
    rightDot.style.top = (h/2 - 12.5) + "px";
    rightDot.style.left = (w - 35) +"px";
    rightDot.style.width = "25px";
    rightDot.style.height = "25px";
    rightDot.style.borderRadius = "50%";
    rightDot.style.backgroundColor = "red";
    rightDot.className = "calibration";
    s.appendChild(rightDot);

    var topDot = document.createElement('span');
    topDot.style.position = "fixed";
    topDot.style.top = "10px";
    topDot.style.left = (w/2 - 12.5) + "px";
    topDot.style.width = "25px";
    topDot.style.height = "25px";
    topDot.style.borderRadius = "50%";
    topDot.style.backgroundColor = "red";
    topDot.className = "calibration";
    s.appendChild(topDot);

    var bottomDot = document.createElement('span');
    bottomDot.style.position = "fixed";
    bottomDot.style.top = (h - 35) +"px";
    bottomDot.style.left = (w/2 - 12.5) + "px";
    bottomDot.style.width = "25px";
    bottomDot.style.height = "25px";
    bottomDot.style.borderRadius = "50%";
    bottomDot.style.backgroundColor = "red";
    bottomDot.className = "calibration";
    s.appendChild(bottomDot);

    var middleDot = document.createElement('span');
    middleDot.style.position = "fixed";
    middleDot.style.top = (h/2 - 12.5) + "px";
    middleDot.style.left = (w/2 - 12.5) + "px";
    middleDot.style.width = "25px";
    middleDot.style.height = "25px";
    middleDot.style.borderRadius = "50%";
    middleDot.style.backgroundColor = "red";
    middleDot.className = "calibration";
    s.appendChild(middleDot);

    var prompt = document.createElement('div');
    prompt.style.backgroundColor = 'white';
    prompt.style.color = "black";
    prompt.style.width = "40%";
    prompt.style.height = "30%";
    prompt.style.position = "relative";
    prompt.style.margin = "auto";
    // prompt.style.top = "50px";
    prompt.style.top = "100px";
    prompt.style.transform = "translateY(-300%)";
    prompt.style.opacity = "0.90";
    prompt.style.borderRadius = "20px";
    prompt.style.padding = "20px";

    var title = document.createElement('div');
    title.innerHTML = "Calibration instruction";
    title.style.fontSize = "20px";
    title.style.textAlign = "center";
    prompt.appendChild(title);

    var content = document.createElement('p');
    content.innerHTML = calibrationInstruction;
    content.style.fontSize = "16px";
    prompt.appendChild(content);

    var leftBox = document.createElement('div');
    leftBox.id = "left-box";
    leftBox.style.width = leftMargin + "px";
    leftBox.style.height = "100%";
    leftBox.style.position = "relative";
    leftBox.style.borderRight = "4px solid #00FF00";
    s.appendChild(leftBox);

    var topBox = document.createElement('div');
    topBox.id = "top-box";
    topBox.style.width = "100%";
    topBox.style.height = topMargin + "px";
    topBox.style.position = "fixed";
    topBox.style.top = "0px";
    topBox.style.left = "0px";
    topBox.style.borderBottom = "4px solid #00FF00";
    s.appendChild(topBox);

    var rightBox = document.createElement('div');
    rightBox.id = "right-box";
    rightBox.style.width = rightMargin + "px";
    rightBox.style.height = "100%";
    rightBox.style.position = "fixed";
    rightBox.style.top = "0px";
    rightBox.style.right = "0px";
    rightBox.style.borderLeft = "4px solid #00FF00";
    s.appendChild(rightBox);

    var bottomBox = document.createElement('div');
    bottomBox.id = "bottom-box";
    bottomBox.style.width = "100%";
    bottomBox.style.height = bottomMargin + "px";
    bottomBox.style.position = "fixed";
    bottomBox.style.bottom = "0px";
    bottomBox.style.left = "0px";
    bottomBox.style.borderTop = "4px solid #00FF00";
    s.appendChild(bottomBox);
    

    s.appendChild(prompt);


    setCalibrationElements();
}

function setCalibrationElements() {
    var s = document.getElementById("calibration_container");
    if (calibrated == true) {
        s.style.zIndex = "-10000";
        webgazer.showPredictionPoints(false);
    }
    else {
        s.style.zIndex = "10000";
        webgazer.showPredictionPoints(true);

        var topBox = document.getElementById('top-box');
        topBox.style.height = topMargin + 'px';

        var leftBox = document.getElementById('left-box');
        leftBox.style.width = leftMargin + 'px';

        var bottomBox = document.getElementById('bottom-box');
        bottomBox.style.height = bottomMargin + 'px';

        var rightBox = document.getElementById('right-box');
        rightBox.style.width = rightMargin + 'px';

        pause();
    }
}


function injectScript(file, node) {
    var th = document.getElementsByTagName(node)[0];
    var s = document.createElement('script');
    s.setAttribute('type', 'text/javascript');
    s.setAttribute('src', file);
    th.appendChild(s);
    return s;
}

function injectMiddleText(text, node, existTime) {
    var w = window.innerWidth;
    var h = window.innerHeight;
    injectCommandText(text, node, existTime, w/2, h/2);
}


function injectLeftText(text, node, existTime) {
    var w = window.innerWidth;
    var h = window.innerHeight;
    injectCommandText(text, node, existTime, 15, h/2);
}

function injectTopText(text, node, existTime) {
    var w = window.innerWidth;
    var h = window.innerHeight;
    injectCommandText(text, node, existTime, w/2, 15);
}

function injectBottomText(text, node, existTime) {
    var w = window.innerWidth;
    var h = window.innerHeight;
    injectCommandText(text, node, existTime, w/2, h - 80);
}

function injectRightText(text, node, existTime) {
    var w = window.innerWidth;
    var h = window.innerHeight;
    injectCommandText(text, node, existTime, w - 140, h/2);
}


function injectCommandText(text, node, existTime, x, y) {
    var th = document.getElementsByTagName(node)[0];

    var s = document.getElementById("command-text");
    if (s != null || s != undefined) {
        s.remove()
    }

    s = document.createElement('div');
    s.setAttribute('id', 'command-text');

    s.innerHTML = text;
    s.style.backgroundColor = 'white';
    s.style.color = 'black';
    s.style.fontSize = '20px';
    s.style.textAlign = "center";
    s.style.position = "fixed";
    s.style.top = y+"px";
    s.style.left = x+"px";
    s.style.zIndex = "1000000";
    s.style.width = "fit-content";
    // s.style.height = "30px";
    s.style.borderRadius = "25px";
    s.style.padding = "15px";

    th.appendChild(s);
    console.log("text injected");

    setTimeout(function() {
        if (th.contains(s)) {
            s.remove();
        }
    }, existTime);
}


function injectTopIndicationDot() {
    var w = window.innerWidth;
    var h = window.innerHeight;

    injectIndicationDot(32, w/2 - 40);
}

function injectBottomIndicationDot() {
    var w = window.innerWidth;
    var h = window.innerHeight;

    injectIndicationDot(h-65, w/2 - 40);
}

function injectLeftIndicationDot() {
    var w = window.innerWidth;
    var h = window.innerHeight;

    injectIndicationDot(h/2 - 35, 15);
}

function injectRightIndicationDot() {
    var w = window.innerWidth;
    var h = window.innerHeight;

    injectIndicationDot(h/2 - 35, w - 35);
}

function injectIndicationDot(x, y) {
    var body = document.getElementsByTagName('body')[0];

    var dot = document.createElement('span');
    dot.style.position = "fixed";
    dot.style.top = x + "px";
    dot.style.left = y +"px";
    dot.style.width = "25px";
    dot.style.height = "25px";
    dot.style.borderRadius = "50%";
    dot.style.backgroundColor = "red";
    dot.className = "indication";

    body.appendChild(dot)
}

function removeIndicationDot() {
    dots = document.getElementsByClassName("indication");
    for (let i = 0; i < dots.length; i++) {
        dots[i].remove();
      }
}


function play() {
    document.dispatchEvent(new CustomEvent('play'));
    console.log("content: play");
}

function pause() {
    document.dispatchEvent(new CustomEvent('pause'));
    console.log("content: pause");
}

function pauseWithoutText() {
    document.dispatchEvent(new CustomEvent('pause'));
    console.log("pause");
}

function setVolume(val) {
    document.dispatchEvent(new CustomEvent('set-volume', {
        detail: val
    }));
}

// val in seconds
function playback(val) {
    document.dispatchEvent(new CustomEvent('playback', {
        detail: val
    }));
}

//////////////// logic /////////////////////

var prevAction = "";

var playCounter = 0;
const playTolerance = 5;

var pauseTimeout = 5; // in seconds
var pauseID = 0;

var middleCounter = 0;
const middleTolerance = 2;

var prevArea = "";
var areaCounter = 0;
const areaTolerance = 5;

var W = window.innerWidth;
var H = window.innerHeight;

function handleData(data) {
    // console.log(data);
    if (data != null) {
        const x = data.x;
        const y = data.y;

        var area = getArea(x, y);
        console.log(area);

        if (area !== "left" && area !== "right") {
            if (prevAction === "play") {
                playCounter += 1;
            }
            else {
                playCounter = 0;
                prevAction = "play";
            }
            if (playCounter >= playTolerance) {
                pauseID += 1;
                play();
                playCounter = 0;
            }
        }
        handleCommand(area);
    }
    else if (pauseTimeout >= 0) {
        if (prevAction !== "pause") {
            prevAction = "pause";
            setTimeout(function(id) {
                if (id == pauseID && prevAction === "pause") {
                    pause();
                }
            }, pauseTimeout * 1000 + 100, pauseID);

        }
    }
}

function getArea(x, y) {
    if (x < leftMargin) {
        return "left";
    }
    else if (x + rightMargin >= W) {
        // console.log(x + " " + rightMargin + " " + W);
        return "right";
    }
    else if (y<topMargin) {
        return "top";
    }
    else if (y + bottomMargin >= H) {
        return "bottom";
    }
    return "middle";
}

function handleCommand(area) {
    if (area === prevArea) {
        areaCounter += 1;
    }
    else {
        areaCounter = 1;
        removeIndicationDot();
        if (area === "left") {
            injectLeftIndicationDot();
        }
        else if (area === "right") {
            injectRightIndicationDot();
        }
        if (area === "top") {
            injectTopIndicationDot();
        }
        if (area === "bottom") {
            injectBottomIndicationDot();
        }

        if (area === "middle") {
            middleCounter += 1;
            if (middleCounter >= middleTolerance) {
                prevArea = area;
                middleCounter = 0;
                removeIndicationDot();
            }
        }
        else {
            prevArea = area;
        }
    }

    if (area !== "middle") {
        middleCounter = 0;
    }
    
    if (areaCounter >= areaTolerance) {
        console.log(area);
        areaCounter = 0;
        if (area === "left") {
            playback(-1 * rewindRate);
        }
        else if (area === "right") {
            playback(forwardRate);
        }
        if (area === "top") {
            setVolume(volumeIncRate/100);
        }
        if (area === "bottom") {
            setVolume(-1 * volumeDecRate/100);
        }
    }
}

////////////////////////////////////////////////////////////


console.log("content.js injected");

ele = injectScript( chrome.runtime.getURL('scripts/control.js'), 'body');

injectMiddleText("Loading...", 'body', 10000);



setTimeout(function() {
    initGazer();
}, 500);










