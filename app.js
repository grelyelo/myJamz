const express      = require("express"),
mongoose           = require("mongoose"),
redis              = require('redis'),
bodyParser         = require("body-parser"),
url                = require("url"),
session            = require('express-session'),
escapeStringRegexp = require('escape-string-regexp')

var app = express();
let RedisStore = require('connect-redis')(session)

let redisClient = redis.createClient()
//Setup Mongodb connection
mongoose.connect("mongodb://localhost:27017/myJamzTesting", {useNewUrlParser: true});
mongoose.set('useCreateIndex', true);
var conn = mongoose.connection;

const SESSION_LENGTH = 60 * 60 * 24; // Session lasts 24 hours. 
//middleware
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static("public"));
app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: 'secret-key',
    resave: false, 
    saveUninitialized: true,
    name: 'session',
    cookie: {maxAge: 1000 * SESSION_LENGTH} // Expires after 1 minute. 
}));

//Config
app.set("view engine", "ejs");

//for connection
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
    sessionId: String,
    pos: {type: Number, default: 0}, // Position in queue
    tracks: [{type: mongoose.Schema.Types.ObjectId, ref: 'song'}], // Tracks on queue. 
    createdAt: { type: Date, expires: SESSION_LENGTH, default: Date.now }
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

    app.get("/home", function(req, res){
        Song.find({}, function(err, songs){
            if(songs) {
                res.render('home', {songs: songs});
            } else {
                res.render('home', {songs: []})
            }
        })

    })

    app.get("/browse", function(req, res) {
        Release.find({}, function(err, releases){
            if(releases) {
                res.render('browse', {releases: releases});
            } else {
                res.render('browse', {releases: []})
            }
        })
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
            if(songs) {
                res.json(songs);
            } else {
                res.json([]);
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
        Queue.findOne({sessionId: req.session.id}, function(err, queue){
            if(queue) {
                res.json(queue.tracks)
            } else {
                res.json([]);
            }
        })
    })


    app.get('/queue/current', function(req, res){
        Queue.findOne({sessionId: req.session.id}, function(err, queue){
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
        // Use only the queue for current session. 
        Queue.findOne({sessionId: req.session.id}, (err, queue) => {
            if(queue) {
                queue.tracks.push(mongoose.Types.ObjectId(req.params.id));
                queue.save();
                res.redirect("/queue");
            } else {
                queue = new Queue({
                    tracks: [mongoose.Types.ObjectId(req.params.id)],
                    sessionId: req.session.id
                });
                queue.save();
                res.redirect("/queue");
            }
        })
    })

    app.post('/queue/replace', function(req, res){
        //Takes json payload and uses it to replace the existing queue with contents of payload. 
        // For now, just print out, and send response echoing request. 
        Queue.findOne({sessionId: req.session.id}, (err, queue) => {
            if(queue) {
                let newTracks = Array.from(req.body, x => mongoose.Types.ObjectId(x));
                queue.tracks = newTracks;
                queue.pos    = 0;
                queue.save().then(() => {
                    console.log('saved new queue');
                });
                res.redirect('/queue');
            } else {
                let newTracks = Array.from(req.body, x => mongoose.Types.ObjectId(x));
                
                let queue = new Queue({
                    tracks: newTracks, 
                    pos: 0,
                    sessionId: req.session.id
                })

                queue.save().then(() => {
                    console.log('saved new queue');
                }); 
                res.redirect('/queue');
            }
        })
    })

    app.post('/queue/pos/:pos', function(req, res) {
        //Moves queue position. 
        Queue.findOne({sessionId: req.session.id}, function(err, queue){
            if(queue) {
                if(req.params.pos < queue.tracks.length){
                    queue.pos = req.params.pos; 
                    queue.save()
                        .then(q => {
                            res.send(`${q.pos}`);
                        })
                        .catch(err => {
                            res.status(500);
                            res.send('Server Error');
                        })

                } else {
                    res.send(`${queue.pos}`);
                }
            } else { // We have no queue. Can't set pos, so do nothing. 
                res.status(409);
                res.send("Queue not found, please place item in queue and resubmit");
            }
        })
    })

    app.get('/queue/pos', function(req, res){
        Queue.findOne({sessionId: req.session.id}, 'pos', function(err, queue){
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


    app.get("/releases/search/:by/:term", function(req, res){
        var term = req.params.term;
        //Use regular expression to support partial match
        var termRegex = new RegExp(escapeStringRegexp(term), "i");
        var by    = req.params.by;
        var query; 

        if(by === 'title') {
            query = {title: termRegex}
        } else {
            query = {};
        }
        
        //Find by search criteria. 
        
        Release.find(query, function(err, releases) {
            if(releases) {
                res.json(releases);
            } else {
                res.json([]);
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