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
    player.play();
});

document.addEventListener('pause', function(event) {
    console.log("control: pause")
    player.pause();
});

document.addEventListener('set-volume', function(event) {
    var val = event.detail;
    var volume = player.getVolume() + val;

    player.setVolume(volume);

    document.dispatchEvent(new CustomEvent('volume-value', {
        detail: player.getVolume()
    }));
});

document.addEventListener('playback', function(event) {
    var val = event.detail;
    var time = player.getCurrentTime() + val * 1000;
    player.seek(time);

    document.dispatchEvent(new CustomEvent('playback-value', {
        detail: player.getCurrentTime()/1000
    }));

});
