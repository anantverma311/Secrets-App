require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");  //for encryption of database
// const md5 = require("md5"); // for hashing strings or passwords in this case
// const bcrypt = require("bcrypt"); //for bcrypt salting and hashing
// const saltRounds = 10;
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

//setting up sessions

app.use(
  session({
    secret: "our little secret.",
    resave: false,
    saveUninitialized: false,
  })
);

//initializing passport

app.use(passport.initialize());

//connecting passport with sessions

app.use(passport.session());

// setting up mongodb servers

mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

//enable passportlocalmongoose plugin for our schema

userSchema.plugin(passportLocalMongoose);

//adding encryption to our password section of the database

// userSchema.plugin(encrypt, {
//   secret: process.env.SECRET,
//   encryptedFields: ["password"],
// });

//created model for our database

const User = new mongoose.model("User", userSchema);

//for setting up passport-mongoose-local

passport.use(User.createStrategy());

//create a cookie
passport.serializeUser(User.serializeUser());

//destroyes a cookie
passport.deserializeUser(User.deserializeUser());

// carrying out all the get requests to the html pages

app.get("/", function (req, res) {
  res.render("home");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/secrets", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

app.get("/logout" , (req ,res) => {
    req.logOut();
    res.redirect("/");
});

// carrying out basic level-1 secuity of authentication (register / login)

app.post("/register", function (req, res) {
  //using bcrypt
  //   bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
  //     // Store hash in your password DB.
  //     if (!err) {
  //       const user = new User({
  //         email: req.body.username,
  //         password: hash,
  //       });
  //       user.save(function (err) {
  //         if (!err) {
  //           res.render("secrets");
  //         } else {
  //           console.log(err);
  //         }
  //       });
  //     } else {
  //       console.log(err);
  //     }
  //   });

  //using passport-local-mongoose
  User.register({ username: req.body.username }, req.body.password, function (
    err,
    user
  ) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });
});

app.post("/login", function (req, res) {
  //   const username = req.body.username;
  //   const password = req.body.password;
  //   User.findOne({ email: username }, function (err, foundUser) {
  //     if (!err) {
  //       if (foundUser) {
  //         bcrypt.compare(password, foundUser.password, function (err, result) {
  //           if (!err) {
  //             if (result === true) {
  //               res.render("secrets");
  //             }
  //           } else {
  //             console.log(err);
  //           }
  //         });
  //       }
  //     } else {
  //       console.log(err);
  //     }
  //   });

  //login using passport-local-mongoose

  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });

  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });
});

app.listen(3000, function () {
  console.log("server started at port 3000");
});
