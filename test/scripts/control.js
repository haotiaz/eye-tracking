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
    player.pause();
}

getPlayer();





// player.setVolume(0.5);
// player.play();
// player.getCurrentTime();
// player.seek(100);