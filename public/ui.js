//Add event listener to search bar to update content as user types
//Every time the user submits a keystroke, we should do a search on the API. 
//Extra feature: perhaps wait at least 1 second after keystroke before searching. 

//Add event listener to sidebar elements to display appropriate content.
//onclick, load the page. 

const songEndpoints = {
    artist: "/songs/search/artist/",
    title: "/songs/search/title/"
}

const releaseEndpoints = {}

function fillSongs(url) {
    $.getJSON(url, function(songs) {
        for(var i = 0; i < songs.length; i++){
            $("#content").append('<li>' + songs[i].artist  + " - " + songs[i].title + '</li>')
        }
    });
}
$( "#home" ).click(function() {
    //For now, we shall perform a search for the songs, 
    $("#content").empty();
    fillSongs("/songs")  
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
    $("#content").empty();
    let filter = $(this).val();

    fillSongs(songEndpoints["artist"] + filter);
    fillSongs(songEndpoints["title"]  + filter);
});