'use strict'

// modules
const express = require('express')
const path = require('path')
const ejs = require('ejs')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const expressValidator = require('express-validator')
const session = require('express-session')
const flash = require('connect-flash')
const passport = require('passport')
var LocalStrategy = require('passport-local').Strategy
const mongodb = require('mongodb')
const mongoose = require('mongoose')

// connect database and save reference
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/voting_db', (err) => {
  err ? console.log(err) : console.log("MongoDB connected successfully!")
})
var db = mongoose.connection;

// app init
const app = express()

// set controllers
const routes = require('./app/controllers/index.js')
const userController = require('./app/controllers/usersController.js')
const pollController = require('./app/controllers/pollController.js')

// view engine
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

// bodyParser
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())

// set public directory
app.use(express.static(path.join(__dirname, 'public')))

// define session
app.use(session({
  secret: 'secret',
  saveUninitialized: true,
  resave: true
}))

// passport
app.use(passport.initialize())
app.use(passport.session())

// validator
app.use(expressValidator({
  errorFormatter: (param, msg, value) => {
    let namespace = param.split('.'),
             root = namespace.shift(),
        formParam = root

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']'
    }

    return {
      param : formParam,
      msg   : msg,
      value : value
    }
  }
}))

// flash
app.use(flash())

// reporting variables
app.use((req, res, next) => {
  res.locals.user = req.user || null
  res.locals.loginError = req.flash('error')
  next()
})

// route root directory to routes in 'routes.js'
app.use('/', routes)
app.use('/u', userController)
app.use('/poll', pollController)

// start server
app.set('port', (process.env.PORT || 3000))
app.listen(app.get('port'), function() {
  console.log("Server listening on port " + app.get('port') + "...")
})
