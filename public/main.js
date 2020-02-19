// Attach listeners for each of the player controls
// Play/pause will do 2 things - toggle play/pause, and change logo from play to pause
// may want to wrap this in function. 

const paused = 'paused';
const playing = 'playing';


const songEndpoints = {
    artist: "/songs/search/artist/",
    title: "/songs/search/title/"
}

const API_PREFIX = '/api/v1'; 
// Search box
const searchBox     = $("#searchBox")
// Sidebar links
const homeLink      = $("#home-link");
const browseLink    = $("#browse-link");
const radioLink     = $("#radio-link");

//Page div containers
const artistResults = $("#artistResults");
const titleResults  = $("#titleResults");
const homeResults   = $("#homeResults");
const anyResults    = $(".results")

//Context Menu
const contextMenu   = $('.custom-cm');
const contextMenuItem = $('.cm-item');

//Play Controls
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
                    src: `/api/v1/songs/${this.queue[this.pos].id}/play`,
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
            $.post(API_PREFIX + `/queue/pos/${this.pos+n}`)
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
        $.post(API_PREFIX + `/queue/add/song/${song.id}`)
    }, 
    replaceQueue: function(clientQueue) {
        if(this.queue.length > 0) {
            this.stop();
        }
        this.queue = clientQueue;
        this.pos   = 0;
        let serverQueue = JSON.stringify(Array.from(clientQueue, x => x.id));

        $.ajax(API_PREFIX + '/queue/replace', {
            type: 'POST',
            contentType: 'application/json',
            data: serverQueue,
            processData: false
        });
        this.play();
    }
};




async function getQueue() { 
    let queue = $.getJSON(API_PREFIX + '/queue');
    return queue;
}

async function getPos() {
    let pos =  await $.get(API_PREFIX + '/queue/pos');
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
function getAll(url) { 
    return $.getJSON(url)
    .then(songs => {
        return songs;        
    })
}

function getSearchResults(rootEndpoint, search) {
    let url = rootEndpoint + search;
    return $.getJSON(url)
        .then(results => {
            return results;        
        })
}


function fillSongs(songs, element) {
    element.empty();
    songs.forEach(song => {
        element.append(`<li data-id="${song._id}" class='songResult'><i class="fas fa-play-circle"></i>${song.artist} - ${song.title}</li>`);
    });
}


searchBox.click(function() {
    artistResults.empty();
    titleResults.empty();
    homeResults.empty();
})
//This code is stolen. 
searchBox.keyup(function(){
    console.log("searching")
    //Todo: check whether the #songs is empty first. 
    let filter = $(this).val();

    getSearchResults(API_PREFIX + "/songs/search", "/title/"+filter).then(titleSongs => {
        fillSongs(titleSongs, titleResults);
    });
    getSearchResults(API_PREFIX + "/songs/search", "/artist/"+filter).then(artistSongs => {
        fillSongs(artistSongs, artistResults);
    });
});

anyResults.on("contextmenu", '.songResult', function(event) {
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
    togglePlayPause.on('click', function() {
        player.toggle();
    })

    nextSong.on('click', function() {
        player.move(1);
    })  

    prevSong.on('click', function() {
        player.move(-1);
    })  

    // When we click on play button for a song in the UI
    // replace the queue for the player and play the song. 
    anyResults.on('click', 'i', function(event) {
        event.preventDefault();
        //Unsorted array of songs. 
        let songElems =  $.makeArray($(this).parent('.songResult').siblings()).concat($(this).parent('.songResult')[0]);
        let songIDs = Array.from(songElems, song => {
            return {id: $(song).attr('data-id'), howl: null}
        })
        player.replaceQueue(songIDs);
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