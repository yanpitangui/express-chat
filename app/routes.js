const passport    = require('passport');

module.exports = function (app, db) {
  
    function ensureAuthenticated(req, res, next) {
      if (req.isAuthenticated()) {
          return next();
      }
      res.redirect('/');
    };
  
  
    function alreadyAuthenticated(req, res, next) {
      if(req.isAuthenticated()){
        res.redirect('/chat');
      }
      return next();
    }

    app.route('/auth/github')
      .get(passport.authenticate('github'));

    app.route('/auth/github/callback')
      .get(passport.authenticate('github', { failureRedirect: '/' }), (req,res) => {
          req.session.user_id = req.user.id;
          res.redirect('/chat');
      });

    app.route('/')
      .get(alreadyAuthenticated, (req, res) => {
        res.render(process.cwd() + '/views/pug/index');
      });

    app.route('/chat')
      .get(ensureAuthenticated, (req, res) => {
           res.render(process.cwd() + '/views/pug/chat', {user: req.user});
      });

    app.route('/logout')
      .get((req, res) => {
          req.logout();
          res.redirect('/');
      });

    app.use((req, res, next) => {
      res.status(404)
        .type('text')
        .send('Not Found');
    });
  
}