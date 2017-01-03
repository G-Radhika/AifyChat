'use strict';

var express = require('express');
var expressHandler = express();
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const session = require('express-session');
var passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
var GOOGLE_CLIENT_ID = "346020056758-pvpk5r4dai9s1psf34b7ujjquqpgs1gd.apps.googleusercontent.com";
var GOOGLE_CLIENT_SECRET= "PBrJQO-a-x3iI_1-eo8B_0vl";


var  aifyUsers = require('./users');

//express Middleware
expressHandler.use(express.static(__dirname + '/static'));
expressHandler.use(cookieParser());
expressHandler.use(bodyParser.json()); // for parsing application/json
expressHandler.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// [START session]

var MongoStore = require('connect-mongo')(session);

var sessionStore = new MongoStore({url:"mongodb://localhost/test"});

// Configure the session and session storage.
const sessionConfig = {
    resave: false,
    saveUninitialized: false,
    signed: true,
    secret: GOOGLE_CLIENT_SECRET,
    cookie: { maxAge: 2628000000 },
    store: sessionStore
};

expressHandler.use(session(sessionConfig));
// [END session]

// OAuth2
expressHandler.use(passport.initialize());
expressHandler.use(passport.session());

//expressHandler.use(express.static('public'));
expressHandler.use('/jquery', express.static(__dirname + '/node_modules/jquery/dist/'));

function extractProfile (profile) {
    var imageUrl = '';
    if (profile.photos && profile.photos.length) {
        imageUrl = profile.photos[0].value;
    }
    return {
        id: profile.id,
        displayName: profile.displayName,
        image: imageUrl,
        email: undefined
    };
}

// Use the GoogleStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and Google
//   profile), and invoke a callback with a user object.
passport.use(new GoogleStrategy({
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: "https://f9e63d24.ngrok.io/auth/google/callback"
    },
    function(accessToken, refreshToken, profile, done) {
        var user = extractProfile(profile);
        aifyUsers.findOrCreate(user, function (err, user) {
            return done(err, user);
        });
    }
));

passport.serializeUser(function(user, done) {
    //console.log(null, user);
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    //User.findById(id, function(err, user) {
    //    done(err, user);
    //});
   // console.log(null, obj);
    done(null, obj);
});

// GET /auth/google
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Google authentication will involve
//   redirecting the user to google.com.  After authorization, Google
//   will redirect the user back to this application at /auth/google/callback
expressHandler.get('/auth/google',
    passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login'] }));

// GET /auth/google/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
expressHandler.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    function(req, res) {
        console.log('successfully authenticated');
        res.redirect('/chats.html');
    });

expressHandler.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
});

// respond with "hello world" when a GET request is made to the homepage
expressHandler.get('/friends-json', function (req, res) {
    console.log('GET friends-json');

    res.send(aifyUsers.getFriends(req.user));
});

// respond with "hello world" when a GET request is made to the homepage
expressHandler.get('/chats-json', function (req, res) {
    console.log('GET chats-json');
    console.log(null, req.user);
    console.log(aifyUsers.getChats(req.user));

    res.send(aifyUsers.getChats(req.user));
});


// respond with "hello world" when a GET request is made to the homepage
expressHandler.get('/user-search', function (req, res) {
    console.log('GET user-search');
    res.send(
        [{ 'id' : '8888', 'name': 'Sridhar Uyyala'},
            { 'id': '99999', 'name': 'Radhika Godugu'}
        ]);

});

expressHandler.get('/user-me', function (req, res) {
    console.log('GET user-me ' + req.user);
    res.send(req.user);
});


var server = expressHandler.listen(3000);
var socketio = require('socket.io').listen(server);
var passportSocketIo = require("passport.socketio");


socketio.use(passportSocketIo.authorize({
    key: 'connect.sid',
    secret: GOOGLE_CLIENT_SECRET,
    passport: passport,
    store: sessionStore,
    cookieParser: cookieParser
}));

// Returns a random integer between min (included) and max (excluded)
// Using Math.round() will give you a non-uniform distribution!
function getRandomString(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return (Math.floor(Math.random() * (max - min)) + min).toString;
}

//Chat handling
socketio.sockets.on('connection', function (socket) {
    console.log('client connected');
    var roomid;

    // user data from the socket.io passport middleware
    if (socket.request.user && socket.request.user.logged_in) {
        console.log(null, socket.request.user);

        socket.on('message', function(msg) {
            console.log('messages: ' + msg);
            socketio.sockets.to(roomid).emit('new message', '@' + socket.request.user.displayName + ' :' + msg);
            //add to friend list but list status as pending

        });
        socket.on('roomid', function(msg) {
            console.log(msg);
            roomid = msg;
            socket.join(roomid);
        });

        socket.on('createroom', function(msg) {
            console.log(msg);
            var roomName = msg.roomName;
            var roomid  = msg.roomid;
            var useremails = msg.emails;
            var room = {name: roomName, id: roomid};
            var users = [];
            useremails.forEach(function(email) {
               users.push(aifyUsers.getUserByEmail(email));
            });
            aifyUsers.joinRoom(room, users);
        });
    }
});