'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const { wrap: async } = require('co');
const only = require('only');
const { respond } = require('../utils');
const Article = mongoose.model('Article');
const User = mongoose.model('User');
const assign = Object.assign;
const userModel = require('../models/user')

/**
 * Load
 */
exports.load = async(function* (req, res, next, id) {
  try {
    req.article = yield Article.load(id);
    if (!req.article) return next(new Error('Article not found'));
  } catch (err) {
    return next(err);
  }
  next();
});

/**
 * List
 */

exports.index = async(function* (req, res) {
  console.log(req.user.username)
  const page = (req.query.page > 0 ? req.query.page : 1) - 1;
  const limit = 30;
  const options = {
    limit: limit,
    page: page
  };

  const articles = yield Article.list(options);
  const count = yield Article.count();

  respond(res, {
    title: 'Articles',
    articles: articles,
    page: page + 1,
    pages: Math.ceil(count / limit)
  });
});

/**
 * New article
 */

exports.new = function (req, res){
  res.status(200).send( {
    title: 'New Article',
    article: new Article()
  });
};

/**
 * Create an article
 * Upload an image
 */

exports.create = function (req, res) {
  console.log(req.body)
  var article = new Article(only(req.body, 'title url imageURL'));
  // const user = User.findOrCreate({href: req.user.href}, {givenName: req.user.givenName, surname: req.user.surname})
  User.findOrCreate({href: req.user.href}, {givenName: req.user.givenName, surname: req.user.surname}, function(err, user, created) {
    if (err) {
      console.log(err);
    } else {
      article.user = user;
      try {
        article.uploadAndSave();
        res.status(200).send({
          article
        })
      } catch (err) {
        respond(res, {
          title: article.title || 'New Article',
          errors: [err.toString()],
          article
        }, 422);
      }
    }
    // created will be true here
    console.log('A new user from "%s" was inserted', user.href);
  });
  // article.userHref = req.user.href;
  // article.username = req.user.username;
  // const userId = req.user.href.split('/').pop()

  // console.log(article);
  // activity = article.createActivity();
  // console.log(activity);
};

/**
 * Edit an article
 */

exports.edit = function (req, res) {
  respond(res, {
    title: 'Edit ' + req.article.title,
    article: req.article
  });
};

/**
 * Update article
 */

exports.update = async(function* (req, res){
  const article = req.article;
  assign(article, only(req.body, 'title url imageURL'));
  try {
    yield article.uploadAndSave(req.file);
    respond(res, article);
  } catch (err) {
    respond(res, {
      title: 'Edit ' + article.title,
      errors: [err.toString()],
      article
    }, 422);
  }
});

/**
 * Show
 */

exports.show = function (req, res){
  var client = req.app.get('stormpathClient');
  client.getAccount(req.user.href, function(err, account) {
    console.log(account);
    if (err) {
      respond(res, {
        title: req.article.title,
        article: req.article,
        user: 'unknown'
      });
    } else {
      respond(res, {
        title: req.article.title,
        article: req.article,
        user: account
      });
    }
  });

};

/**
 * Delete an article
 */

exports.destroy = async(function* (req, res) {
  yield req.article.remove();
  respond({ req, res }, {
    type: 'info',
    text: 'Deleted successfully'
  }, 200);
});
