const session     = require('express-session');
const mongo       = require('mongodb').MongoClient;
const passport    = require('passport');
const GitHubStrategy = require('passport-github').Strategy;

module.exports = function (app, db) {
  
    app.use(passport.initialize());
    app.use(passport.session());

    passport.serializeUser((user, done) => {
      done(null, user.id);
    });

    passport.deserializeUser((id, done) => {
        db.collection('chatusers').findOne(
            {id: id},
            (err, doc) => {
                done(null, doc);
            }
        );
    });

    passport.use(new GitHubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: "https://chat-do-yan.glitch.me/auth/github/callback"
      },
      (accessToken, refreshToken, profile, cb) => {
          db.collection('chatusers').findOneAndUpdate(
              {id: profile.id},
              { $set: {
                last_login: new Date(),
                name: profile.displayName || profile.username || 'Anonymous'
                },
               $inc: { 
                 login_count: 1
               },
               $setOnInsert:{
                  id: profile.id,
                  photo: profile.photos[0].value || '',
                  email: profile.email || 'No public email',
                  created_on: new Date(),
                  provider: profile.provider || '',
                  chat_messages: 0
              }
              },
              {upsert:true, new: true} //Insert object if not found, Return new object after modify
          ).then((doc) => cb(null,doc.value)).catch(cb);
        }
    ));
  
}