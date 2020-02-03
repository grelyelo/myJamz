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
                src: this.song.filename,
                html5: true,
                onplay: function() {
                    // Switch icon from 
                    $("#togglePlayPause").removeClass("fa-play");
                    $("#togglePlayPause").addClass("fa-pause");
                },
                onpause: function() {
                    $("#togglePlayPause").removeClass('fa-pause');
                    $("#togglePlayPause").addClass('fa-play');
                },
                onstop: function() {
                    $("#togglePlayPause").removeClass('fa-pause');
                    $("#togglePlayPause").addClass('fa-play');
                }
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
    filename: "nowPlaying.mp3",
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

$('#togglePlayPause').on('click', togglePlayback)
