// imports
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const Poll = require('./polls.js')

// define user
var UserModel = mongoose.Schema({
  username: {
    type: String,
    index: true
  },
  password: {
    type: String
  },
  email: {
    type: String
  },
  name: {
    type: String
  },
  polls: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Poll' }],
  choice: Array
})

// set User equal to a reference of the UserModel mongoose schema
var User = module.exports = mongoose.model('User', UserModel)

// define User methods

// insert a User into the DB and hash their password
module.exports.createUser = function(newUser, cb) {
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(newUser.password, salt, (err, hash) => {
      newUser.password = hash
      newUser.save(cb)
    })
  })
}

// User method to find a user in the DB with the provided username
module.exports.getUserByUsername = function(username, cb) {
  let query = {username: username}
  User.findOne(query, cb)
}

// User method to find a user in the DB with provided ID
module.exports.getUserById = function(id, cb) {
  User.findById(id, cb)
}

// checks if user provided password matches a users password in the DB
module.exports.comparePassword = function(checkPassword, hash, cb) {
  bcrypt.compare(checkPassword, hash, (err, isMatch) => {
    if (err) throw err
    cb(null, isMatch)
  })
}


module.exports.findPollsByCreator = function(userid, cb) {
  Poll.find({ creator: userid }, cb)
}

module.exports.registerVoteToUser = function(userid,pollid,voteValue, cb) {
  User.getUserById(userid, (err, olduser) => {
    if (err) throw err
   var len =  olduser.polls.length;
   olduser.polls[len] = pollid;
    olduser.choice[len] = voteValue;
    console.log("the new user is" + olduser);
   User.updatePolls(olduser, (err) => {
    if (err) throw err
   });
   cb();
  });
}
// Poll method to update a poll entry
module.exports.updatePolls = function(olduser, cb) {
  User.update({ _id: olduser._id }, { $set: { polls: olduser.polls, choice: olduser.choice }}, cb)
}
