//Add event listener to search bar to update content as user types
//Every time the user submits a keystroke, we should do a search on the API. 
//Extra feature: perhaps wait at least 1 second after keystroke before searching. 

//Add event listener to sidebar elements to display appropriate content.
//onclick, load the page. 

const songEndpoints = {
    artist: "/songs/search/artist/",
    title: "/songs/search/title/"
}

const releaseEndpoints = {};

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
        $(selector).append(`<li class='songResult' data-id="${song._id}"><i class="fas fa-play-circle"></i>${song.artist} - ${song.title}</li>`);
    });
}

$( "#home" ).click(function() {
    //For now, we shall perform a search for the songs, 
    getSongs("/songs").then(songs => {
        fillSongs(songs, "#content");
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

//This code is stolen. 
$("#searchBox").keyup(function(){
    //Todo: check whether the #songs is empty first. 
    songResults = [];
    let filter = $(this).val();

    getSongs(songEndpoints["title"] + filter).then(titleSongs => {
        fillSongs(titleSongs, "#title");
    });
    getSongs(songEndpoints["artist"] + filter).then(artistSongs => {
        fillSongs(artistSongs, "#artist");
    });
});