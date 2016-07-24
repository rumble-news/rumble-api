'use strict';

/**
 * Module dependencies.
 */

const home = require('../app/controllers/home');
const users = require('../app/controllers/users');
const articles = require('../app/controllers/articles');
const comments = require('../app/controllers/comments');
const stormpath = require('express-stormpath')



/**
 * Expose
 */

module.exports = function (app) {

  app.get('/', home.index);

  // user routes
  app.get('/users/current', stormpath.apiAuthenticationRequired, users.show)
  app.get('/users/current', stormpath.apiAuthenticationRequired, users.edit)
  app.put('/users/current', stormpath.apiAuthenticationRequired, users.update)



  // article routes
  app.param('id', articles.load);
  app.get('/articles', stormpath.apiAuthenticationRequired, articles.index);
  // app.get('/articles/new', articles.new);
  app.post('/articles', stormpath.apiAuthenticationRequired, articles.create);
  app.get('/articles/:id', stormpath.apiAuthenticationRequired, articles.show);
  // app.get('/articles/:id/edit', articles.edit);
  app.put('/articles/:id', stormpath.apiAuthenticationRequired, articles.update);
  app.delete('/articles/:id', stormpath.apiAuthenticationRequired, articles.destroy);

  // comment routes
  app.param('commentId', comments.load);
  app.post('/articles/:id/comments', comments.create);
  // app.get('/articles/:id/comments', comments.create);
  app.delete('/articles/:id/comments/:commentId', comments.destroy);


  /**
   * Error handling
   */

  app.use(function (err, req, res, next) {
    // treat as 404
    if (err.message
      && (~err.message.indexOf('not found')
      || (~err.message.indexOf('Cast to ObjectId failed')))) {
      return next();
    }
    console.error(err.stack);
    // error page
    res.status(500).render('500', { error: err.stack });
  });

  // assume 404 since no middleware responded
  app.use(function (req, res, next) {
    res.status(404).send( {
      url: req.originalUrl,
      error: 'Not found'
    });
  });
};