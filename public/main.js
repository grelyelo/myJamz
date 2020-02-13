// Attach listeners for each of the player controls
// Play/pause will do 2 things - toggle play/pause, and change logo from play to pause
// may want to wrap this in function. 

const paused = 'paused';
const playing = 'playing';


const songEndpoints = {
    artist: "/songs/search/artist/",
    title: "/songs/search/title/"
}

const artistResults = "#artistResults";
const titleResults  = "#titleResults";
const homeResults   = "#homeResults";
const contextMenu   = $('.custom-cm');
const contextMenuItem = $('.cm-item');
const releaseEndpoints = {};
const togglePlayPause= $('#togglePlayPause');
const nextSong       = $('#nextSong');
const prevSong       = $('#prevSong');


var Player = function(queue, pos) {
    queue.length > 0 ? this.queue = queue: this.queue = [];
    pos >= 0 ? this.pos = pos : this.pos = 0;
    this.state = paused;
};

Player.prototype = {
    play: function() {
        if(typeof this.pos === 'number' && this.queue){
            let sound;
            let self = this;
            if(this.queue[this.pos].howl){
                sound = this.queue[this.pos].howl;
            } else {
                sound = this.queue[this.pos].howl = new Howl({
                    src: `/songs/${this.queue[this.pos].id}/play`,
                    html5: true,
                    onplay: function() {
                        togglePlayPause.removeClass("fa-play-circle");
                        togglePlayPause.addClass("fa-pause-circle");
                    }, 
                    onstop: function() {
                        togglePlayPause.removeClass("fa-pause-circle");
                        togglePlayPause.addClass('fa-play-circle');
                    }, 
                    onpause: function() {
                        togglePlayPause.removeClass("fa-pause-circle");
                        togglePlayPause.addClass('fa-play-circle');
                    }, 
                    onend: function() {
                        togglePlayPause.removeClass("fa-pause-circle");
                        togglePlayPause.addClass('fa-play-circle');
                        self.move(1);
                    }

                });
            }
            this.state = playing;
            sound.play(); 
        }

    }, 
    pause: function() {
        let sound = this.queue[this.pos].howl;
        if(sound != null) {
            sound.pause();
        }
        this.state = paused;
    },
    stop: function() { 
        if(this.queue.length > 0) { // If we have a queue, stop current song. 
            let sound = this.queue[this.pos].howl;
            sound.stop();    
        }
        this.state = paused;
        Howler.unload();
    },
    toggle: function() {
        if(this.state === paused) {
            this.play();
        } else if (this.state === playing) {
            this.pause();
        }
    },
    move: function(n) {
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
    }, 
    replaceQueue: function(clientQueue) {
        this.stop();
        this.queue = clientQueue;
        this.pos   = 0;
        let serverQueue = JSON.stringify(Array.from(clientQueue, x => `${x.id}`));

        $.ajax('/queue/replace', {
            type: 'POST',
            contentType: 'application/json',
            data: serverQueue,
            processData: false
        });
        this.play();
    }
};




async function getQueue() { 
    let queue = $.getJSON('/queue');
    return queue;
}

async function getPos() {
    let pos =  await $.get('/queue/pos');
    return Number(pos);
}

async function setupPlayer() {
    let queue, pos;
    try {
        queue = await getQueue();
        pos   = await getPos();

    } catch(err) {
        queue = {};
        pos   = 0;
    }
    let songs = Object.keys(queue).map(key => {
        return { 
            id: queue[key],
            howl: null
        };
    })

    let player =  new Player(songs, pos, "#togglePlayPause");
    return player;

}



//Add event listener to search bar to update content as user types
//Every time the user submits a keystroke, we should do a search on the API. 
//Extra feature: perhaps wait at least 1 second after keystroke before searching. 

//Add event listener to sidebar elements to display appropriate content.
//onclick, load the page. 


function getSongs(url) {
    return $.getJSON(url)
        .then(songs => {
            return songs;        
        })
        .catch(err => { // If we get an error while searching (no response), just show all songs. 
            return $.getJSON('/songs')
                .then(songs => {
                    return songs;
                });
        })
}


function fillSongs(songs, selector) {
    $(selector).empty();
    songs.forEach(song => {
        $(selector).append(`<li data-id="${song._id}" class='songResult'><i class="fas fa-play-circle"></i>${song.artist} - ${song.title}</li>`);
    });
}

$( "#home" ).click(function() {
    //For now, we shall perform a search for the songs, 
    $(artistResults).empty();
    $(titleResults).empty();
    
    getSongs("/songs").then(songs => {
        fillSongs(songs, homeResults);
    });
    //parse the json formatted data,
    //and render the elements
});

$( "#browse" ).click(function() {
    // Get browse elements from /browse endpoint. 
    // For now, we will simply get the list of albums and display a list. Similar to how we get the 
    // list of songs. 


});

$( "#radio" ).click(function() {
    alert( "Handler for .click() called on #radio element" );
});


$('#searchBox').click(function() {
    $(artistResults).empty();
    $(titleResults).empty();
    $(homeResults).empty();
})
//This code is stolen. 
$("#searchBox").keyup(function(){
    //Todo: check whether the #songs is empty first. 
    let filter = $(this).val();

    getSongs(songEndpoints["title"] + filter).then(titleSongs => {
        fillSongs(titleSongs, titleResults);
    });
    getSongs(songEndpoints["artist"] + filter).then(artistSongs => {
        fillSongs(artistSongs, artistResults);
    });
});

$('.songResults').on("contextmenu", '.songResult', function(event) {
    // When we right-click anywhere on the page, 
    // show the context menu. 
    event.preventDefault();
    contextMenuItem.attr('data-id', $(this).attr('data-id'));
    contextMenu.css('top', event.pageY);
    contextMenu.css('left', event.pageX);

    contextMenu.toggle();
})

$(window).on('click', function(event) {
    contextMenu.hide();
})



var mainPlayer = setupPlayer();

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

    $(".songResults").on('click', 'i', function(event) {
        event.preventDefault();
        let id = $(this).parent('.songResult').attr('data-id');
        player.replaceQueue([{id: id, howl: null}]);
    })

    // Add song to queue when we click on it. 
    contextMenuItem.on('click', function(event){
        // Get the id for song to enqueue
        let songID = $(this).attr('data-id');
        let song = {
            id: songID, 
            howl: null
        }
        player.addToQueue(song);
    })
})