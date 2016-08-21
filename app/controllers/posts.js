'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const { wrap: async } = require('co');
const only = require('only');
const { respond } = require('../utils');
const Post = mongoose.model('Post');
const Article = mongoose.model('Article');
const User = mongoose.model('User');
const assign = Object.assign;
const userModel = require('../models/user');
const winston = require('winston');

/**
 * Load
 */
exports.load = async(function* (req, res, next, id) {
  try {
    req.post = yield Post.load(id);
    if (!req.post) return next(new Error('Post not found'));
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

  const posts = yield Post.list(options);
  const count = yield Post.count();

  respond(res, {
    title: 'Posts',
    posts: posts,
    page: page + 1,
    pages: Math.ceil(count / limit)
  });
});

/**
 * New post
 */

exports.new = function (req, res){
  res.status(200).send( {
    title: 'New Post',
    post: new Post()
  });
};

/**
 * Create a post
 */

exports.getArticle = async(function* (req, res, next) {
  if (typeof req.body.articleUrl !== "undefined" && req.body.articleUrl !== null) {
    try {
      var trimmedUrl = Article.trimUrl(req.body.articleUrl);
      var existingArticle = yield Article.findOne({url: trimmedUrl});
      if (existingArticle) {
        req.article = existingArticle;
        // next();
      } else {
        var objs = yield Article.parseArticle(req.body.articleUrl);
        var article = new Article(objs[0]);
        req.article = yield article.uploadAndSave();
      }

      // req.article = yield Article.findOrCreate(req.body.articleUrl);
      next();
    } catch (err) {
      respond(res, {
        errors: [err.toString()]
      }, 500);
    }
  } else if (typeof req.body.articleId !== "undefined" && req.body.articleId !== null)  {
    Article.load(req.body.articleId).then(function(article) {
      console.log(article);
      req.article = article;
      next();
    }).catch (function(err) {
      console.log(err);
      var errorString = 'Could not find article ' + req.body.articleId;
      respond(res, {error: errorString}, 422);
    });
  } else {
    var errorString = 'Must provide either articleUrl or articleId'
    respond(res, {error: errorString}, 422);
  }
});

exports.create = async(function* (req, res) {
  winston.debug("Article is: %s", req.article.toString());
  var post = new Post(only(req.body, 'caption'));
  post.user = req.mongooseUser;
  post.article = req.article;
  // if (typeof req.body.caption !== "undefined" && req.body.caption !== null) post.caption = req.body.caption;
  // assign(post, only(req.body, 'caption'));
  try {
    var existingPost = yield Post.findOne({user: req.mongooseUser, article: req.article})
    if (existingPost) {
      post = existingPost;
      throw "You have already posted this article";
    }
    var parents = yield Post.getParents(post.user, post.article);
    post.parents = parents;
    // yield post.adjustRumbleScores(req.user.fullName);
    var parentUsers = yield parents.map(function(currentPost) {
      return currentPost.user.incrementRumbleScore(req.user.fullName + " rumbled your post.")
    });
    post.parentUsers = parentUsers;
    yield post.uploadAndSave();
    yield parents.map(function(currentPost) {
      console.log(currentPost);
      currentPost.children.push(post);
      return currentPost.save();
    });
    res.status(200).send({
      post
    })
  } catch (err) {
    respond(res, {
      errors: [err.toString()],
      post
    }, 422);
  }
});

/**
 * Edit an post
 */

exports.edit = function (req, res) {
  respond(res, {
    title: 'Edit ' + req.post.title,
    post: req.post
  });
};

/**
 * Update post
 */

exports.update = async(function* (req, res){
  // Can only update caption
  const post = req.post;
  console.log(req.mongooseUser);
  console.log(post.user);
  if (post.user.equals(req.mongooseUser._id)) {
    assign(post, only(req.body, 'caption'));
    try {
      yield post.uploadAndSave(req.file);
      respond(res, post);
    } catch (err) {
      respond(res, {
        title: 'Edit post',
        errors: [err.toString()],
        post
      }, 422);
    }
  } else {
    respond(res, {
      title: 'Edit ' + post.title,
      errors: ['Cannot update another user\'s post'],
      post
    }, 422);
  }
});

/**
 * Show
 */
//TODO: Fix this function
exports.show = function (req, res){
  respond(res, {
    title: req.post.title,
    post: req.post
  });
};

/**
 * Delete an post
 */

exports.destroy = function (req, res) {
  if (req.post.user.equals(req.mongooseUser._id)) {
    try {
      req.post.remove();
      respond(res, {
        type: 'info',
        text: 'Deleted successfully'
      }, 200);
    } catch (err) {
      respond(res, {
        title: 'Delete post',
        errors: [err.toString()],
        post
      }, 422);
    }
  } else {
    respond(res, {
      errors: ['Cannot update another user\'s post'],
      post
    }, 422);
  }
};

// exports.getParents = function(req, res) {
//   Post.getParents(req.post.user, req.post.article)
//     .then(function(parents) {
//       console.log(parents);
//     })
//     .catch(function(err) {
//       console.log(err);
//     });
//   respond(res, {
//     parents: "none"
//   }, 200);
// };
