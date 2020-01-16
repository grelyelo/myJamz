//Add event listener to search bar to update content as user types
//Every time the user submits a keystroke, we should do a search on the API. 
//Extra feature: perhaps wait at least 1 second after keystroke before searching. 

//Add event listener to sidebar elements to display appropriate content.
//onclick, load the page. 
$( "#home" ).click(function() {
    //For now, we shall perform a search for the songs, 
    console.log("event fired")
    $("#songs").empty();
    $.getJSON("/songs", function(songs) {
        console.log("fuck you")
        for(var i = 0; i < songs.length; i++){
            $("#songs").append('<li>' + songs[i].artist  + " - " + songs[i].title + '</li>')
        }
    });    
    //parse the json formatted data,
    //and render the elements
});

$( "#browse" ).click(function() {
    alert( "Handler for .click() called on #browse element" );
});

$( "#radio" ).click(function() {
    alert( "Handler for .click() called on #radio element" );
});