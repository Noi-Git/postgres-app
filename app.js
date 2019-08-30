// setup server
const express = require('express');
const app = express();
const mustacheExpress = require('mustache-express');
const bodyParser = require('body-parser'); //to parser request and get info out of body
const pgp = require('pg-promise')(/*options*/);
const bcrypt = require('bcrypt');
const session = reauire('express-session');

const PORT = 3000;
const CONNECTION_STRING = "postgres://localhost:5432/newsdb";
const saltRounds = 10;

// config view engine
app.engine('mustache', mustacheExpress());
app.set('views', './views');
app.set('view engine', 'mustache') //set the file extention to .mustache


// setup session
app.use(session({
  secret: 'just something random',
  resave: false,
  saveUninitialized: false
}))

app.use(bodyParser.urlencoded({extended: false}))

const db = pgp(CONNECTION_STRING)

app.post('/login', (req, res) => {

  let username = req.body.username
  let password = req.body.password

  // check if the user exists
  db.oneOrNone('SELECT userid, username, password FROM users WHERE username = $1', [username])
  .then((user) => {
    if(user) { // check for user's password
      // compare password
      bcrypt.compare(password, user.password, function(error, result) {
        if(result) {
          res.send("SUCCESS!")
        } else {
          res.render('login', {message: "Invalid username or password!"})
        }
      })
    } else { // if user does not exist
      res.render('login', {message: "Invalid username or password!"})
    }
  })
})

app.get('/login', (req, res) => {
  res.render('login')
})

app.post('/register', (req, res) => {

  let username = req.body.username
  let password = req.body.password

  //check if username exists
  db.oneOrNone('SELECT userid FROM users WHERE username = $1', [username])
  .then((user) => {
    if(user) {
      res.render('register', {message: "User name already exists!"})
    } else {
      // insert bcrypt
      bcrypt.hash(password, saltRounds, function(error, hash) {
        if(error == null) {
          // insert user into the users table
          db.none('INSERT INTO users(username, password) VALUES($1, $2)', [username,hash])
          .then(() => {
            res.send('SUCCESS')
          })
        }
      })
    }
  })

  // console.log(username);
  // console.log(password)

  // res.send("REGISTER")
})

app.get('/register', (req, res) => {
  res.render('register')
})

app.listen(PORT, () => {
  console.log(`Server has started on ${PORT}`)
})