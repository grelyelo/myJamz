const express = require("express"),
   mongoose = require("mongoose"),
 bodyParser = require("body-parser"),
        url = require("url"),
escapeStringRegexp = require('escape-string-regexp')

var app = express();
mongoose.connect("mongodb://localhost:27017/myJamzTesting", {useNewUrlParser: true});

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set("view engine", "ejs");

const port = 3000,
      host = "127.0.0.1";

//Schema for individual songs
const songSchema = new mongoose.Schema({
    artist: String,
    title: String, 
});

const Song    = mongoose.model("song", songSchema);

//Schema for EPs, Albums, Singles, etc. 
const releaseSchema = new mongoose.Schema({
    artist: String,
    title: String,
    tracks: [{type: mongoose.Schema.Types.ObjectId, ref: 'song'}]
});

const Release = mongoose.model("release", releaseSchema);

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

app.get("/releases", function(req, res){
    Release.find({}, function(err, releases){
        if(!err) {
            res.json(releases);
        } else {
            console.log(err);
        }
    })
});

//New Song form
app.get("/songs/new", function(req, res) {
    res.render("new")
});


//Search for songs based on some criteria
app.get("/songs/search/:by/:term", function(req, res){
    var term = req.params.term;
    //Use regular expression to support partial mapping
    var termRegex = new RegExp(escapeStringRegexp(term), "i");
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

//Show songs
app.get("/songs/:id", function(req, res){
    Song.findById(req.params.id, function(err, foundSong){
        if(!err) {
            res.json(foundSong);
        } else {
            console.log(err)
        }
    })
});

//Show a release
app.get("/releases/:id", function(req, res) {
    Release.findById(req.params.id, function(err, foundRelease){
        if(!err) {
            res.json(foundRelease)
        } else {
            console.log(err);
        }
    })
})


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
});


//Album Routes



app.listen(port, host, function(){
    console.log(`App is listening on ${host}:${port}`);
});