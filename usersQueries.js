'use strict';

var mongoose = require('mongoose');
var UsersDatabase = null;

exports.initDatabase = function() {

    //Lets connect to our database using the DB server URL.
    mongoose.connect('mongodb://localhost/sridhar_db1');
    const Schema = mongoose.Schema;

    var usersSchema = new Schema({
        name: {type: String, required: true},
        email: { type: String, unique: true, required: true },
        id: {type: String, unique: true, required: true},
        chatRooms: [String]
    });

    UsersDatabase = mongoose.model('usersDatabase', usersSchema);
};
// create new User.
exports.findOrCreate = function(userProps, cb){
    if(userProps.id != undefined){
        UsersDatabase.find({id: userProps.id}, function (err, entry) {
            console.log('user already exists in database FIND OR CREATE');
            if(err)
                return cb(err);

            if(entry != null)
                return cb(null);

            const newUser = new UsersDatabase({name: userProps.displayname, email: userProps.email, id: userProps.id, chatRooms:['']});

            newUser.save(function(err, userobj) {
                if(err) {
                    console.error(err);
                    return cb(err);
                }
                console.log(userobj);
                return cb(null);
            });
        });
    }
};

exports.getChats = function(user) {
    UsersDatabase.find({id: user.id}, function (err, entry) {
        if(err)
            return [];

        if(!entry)
            return [];

        if(entry != null) {
            console.log(entry.chatRooms);
            return entry.chatRooms;
        }
    });
};
exports.joinRoom = function(roomid, emails) {
    UsersDatabase.find({email: emails}, function(err, entry){
        if(err)
            return (err);
        if(!entry)
            return;
        console.log(null, entry);
        if(entry != null){
            entry.forEach(function(){
                if(roomid != entry.chatRooms){
                   console.log("Chat room exists");
                   alert("Chat room exists");
                   return(err);
                }else{
                    console.log('adding room: ' + roomid);
                    console.log(emails);
                    emails.forEach(function (userEmail) {
                        UsersDatabase.findOneAndUpdate(
                            {email: userEmail},
                            {$push: {"chatRooms": roomid}},
                            {safe: true, upsert: true},
                            function(err, model) {
                                console.log(err);
                            });
                        return entry.chatRooms;
                    })
                }
            })
        }
    })
};

/*exports.joinRoom = function(roomid, emails) {
    UsersDatabase.find({email: emails}, function(){
        console.log('adding room: ' + roomid);
        console.log(emails);
        emails.forEach(function (userEmail) {
            UsersDatabase.findOneAndUpdate(
                {email: userEmail},
                {$push: {"chatRooms": roomid}},
                {safe: true, upsert: true},
                function(err, model) {
                    console.log(err);
                });
        })
    })
};*/