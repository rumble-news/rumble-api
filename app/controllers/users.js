'use strict';
const stream = require('getstream-node');
const FeedManager = stream.FeedManager;
const StreamMongoose = stream.mongoose;
const StreamBackend = new StreamMongoose.Backend();
const mongoose = require('mongoose');
const User = mongoose.model('User');


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
exports.load = function (req, res, next) {
  User.findOrCreate({href: req.user.href}, {givenName: req.user.givenName, surname: req.user.surname}, function(err, user, created) {
    if (err) {
      console.log(err);
      next(new Error('User not found'));
    } else {
      req.mongooseUser = user;
      next();
    }
  });
};

/**
 * Load
 */
// exports.load = async(function* (req, res, next) {
//   try {
//     if (!req.user) return next(new Error('User not found'));
//   } catch (err) {
//     return next(err);
//   }
//   next();
// });

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
 * Update user
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
 * Feed
 */

exports.feed = function (req, res){
  var flatFeed = stream.FeedManager.getUserFeed(req.mongooseUser._id);
  flatFeed.get({})
        .then(function (body) {
            console.log(body);
            var activities = body.results;
            return StreamBackend.enrichActivities(activities);
        })
        .then(function (enrichedActivities) {
            console.log(enrichedActivities);
            respond(res, {location: 'feed', user: req.user, activities: enrichedActivities, path: req.url});
        })
        .catch(function (err) {
          console.log(err);
        });
};

/******************
  Aggregated Feed
******************/

var enrichAggregatedActivities = function (body) {
    var activities = body.results;
    return StreamBackend.enrichAggregatedActivities(activities);
}

exports.timeline_feed = function(req, res) {
    var aggregatedFeed = FeedManager.getNewsFeeds(req.mongooseUser._id)['timeline'];
    var limit = (typeof req.query.limit !== "undefined" && req.query.limit !== null) ? req.query.limit : 10;
    aggregatedFeed.get({limit: limit, id_lt: req.params.id_lt})
        .then(enrichAggregatedActivities)
        .then(function(enrichedActivities) {
            respond(res, {location: 'aggregated_feed', user: req.user, activities: enrichedActivities, path: req.url});
        })
        .catch(function (err) {
          console.log(err);
          respond(res, err, 500);
        });
};

/**
 * Notification Feed
 */

 exports.notification_feed = function(req, res) {
     var aggregatedFeed = FeedManager.getNotificationFeed(req.mongooseUser._id);
     var limit = (typeof req.query.limit !== "undefined" && req.query.limit !== null) ? req.query.limit : 10;
     aggregatedFeed.get({limit: limit, id_lt: req.params.id_lt})
         .then(enrichAggregatedActivities)
         .then(function(enrichedActivities) {
             respond(res, {location: 'aggregated_feed', user: req.user, activities: enrichedActivities, path: req.url});
         })
         .catch(function (err) {
           console.log(err);
           respond(res, err, 500);
         });
 };
