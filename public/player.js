// Attach listeners for each of the player controls
// Play/pause will do 2 things - toggle play/pause, and change logo from play to pause
// may want to wrap this in function. 

const paused = 'paused';
const playing = 'playing';
var state = paused;

var Player = function(queue, pos) {
    queue.length > 0 ? this.queue = queue: this.queue = [];
    pos >= 0 ? this.pos = pos : this.pos = 0;
};

Player.prototype = {
    play: function() {
        if(typeof this.pos === 'number' && this.queue){
            var sound;

            if(this.queue[pos]){
                sound = this.queue[pos];
            } else {
                sound = this.queue[pos] = new Howl({
                    src: `/songs/${this.song.id}/play`,
                    html5: true,
                });
            }    
            sound.play();        

        }

    }, 
    pause: function() {
        var sound = this.song.howl;
        sound.pause();
    },
    next: function() {
        console.log('song advance');
        let advanced = false;
        if(pos+1 < queue.length) {
            $.post(`/queue/pos/${this.pos+1}`)
            .then(newPos => {
                this.pos++;
                console.log(newPos);
                advanced = true;
            })
            .catch( err => {
                console.log('error when updating queue');
            });
        }
        if(advanced) {
            let sound = this.queue[this.pos];
            sound.play();
        }
    },


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

$("#nextSong").on('click', function() {
    player.next();
})

async function getQueue() { 
    return await $.getJSON('/queue');
}

async function getPos() {
    return await $.get('/queue/pos');
}


//Once we have a queue pos from the server, 

