// imports
const mongoose = require('mongoose')

const User = require('./users.js')

// define poll
var PollModel = mongoose.Schema({
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  pollid: String,
  privacy: String,
  name: String,
  options: Array,
  stage: Number
})

// set Poll equal to a reference of the PollModel mongoose schema
var Poll = module.exports = mongoose.model('Poll', PollModel)

// define Poll methods

// Poll method to insert a Poll into the database
module.exports.createPoll = function(newPoll, cb) {
  newPoll.save(cb)
}

// Poll method to set the owner of the poll
module.exports.setOwner = function(owner, newPoll, cb) {
  owner.polls.push(newPoll)
  User.update({ _id: owner._id }, { $set: { polls: owner.polls }}, cb)
}

// Poll method to update the owner
module.exports.updateOwner = function(owner_id, ownerPolls, index, poll, cb) {
  ownerPolls.splice(index, 1)
  User.update({ _id: owner_id }, { $set: { polls: ownerPolls }}, cb)
}

// Poll method to get a Poll from the DB with provided pollID
module.exports.getPollByPollID = function(pollID, cb) {
  let query = {pollid: pollID}
  Poll.findOne(query, cb)
}

module.exports.findPollsByOwner = function(userid, cb) {
  Poll.findOne({ creator:  userid  }, cb)
}


// Poll method to get all polls from DB
module.exports.getPolls = function(cb) {
  Poll.find({}, cb)
}

// Poll method to save a vote value
module.exports.registerVote = function(thePoll, voteValue, cb) {
  // this mess could probably be avoided with a better mongoose schema
  for (let i = 0; i < thePoll.options.length; i++) {
    if (thePoll.options[i].choice == voteValue) {
      thePoll.options[i].votes += 1
    }
  }
  cb(null, thePoll)
}

// Poll method to update a poll entry
module.exports.updatePollOptions = function(thePoll, cb) {
  Poll.update({ _id: thePoll._id }, { $set: { options: thePoll.options }}, cb)
}

// Poll method to edit
module.exports.updatePoll = function(thePoll, cb) {
  Poll.update({ _id: thePoll._id }, thePoll, cb)
}

// Poll method to find all polls for a User
module.exports.findPollsByCreator = function(userid, cb) {
  Poll.find({ creator: userid }, cb)
}
