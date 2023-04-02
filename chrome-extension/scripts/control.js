console.log("control.js injected");
var player;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getPlayer() {
    var videoPlayer = null;
    while(videoPlayer == null) {
        await sleep(1000);
        videoPlayer = netflix.appContext.state.playerApp.getAPI().videoPlayer;
    }

    while(player == null) {
        await sleep(1000);
        player=videoPlayer.getVideoPlayerBySessionId(videoPlayer.getAllPlayerSessionIds()[0]);
    }

    console.log("player found");
    document.dispatchEvent(new CustomEvent('ready'));
}

getPlayer();

document.addEventListener('play', function(event) {
    if (!player.isPlaying()) {
        player.play();
        document.dispatchEvent(new CustomEvent('played', {
            detail: "played"
        }));
        console.log("control: play");
    }
});

document.addEventListener('pause', function(event) {
    console.log("control: playing " + player.isPlaying());
    if (player.isPlaying()) {
        player.pause();
        document.dispatchEvent(new CustomEvent('paused', {
            detail: "paused"
        }));
        console.log("control: pause");
    }
    
});

document.addEventListener('set-volume', function(event) {
    var val = event.detail;
    var volume = player.getVolume() + val;

    player.setVolume(volume);
    console.log("volume set");

    var msg;
    if (val >0) {
        msg = "up";
    }
    else {
        msg = "down";
    }

    document.dispatchEvent(new CustomEvent('volume-value', {
        detail: {volume: player.getVolume(), type: msg}
    }));
});

document.addEventListener('playback', function(event) {
    var val = event.detail;
    var time = player.getCurrentTime() + val * 1000;
    player.seek(time);

    var msg;
    if (val >0) {
        msg = "forward";
    }
    else {
        msg = "backward";
    }

    document.dispatchEvent(new CustomEvent('playback-value', {
        detail: {time: (player.getCurrentTime()/1000).toFixed(0), type: msg}
    }));

});
