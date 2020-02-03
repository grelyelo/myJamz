const express = require("express"),
   mongoose = require("mongoose"),
 bodyParser = require("body-parser"),
        url = require("url"),
escapeStringRegexp = require('escape-string-regexp'),
    gridfs  = require('gridfs-stream');

var app = express();
mongoose.connect("mongodb://localhost:27017/myJamzTesting", {useNewUrlParser: true});
var conn = mongoose.connection;

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set("view engine", "ejs");

const port = 3000,
      host = "127.0.0.1";

//Schema for different types of pictures, 
//such as album art, profile pictures, etc. 
const pictureSchema  = new mongoose.Schema({
    picURL: String
});
const Picture = mongoose.model("picture", pictureSchema);
//Schema for individual songs
const releaseSchema = new mongoose.Schema({
    title: String,
    tracks: [{type: mongoose.Schema.Types.ObjectId, ref: 'song'}],
    releaseArt: [{type: mongoose.Schema.Types.ObjectId, ref: 'picture'}]
});
const Release = mongoose.model("release", releaseSchema);


const songSchema = new mongoose.Schema({
    artist: String,
    title: String,
    inReleases: [{type: mongoose.Schema.Types.ObjectId, ref: 'release'}],
    songData: mongoose.Schema.Types.ObjectId // Link to the song file in GridFS
});
const Song    = mongoose.model("song", songSchema);

//RESTful routes 
conn.once('open', function() {
    let gfs = gridfs(conn.db); // This is the GridFS object we will use to access the file data for each song. 

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

    app.get("/songs/:id/play", function(req, res) {
        // Open a pipe to the file with _id equal to songData of song with ID req.params.id
        // then pipe the file to the response object (download the song to user's browser). 
        // For the purposes of this demo, we shall assume we are dealing with an mp3
        // with content type audio/mpeg, although that is not neccessarily the case.
        // Eventually, we shall update the Content-Type of the file on GridFS depending on filetype. 
        Song.findById(req.params.id, function(err, song){
            if(song) {
                res.send(`songData: ${song.songData}`);
            } else {
                res.send("Song not found");
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
    // app.post("/songs", function(req, res){
    //     //Yes, I know these variables are redundant, 
    //     //but I'm keeping them just in case we want to do validation
    //     var a = req.body.artist;
    //     var t  = req.body.title;

    //     var newSong = {artist: a, title: t};

    //     Song.create(newSong, function(err, song){
    //         if(err) {
    //             console.log(err)
    //         } else {
    //             res.redirect("/songs");
    //         }
    //     });
    // });

})

//Album Routes



app.listen(port, host, function(){
    console.log(`App is listening on ${host}:${port}`);
});