
console.log("content.js injected");


function injectScript(file, node) {
    var th = document.getElementsByTagName(node)[0];
    var s = document.createElement('script');
    s.setAttribute('type', 'text/javascript');
    s.setAttribute('src', file);
    th.appendChild(s);
    // return s;
}
injectScript( chrome.runtime.getURL('scripts/control.js'), 'body');
injectScript( "webgazer.js", 'body');

// s.addEventListener


