// imports
const express = require('express')
const router = express.Router()
const passport = require('passport'),
 LocalStrategy = require('passport-local').Strategy

// import models
const User = require('../models/users.js')
const Poll = require('../models/polls.js')

// set user root path to '/u'
router.get('/', (req, res) => {
  if (req.user) {
    Poll.getPolls((err, polls) => {
      let openPolls = polls

      Poll.findPollsByCreator(req.user._id, (err, userPolls) => {
        res.render('profile', {openPolls: openPolls, userPolls: userPolls})
      })
    })

  } else {
    res.redirect('/')
  }
})

// redirect nonexistant GETs
router.get('/register', (req, res) => {
  res.redirect('/')
})
router.get('/login', (req, res) => {
  res.redirect('/')
})

// handle a POST request to register a user
router.post('/register', (req, res) => {
  // validate user
  req.checkBody('name', 'You must enter a name').notEmpty()
  req.checkBody('username', 'You must enter a username').notEmpty()
  req.checkBody('password', 'You must enter a password').notEmpty()
  req.checkBody('password2', 'The passwords you entered do not match').equals(req.body.password)

  // handles logic based on validation
  if (!req.validationErrors()) {
    // instantiate a User
    var newUser = new User({
      name: req.body.name,
      username: req.body.username,
      password: req.body.password
    })

    // create a User with function from the Model file
    User.createUser(newUser, (err, user) => {
      if (err) throw err
    })

    // display a success message and go to root
    let successMsg = "Account created successfully!"
    Poll.getPolls((err, polls) => {
      res.render('index', {openPolls: polls, message: successMsg})
    })
  } else {
    // render homepage with errors display
    Poll.getPolls((err, polls) => {
      req.getValidationResult().then((result) => {
        res.render('index', {openPolls: polls, errors: result.array()})
      })
    })
  }
})

// defines the local strategy used for user authentication
passport.use('local', new LocalStrategy((username, password, done) => {
  // check the database for the username
  User.getUserByUsername(username, (err, user) => {
    if (err) throw err
    if (!user) {
      return done(null, false, {message: 'Unknown User'})
    }

    // see if provided password matches the username
    User.comparePassword(password, user.password, (err, isMatch) => {
      if (err) throw err
      // if password and username match then return the user object
      if (isMatch) {
        return done(null, user)
      } else {
        return done(null, false, {message: 'Incorrect password'})
      }
    })

  })
}))

// used by passport to maintain session authentication state
passport.serializeUser((user, done) => {
  done(null, user.id)
})

// used by passport to maintain session authentication state
passport.deserializeUser((id, done) => {
  User.getUserById(id, (err, user) => {
    done(err, user)
  })
})

// handles a POST request to log in
router.post('/login',
passport.authenticate('local', {
  successRedirect: '/u',
  failureRedirect: '/',
  failureFlash: true
}))

// logs the user out
router.get('/logout', (req, res) => {
  req.logout()
  res.redirect('/')
})

module.exports = router
