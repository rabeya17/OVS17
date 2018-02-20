// imports
const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
// import models
const Poll = require('../models/polls.js')
const User = require('../models/users.js')

// can only be accessed by an authenticated user
/* generates a random Key to function as the poll ID,
   and shifts responsibility to a '/poll/:pollID' GET request */
router.get('/', (req, res) => {
  if (req.user) {
   
    var pollID = generateRandomNumber()
    res.redirect('/poll/' + pollID)

  } else {
    res.redirect('/')
  }
})

// can only be accessed by an authenticated user
/*
   */
router.get('/:pollID', (req, res) => {
  Poll.getPollByPollID(req.params.pollID, (err, thePoll) => {
    if (err) throw err
    if (thePoll === null) {
      if (req.user) {
        let pollid = req.params.pollID
        res.locals.pollid = pollid
        res.render('polls')

      } else {
        res.redirect('/')
      }

    } else {
      res.redirect('/')
    }
  })
})

// saves poll to the DB
router.post('/:pollID', (req, res) => {
  Poll.getPollByPollID(req.params.pollID, (err, thePoll) => {
    if (err) throw err

    if (thePoll === null) {
      if (req.user) {
        // validate poll integrity
        req.checkBody('name', 'You must enter a name').notEmpty()

        // set poll privacy level
        let privacyLevel;
        if (req.body.private === 'on') {
          privacyLevel = 'private'
        } else if (req.body.public === 'on') {
          privacyLevel = 'public'
        } else {
          alert('An unknown error has occured')
          return;
        }

        // handles logic based on validation
        if (!req.validationErrors()) {
          // instantiate a Poll, save to DB
          var newPoll = new Poll({
            creator: req.user._id,
            pollid: req.params.pollID,
            privacy: privacyLevel,
            name: req.body.name,
            stage: 1
          })
          /* set the poll 'options' to an array of objects,
             every object has a 'choice' and 'votes' value */
          // init array to hold any number of options
          let tempArray = req.body.option
          // create an object from the temp array and add it to 'options'
          for (let i = 0; i < tempArray.length; i++) {
            let pollOptions = {choice: tempArray[i], votes: 0}
            newPoll.options[i] = pollOptions
          }

          // create a Poll with function from the Model file
          Poll.createPoll(newPoll, (err, poll) => {
            if (err) throw err

            Poll.setOwner(req.user, poll, (err, owner) => {
              if (err) throw err

            })
          })

          // display a success message and go to root
          res.redirect('/')

        } else {
          // render homepage
          res.render('profile')
        }

      } else {
        res.redirect('/')
      }

    } else {
      res.redirect('/')
    }
  })
})

// handle request for unauthenticated user to vote in a poll
router.get('/vote/:pollID', (req, res) => {
   // console.log("the user is " + typeof req.user);
    Poll.getPollByPollID(req.params.pollID, (err, thePoll) => {
      if (err) throw err
        console.log("current stage is " + thePoll.stage);
      if (typeof req.user != "undefined" && (thePoll.stage ===1 || thePoll.stage ===3) && req.user.polls.indexOf(String(thePoll._id)) === -1 &&  req.user.name !== "aaa" ) 
    {      
        res.render('vote', {poll: thePoll, req: req})
    }
    else{
       res.redirect('/poll/results/' + req.params.pollID);
    }
    })

})


// handle request for unauthenticated user to vote in a poll
router.get('/votesecond/:pollID', (req, res) => {
   console.log("the reqa is " + req.params.pollID);
    Poll.findPollsByOwner(req.params.pollID, (err, thePoll) => {
      if (err) throw err
         res.redirect('/poll/vote/' + thePoll.pollid);
    })

})

// handle request for unauthenticated user to vote in a poll
router.get('/close/:pollID', (req, res) => {
    Poll.getPollByPollID(req.params.pollID, (err, thePoll) => {
      if (err) throw err
          let updatedPoll = thePoll;
          let totalVotes = 0;
          for (var i = 0; i < updatedPoll.options.length; i++) {
            totalVotes += updatedPoll.options[i].votes;
          }
          let winner = -1;
          for (var i = 0; i < updatedPoll.options.length; i++) {
            if (updatedPoll.options[i].votes >= 0.5 * totalVotes) {
              winner = i;
            }
          }
          if (winner > -1 && updatedPoll.stage ===1 ) {
            updatedPoll.stage = 999;
            Poll.updatePoll(updatedPoll, (err, newpoll) => {
              if (err) throw err
              res.send("the winner is " + updatedPoll.options[winner].choice);
            })
          }
          else if ( updatedPoll.stage ===2 ) {
            updatedPoll.stage = 998;
            Poll.updatePoll(updatedPoll, (err, newpoll) => {
              if (err) throw err
              res.send("2nd vote closed");
            })
          }
          else
          { 
            var dict = [];
            for (var i = 0; i < updatedPoll.options.length; i++) {
            dict[updatedPoll.options[i].choice] = updatedPoll.options[i].votes;
            }
            
            var top =3;
            var newoptions = [];
            for (var i = 1; i <= top; i++) {
              var max = 0;
              var maxChoice = "";
              for (var key in dict){
                if (dict[key] > max) {
                  console.log("in the loop" + key + "sss"+ dict[key]);
                  max = dict[key];
                  maxChoice = key;
                }

              };
               newoptions.push(maxChoice);
              delete dict[maxChoice];
              };

             var newPoll = new Poll({
            creator: updatedPoll._id,
            pollid: generateRandomNumber(),
            privacy: "public",
            name: updatedPoll.name + " " + "2nd vote",
            stage: 3
          });

          for (let i = 0; i < newoptions.length; i++) {
            let pollOptions = {choice: newoptions[i], votes: 0}
            newPoll.options[i] = pollOptions
          };
          updatedPoll.stage = 2;
            Poll.updatePoll(updatedPoll, (err, newpoll) => {
              if (err) throw err
              console.log("blah");
            });
             Poll.createPoll(newPoll, (err, poll) => {
              if (err) throw err
              res.send("no one wins, created 2nd poll"); 
             })

          }

    })

})


