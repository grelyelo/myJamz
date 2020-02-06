// Attach listeners for each of the player controls
// Play/pause will do 2 things - toggle play/pause, and change logo from play to pause
// may want to wrap this in function. 

const paused = 'paused';
const playing = 'playing';

var Player = function(queue, pos, btn) {
    queue.length > 0 ? this.queue = queue: this.queue = [];
    pos >= 0 ? this.pos = pos : this.pos = 0;
    this.state = paused;
    this.btn   = btn;
};

Player.prototype = {
    play: function() {
        if(typeof this.pos === 'number' && this.queue){
            var sound;
            if(this.queue[this.pos].howl){
                sound = this.queue[this.pos].howl;
            } else {
                sound = this.queue[this.pos].howl = new Howl({
                    src: `/songs/${this.queue[this.pos].id}/play`,
                    html5: true,
                });
            }

            //Change Icon to playing
            $(this.btn).removeClass("fa-play-circle");
            $(this.btn).addClass("fa-pause-circle");

            this.state = playing;
            sound.play(); 
        }

    }, 
    pause: function() {
        var sound = this.queue[this.pos].howl;
        this.state = paused;

        //Change icon to paused
        $(this.btn).removeClass("fa-pause-circle");
        $(this.btn).addClass("fa-play-circle");
        sound.pause();
    },
    stop: function() { 
        var sound = this.queue[this.pos].howl;
        this.state = paused;

        //Change icon to paused
        $(this.btn).removeClass("fa-pause-circle");
        $(this.btn).addClass("fa-play-circle");
        
        sound.stop();
    },
    toggle: function() {
        if(this.state === paused) {
            this.play();
        } else if (this.state === playing) {
            this.pause();
        }
    },
    move: function(n) {
        console.log('song advance');
        if(this.pos+n< this.queue.length) {
            $.post(`/queue/pos/${this.pos+n}`)
            .then(() => {
                this.stop();//Stops current song
                this.pos += n;//Advances queue on client
                this.play();//Plays next song. 
            })
            .catch( err => {
                console.log('error when updating queue');
            });
        }
    },
    addToQueue: function(song) {
        this.queue.push(song);
        $.post(`/queue/add/${song.id}`)
            .then(res => {
                console.log(`added song with id ${song.id} to queue`);
            })
    }


};




async function getQueue() { 
    return await $.getJSON('/queue');
}

async function getPos() {
    let pos =  await $.get('/queue/pos');
    return Number(pos);
}

async function setupPlayer() {
    try {
        let queue = await getQueue();
        let pos   = await getPos();

        let songs = Object.keys(queue).map(key => {
            return { 
                id: queue[key],
                howl: null
            };
        })

        let player =  new Player(songs, pos, "#togglePlayPause");
        return player;
    } catch(err) {
        console.log("Got error in setupPlayer");
        throw new Error("setupPlayer failed");
    }
}


// For now, I'm just going to print out the player details -- I'll do the actual stuff later. 

var mainPlayer = setupPlayer()

mainPlayer.then(player => { // Bind the listeners once we have loaded the player queue and details. 
    

    //Main play button shall only toggle playback of current song. 
    $('#togglePlayPause').on('click', function() {
        player.toggle();
    })

    $("#nextSong").on('click', function() {
        player.move(1);
    })  

    $("#prevSong").on('click', function() {
        player.move(-1);
    })  

})