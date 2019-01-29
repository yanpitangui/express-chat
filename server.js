'use strict';

const express     = require('express');
const session     = require('express-session');
const bodyParser  = require('body-parser');
const fccTesting  = require('./freeCodeCamp/fcctesting.js');
const auth        = require('./app/auth.js');
const routes      = require('./app/routes.js');
const mongo       = require('mongodb').MongoClient;
const passport    = require('passport');
const cookieParser= require('cookie-parser')
const app         = express();
const http        = require('http').Server(app);
const sessionStore= new session.MemoryStore();
const io = require('socket.io')(http);
const cors = require('cors');
const passportSocketIo = require('passport.socketio');
app.use(cors());

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'pug')

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  key: 'express.sid',
  store: sessionStore,
}));


mongo.connect(process.env.MONGO_URI, { useNewUrlParser: true }, (err, db) => {
    if(err) console.log('Database error: ' + err);
  
    auth(app, db.db());
    routes(app, db.db());
      
    http.listen(process.env.PORT || 3000);
    io.use(passportSocketIo.authorize({
      cookieParser: cookieParser,
      key:          'express.sid',
      secret:       process.env.SESSION_SECRET,
      store:        sessionStore
    }));
    var currentUsers = 0;
    var listaUsuarios = [];
    //start socket.io code  
    io.on('connection', socket => {
      let written = new Date();
       ++currentUsers;
      listaUsuarios.push(socket.request.user.name);
      io.emit('user', {name: socket.request.user.name, currentUsers, connected: true, listaUsuarios: listaUsuarios});
      socket.on('disconnect', ()=>{
        --currentUsers;
        listaUsuarios = listaUsuarios.filter((elem)=> { return elem!==socket.request.user.name; });
        io.emit('user', {name: socket.request.user.name, currentUsers, connected: false, listaUsuarios: listaUsuarios});
      });
      socket.on('chat message', message => {
        io.emit('chat message', {name: socket.request.user.name, message});
      });
      
      socket.on('writing', date => {
        //socket.broadcast.emit('user writing', {name: socket.request.user.name, date: date});
      });
    });

    //end socket.io code
  
  
});
