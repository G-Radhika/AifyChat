/**
 * Created by radhika on 12/28/16.
 */

'use strict';

var userList = {
    '100054727811509228197' : {id: '100054727811509228197', email: 'sridhar.uyyala@gmail.com', name: 'Sridhar Uyyala', rooms: [{ name: 'Chat1', id: 'Chat1-ID'}, {name: 'Chat2', id: 'Chat2-id'}], friends:['116244100474711041026']},
    '116244100474711041026' : {id: '116244100474711041026', email: 'radhik.g@gmail.com', name: 'Radhika Godugu', rooms: [{ name: 'Chat1', id: 'Chat1-ID'}, {name: 'Chat2', id: 'Chat2-id'}], friends:['100054727811509228197']}
};

var userEmailMapId = {
    'sridhar.uyyala@gmail.com' : '100054727811509228197',
    'radhik.g@gmail.com': '116244100474711041026'
}


exports.findOrCreate = function(user, cb){
    if(userList[user.id] != undefined) {
        return cb(null, user);
    }

    userList[user.id] = {
            id: user.id,
            email: user.email,
            name: user.displayName,
            rooms: ['Aify-default'],
            friends: []
        };
    return cb(null, user);
};


exports.getFriends = function(user) {
    if(userList[user.id] != undefined) {
        return userList[user.id].friends;
    }
    return [];
};

exports.getChats = function(user) {
    if(userList[user.id] != undefined) {
        return userList[user.id].rooms;
    }
    return [];
};

exports.makeFriends = function(user1, user2) {
  if ( (userList[user1.id] &&  userList[user2.id])) {
      userList[user1.id].friends.append(user2.id);
      userList[user2.id].friends.append(user1.id);
  }
};

exports.getUserByEmail = function(email) {
    var userid =  userEmailMapId[email];
    if(userList[userid] != undefined) {
       return {id: userid, displayname: userList[userid].displayName, image: undefined};
    }
    return undefined;
 }

exports.joinRoom = function(room, users) {
    users.forEach(function(user){
        userList[user.id].rooms.push(room);
    });
    console.log("NEW USERLIST AFTER ADDING NEW ROOM" + userList);
};