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
const winston = require('winston');

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
 * Update article
 */

exports.update = async(function* (req, res){
  var article = req.article;
  assign(article, only(req.body, 'provider_name description thumbnail_url provider_url url author_name title'));
  winston.debug("Article is: ", article.toString());
  try {
    yield article.save();
    respond(res, article);
  } catch (err) {
    respond(res, {
      errors: [err.toString()],
      article
    }, 422);
  }
});

/**
 * Show
 */

exports.show = function (req, res){
  respond(res, req.article);
};

/**
 * Delete an article
 */
//TODO: If you end up using this route, you need to also destry all associated posts
exports.destroy = async(function* (req, res) {
  yield req.article.remove();
  respond({ req, res }, {
    type: 'info',
    text: 'Deleted successfully'
  }, 200);
});
