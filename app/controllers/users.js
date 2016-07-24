'use strict';

/**
 * Module dependencies.
 */

const { wrap: async } = require('co');
const only = require('only');
const { respond } = require('../utils');
const stormpath = require('express-stormpath')
const assign = Object.assign;

/**
 * Load
 */
exports.load = async(function* (req, res, next) {
  try {
    if (!req.user) return next(new Error('User not found'));
  } catch (err) {
    return next(err);
  }
  next();
});

/**
 * List
 */

// exports.index = async(function* (req, res) {
//   console.log(req.user.username)
//   const page = (req.query.page > 0 ? req.query.page : 1) - 1;
//   const limit = 30;
//   const options = {
//     limit: limit,
//     page: page
//   };
//
//   const articles = yield Article.list(options);
//   const count = yield Article.count();
//
//   respond(res, {
//     title: 'Articles',
//     articles: articles,
//     page: page + 1,
//     pages: Math.ceil(count / limit)
//   });
// });

// Registration handled by Stormpath

/**
 * Edit a user
 */

exports.edit = function (req, res) {
  respond(res, {
    user: req.user
  });
};

/**
 * Update article
 */

exports.update = async(function* (req, res){
  // const user = req.user;
  assign(req.user, only(req.body, 'username email givenName middleName surname status password'));
  console.log(req.user);
  try {
    req.user.save()
    respond(res, req.user);
  } catch (err) {
    respond(res, {
      title: 'Edit ' + req.user.username,
      errors: [err.userMessage],
      article
    }, 422);
  }
});

/**
 * Show
 */

exports.show = function (req, res){
  respond(res, {
    user: req.user
  });
};

/**
 * Delete an article
 */

// exports.destroy = async(function* (req, res) {
//   yield req.article.remove();
//   respond({ req, res }, {
//     type: 'info',
//     text: 'Deleted successfully'
//   }, 200);
// });