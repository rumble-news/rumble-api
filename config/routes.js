'use strict';

/**
 * Module dependencies.
 */

const home = require('../app/controllers/home');
const users = require('../app/controllers/users');
const articles = require('../app/controllers/articles');
const posts = require('../app/controllers/posts');
const follows = require('../app/controllers/follows');
const stormpath = require('express-stormpath')



/**
 * Expose
 */

module.exports = function (app) {

  app.get('/', home.index);

  // Find or create user id
  app.all('/*', stormpath.apiAuthenticationRequired, users.loadCurrentUser);

  // user routes
  app.get('/users/me', stormpath.apiAuthenticationRequired, users.current);
  app.put('/users/me', stormpath.apiAuthenticationRequired, users.update);
  app.param('userId', users.load);
  app.get('/users', stormpath.apiAuthenticationRequired, users.index);
  app.put('/users/:userId', stormpath.apiAuthenticationRequired, users.show);
  app.put('/users/:userId/follow', stormpath.apiAuthenticationRequired, users.follow);
  app.put('/users/:userId/unfollow', stormpath.apiAuthenticationRequired, users.unfollow);
  app.get('/users/:userId/followers', stormpath.apiAuthenticationRequired, users.followers);
  app.get('/users/:userId/following', stormpath.apiAuthenticationRequired, users.following);




  // follow
  // app.all('/follow', stormpath.apiAuthenticationRequired, follows.load);


  // Feed

  app.get('/feed', stormpath.apiAuthenticationRequired, users.feed);
  app.get('/timeline', stormpath.apiAuthenticationRequired, users.timeline_feed);
  app.get('/notifications', stormpath.apiAuthenticationRequired, users.notification_feed);

  // article routes
  app.param('articleId', articles.load);
  app.get('/articles', stormpath.apiAuthenticationRequired, articles.index);
  // app.get('/articles/new', articles.new);
  app.post('/articles', stormpath.apiAuthenticationRequired, articles.create);
  app.get('/articles/:articleId', stormpath.apiAuthenticationRequired, articles.show);
  // app.get('/articles/:id/edit', articles.edit);
  app.put('/articles/:articleId', stormpath.apiAuthenticationRequired, articles.update);
  app.delete('/articles/:articleId', stormpath.apiAuthenticationRequired, articles.destroy);

  // post routes
  app.param('postId', posts.load);
  app.post('/posts', stormpath.apiAuthenticationRequired, posts.getArticle);
  app.post('/posts', stormpath.apiAuthenticationRequired, posts.create);
  app.get('/posts/:postId', stormpath.apiAuthenticationRequired, posts.show);
  app.put('/posts/:postId', stormpath.apiAuthenticationRequired, posts.update);
  app.delete('/posts/:postId', stormpath.apiAuthenticationRequired, posts.destroy);


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
