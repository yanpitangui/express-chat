"use strict";

const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const auth = require("./app/auth.js");
const routes = require("./app/routes.js");
const mongo = require("mongodb").MongoClient;
const passport = require("passport");
const cookieParser = require("cookie-parser");
const app = express();
const http = require("http").Server(app);
const sessionStore = new session.MemoryStore();
const io = require("socket.io")(http);
const cors = require("cors");
const passportSocketIo = require("passport.socketio");
app.use(cors());

fccTesting(app); //For FCC testing purposes
app.use("/public", express.static(process.cwd() + "/public"));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "pug");

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    key: "express.sid",
    store: sessionStore
  })
);

function isInArray(value, array) {
  return array.indexOf(value) > -1;
}

mongo.connect(process.env.MONGO_URI, { useNewUrlParser: true }, (err, db) => {
  if (err) console.log("Database error: " + err);

  auth(app, db.db());
  routes(app, db.db());

  http.listen(process.env.PORT || 3000);
  io.use(
    passportSocketIo.authorize({
      cookieParser: cookieParser,
      key: "express.sid",
      secret: process.env.SESSION_SECRET,
      store: sessionStore
    })
  );

  function gera_cor() {
    var hexadecimais = "0123456789ABCDEF";
    var cor = "#";
    // Pega um número aleatório no array acima
    for (var i = 0; i < 6; i++) {
      //E concatena à variável cor
      cor += hexadecimais[Math.floor(Math.random() * 16)];
    }
    return cor;
  }
  
  var currentUsers = 0;
  var listaUsuarios = [];
  //start socket.io code
  io.on("connection", socket => {    
    socket.request.user.color = gera_cor();
    let written = new Date();
    if (!isInArray(socket.request.user.name, listaUsuarios)) {
      listaUsuarios.push({
        name: socket.request.user.name,
        color: socket.request.user.color
      });
      currentUsers = listaUsuarios.length;
      io.emit("user", {
        name: socket.request.user.name,
        currentUsers,
        connected: true,
        listaUsuarios: listaUsuarios,
        color: socket.request.user.color
      });
    }

    socket.on("disconnect", () => {
      listaUsuarios = listaUsuarios.filter(elem => {
        return elem.name !== socket.request.user.name;
      });
      currentUsers = listaUsuarios.length;
      io.emit("user", {
        name: socket.request.user.name,
        currentUsers,
        connected: false,
        listaUsuarios: listaUsuarios,
        color: socket.request.user.color
      });
    });
    socket.on("chat message", message => {
      io.emit("chat message", {
        name: socket.request.user.name,
        message,
        color: socket.request.user.color
      });
    });

    socket.on("writing", date => {
      socket.broadcast.emit("user writing", {
        name: socket.request.user.name,
        date: date
      });
    });
  });

  //end socket.io code
});