// applies the users vote and saves to DB
router.post('/vote/:pollID', (req, res) => {
  // get value from button clicked
  let voteValue = Object.keys(req.body)[0];
  // get the poll
  Poll.getPollByPollID(req.params.pollID, (err, thePoll) => {
    if (err) throw err
    // increase the vote count
    Poll.registerVote(thePoll, voteValue, (err, updatedPoll) => {
      if (err) throw err
      // update poll in DB
      Poll.updatePollOptions(updatedPoll, (err, savedPoll) => {
        if (err) throw err
        User.registerVoteToUser(req.user._id, thePoll._id, voteValue, (err) =>{
          if (err) throw err
        })
        

        // redirect to results view to display data
        res.redirect('/poll/results/' + req.params.pollID)
      })
    })
  })
})

// render the page for poll results
router.get('/results/:pollID', (req, res) => {
  console.log("go to results");
  if (typeof req.user == "undefined"  ||  req.user.name === "aaa"){
   Poll.getPollByPollID(req.params.pollID, (err, thePoll) => {
      if (err) throw err
      res.render('results', {poll: thePoll,vote: false, req: req})
    })
  }
  else {
    let userVote = "";
     Poll.getPollByPollID(req.params.pollID, (err, thePoll) => {
      if (err) throw err
    userVote = req.user.choice[req.user.polls.indexOf(String(thePoll._id))];
    res.render('results', {poll: thePoll, vote: userVote, req: req});
    })
    
  }
})

// return JSON for XMLHttpRequest used to display results
router.get('/results/json/:pollID', (req, res) => {
  Poll.getPollByPollID(req.params.pollID, (err, thePoll) => {
    if (err) throw err

    res.json(thePoll)
  })
})

// authenticated user can destroy own polls
router.post('/delete/:pollID', (req, res) => {
  if (req.user) {
    let thePollID = Object.keys(req.body)[0]

    // query poll twice, bad bad bad, hack
    Poll.getPollByPollID(thePollID, (err, thePoll) => {
      if (String(req.user._id) === String(thePoll.creator)) {

        Poll.findOneAndRemove({ pollid: thePoll.pollid }, (err, poll) => {
          if (err) throw err

          let deletedPoll = poll._id
          let userPollRefs = req.user.polls
          for (let i = 0; i < userPollRefs.length; i++) {

            let pollRef = userPollRefs[i]
            if (String(deletedPoll) == String(pollRef)) {
              let index = userPollRefs.indexOf(deletedPoll)
              Poll.updateOwner(req.user._id, req.user.polls, index, deletedPoll, (err, owner) => {

              })
            }

          }
          res.redirect('/u')
        })

      // redirect if not the poll owner
      } else {
        res.redirect('/')
      }
    })

  // redirect if not logged in
  } else {
    res.redirect('/')
  }
})

// route for user to edit a poll
router.get('/edit/:pollID', (req, res) => {
  if (req.user) {
    let thePollID = req.params.pollID

    // find the poll to edit
    Poll.getPollByPollID(thePollID, (err, thePoll) => {
      // make sure the poll is being accessed by the creator
      if (String(req.user._id) === String(thePoll.creator)) {
        res.render('polls', {poll: thePoll})

      } else {
        res.redirect('/')
      }
    })

  } else {
    res.redirect('/')
  }
})

// post request to update an edited poll
router.post('/edit/:pollID', (req, res) => {

  let thePollID = req.params.pollID
  Poll.getPollByPollID(thePollID, (err, thePoll) => {
    // set poll privacy level
    let privacyLevel;
    if (req.body.private === 'on') {
      privacyLevel = 'private'
    } else if (req.body.public === 'on') {
      privacyLevel = 'public'
    } else {
      alert('An unknown error has occured')
      return;
    }

    // update poll values
    thePoll.privacy = privacyLevel,
    thePoll.name = req.body.name

    /* set the poll 'options' to an array of objects,
       every object has a 'choice' and 'votes' value */
    // init array to hold any number of options
    let tempArray = req.body.option
    // create an object from the temp array and add it to 'options'
    for (let i = 0; i < tempArray.length; i++) {
      let pollOptions = {choice: tempArray[i], votes: 0}
      thePoll.options[i] = pollOptions
    }

    Poll.updatePoll(thePoll, (err, updatedPoll) => {

      res.redirect('/u')
    })
  })
})

// generates a random number, used as a poll ID
function generateRandomNumber() {
  let randomNumber = Math.floor(Math.random() * 999999).toString()
  return randomNumber
}


module.exports = router
