'use strict';

  chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.sync.set({state: 'on'}, function(){
    	console.log('now ON');
    });
    chrome.storage.sync.set({showCamera: true}, function() {
    	console.log('camera now on');
    })
  });

  chrome.commands.onCommand.addListener(function (command) {
    if (command === "calibrate") {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, 
			{msg: "toggle-calibration"}, 
			function(response) {
				
      });
    });
    }
});

