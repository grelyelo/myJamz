const express = require("express"),
   mongoose = require("mongoose"),
 bodyParser = require("body-parser"),
        url = require("url"),
escapeStringRegexp = require('escape-string-regexp')

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

//Schema for the playing queue, i.e., the songs which are going to be
//played in the future.  
//The /queue/next endpoint redirects to the next playing song. 
//The /queue/previous endpoint redirects to the previous playing song.  
const queueSchema = new mongoose.Schema({
    pos: {type: Number, default: 0}, // Position in queue
    tracks: [{type: mongoose.Schema.Types.ObjectId, ref: 'song'}] // Tracks on queue. 
    //tracks[pos] is currently playing song. 
});
const Queue = mongoose.model('queue', queueSchema);

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
    let gfs = new mongoose.mongo.GridFSBucket(conn.db);//Using fs.files collection (default) to get the song data. 
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
        Song.findById(req.params.id, function(err, song){
            if(song) {
                //Setup stream from the GridFS 
                // Open a stream to the file with _id equal to songData of song
                let downloadStream = gfs.openDownloadStream(song.songData)

                res.set({'Content-Type': "audio/mpeg"});//Hard coded for mp3 audio
                //Pipe file from database to user's browser. 
                downloadStream
                    .pipe(res)
                    .on('error', function() {
                        //If we get an error while downloading the file, stop 
                        // streaming and immediately send 500 server error. 
                        res.status(500).end();
                    });
            } else {
                res.send("Song not found");
            }
        })
    });

    app.get('/queue', function(req, res){
        Queue.findOne({}, function(err, queue){
            if(queue) {
                res.json(queue.tracks)
            } else {
                res.write("No queue.");
                res.status(404).end();
            }
        })
    })


    app.get('/queue/current', function(req, res){
        Queue.findOne({}, function(err, queue){
            if(queue) {
                res.json(queue.tracks[queue.pos]);
            } else {
                res.status(404).send("Queue not found");
            }
        });
    })
    app.post('/queue/add/:id', function(req, res){
        // Add a song with id to queue. 
        // First, check if we have a queue, if we don't, then add one. 
        Queue.findOneAndUpdate({}, {$push: {tracks: req.params.id}}, {upsert: true, new: true}, (err, queue) => {
            if(err) { 
                res.status(500).end()
            } else {
                res.send(`Successfully added song with id ${req.params.id} to queue`);
            }
        })
    })


    app.post('/queue/:dir', function(req, res) {
        //Moves queue position. 
        Queue.findOne({}, 'pos', function(err, queue){
            if(queue) {
                if(req.params.dir === 'next') {
                    queue.pos += 1;
                } else if (req.params.dir === 'prev') {
                    queue.pos -= 1;
                } 
                queue.save();
                res.send(queue.pos);
            } else { // We have no queue. Can't advance, so do nothing. 
                res.status(409);
                res.send("Queue not found, please place item in queue and resubmit");
            }
        })
    })

    app.get('/queue/pos', function(req, res){
        Queue.findOne({}, 'pos', function(err, queue){
            if(queue) {
                res.send(`${queue.pos}`);
            } else if (err) {
                res.status(500);
                res.send("Server Error");
            } else {
                res.status(404);
                res.send("Queue not found");
            }
        });
    })

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