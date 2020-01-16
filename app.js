const express = require("express"),
   mongoose = require("mongoose"),
 bodyParser = require("body-parser"),
        url = require("url"),
escapeStringRegexp = require('escape-string-regexp')

var app = express();
mongoose.connect("mongodb://localhost:27017/SpotifyClone", {useNewUrlParser: true});

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set("view engine", "ejs");

const port = 3000,
      host = "127.0.0.1";

var songSchema = new mongoose.Schema({
    artist: String,
    title: String
});

var Song = mongoose.model("Song", songSchema);

//RESTful routes 

//Index Redirect
app.get("/", function(req, res){
    res.render("main");
});

//Index
app.get("/songs", function(req, res) {
    Song.find({}, function(err, songs) {
        if(err) {
            console.log(err);
        } else {
            //returns songs in JSON format. songs is an array of songs. 
            res.json(songs)
        }
    })
});

//New Song form
app.get("/songs/new", function(req, res) {
    Song.find({}, function(err, songs) {
        if(err) {
            console.log(err);
        } else {
            res.render("new", {songs: songs})
        }
    })
});


//Search for songs based on some criteria
app.get("/songs/search/:by/:term", function(req, res){
    var term = req.params.term;
    var termRegex = new RegExp(escapeStringRegexp(term));
    var by    = req.params.by;
    var query; 

    if(by === 'artist') {
        query = {artist: termRegex}
    } else if(by === 'title') {
        query = {title: termRegex}
    }
    //Find by search criteria. 
    
    Song.find(query, function(err, songs) {
        if(err) {
            console.log(err);
        } else {
            res.json(songs)
        }
    })   
});

//Show
app.get("/songs/:id", function(req, res){
    Song.findById(req.params.id, function(err, foundSong){
        if(!err) {
            res.json([foundSong])
        } else {
            console.log(err);
        }
    })
});





//Create
app.post("/songs", function(req, res){
    //Yes, I know these variables are redundant, 
    //but I'm keeping them just in case we want to do validation
    var a = req.body.artist;
    var t  = req.body.title;

    var newSong = {artist: a, title: t};

    Song.create(newSong, function(err, song){
        if(err) {
            console.log(err)
        } else {
            res.redirect("/songs");
        }
    });
    //res.send("hit the /songs post route");
});

app.listen(port, host, function(){
    console.log(`App is listening on ${host}:${port}`);
});