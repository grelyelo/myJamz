// Attach listeners for each of the player controls
// Play/pause will do 2 things - toggle play/pause, and change logo from play to pause
// may want to wrap this in function. 

const paused = 'paused';
const playing = 'playing';
var state = paused;


var Player = function(song) {
    this.song = song;
};

Player.prototype = {
    play: function() {
        var sound;
        if(this.song.howl){
            sound = this.song.howl;
        } else {
            sound = this.song.howl = new Howl({
                src: `/songs/${this.song.id}/play`,
                html5: true,
            });
        }

        sound.play();        
    }, 
    pause: function() {
        var sound = this.song.howl;
        sound.pause();
    }
};

var player = new Player({
    id: "5e3865e91720ea16cfab3c4b",
    howl: null
});


function togglePlayback(){
    if(state === paused) {
        state = playing;
        player.play();
    } else if (state === playing) {
        state = paused;
        player.pause();
    }
}


//Main play button shall only toggle playback of current song. 
$('#togglePlayPause').on('click', function() {

    // Toggle icon. 
    if(state === paused) {
        $(this).removeClass("fa-play-circle");
        $(this).addClass("fa-pause-circle");
    } else if (state === playing) {
        $(this).removeClass("fa-pause-circle");
        $(this).addClass("fa-play-circle");
    }

    // If paused, play, otherwise pause.  
    togglePlayback();
})

async function getQueue() { 
    return await $.getJSON('/queue');
}

async function setupQueue() {
    let pos = await $.get('/queue/pos');
    let queue = await getQueue();
    return queue[pos]
}


//Once we have a queue pos from the server, 

setupQueue().then(rval => {
    console.log(rval);
});