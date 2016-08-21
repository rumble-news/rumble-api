'use strict';
const stream = require('getstream-node');
const FeedManager = stream.FeedManager;
const StreamMongoose = stream.mongoose;
const StreamBackend = new StreamMongoose.Backend();
const mongoose = require('mongoose');
const User = mongoose.model('User');
const Follow = mongoose.model('Follow');
const winston = require('winston');
const Post = mongoose.model('Post');


/**
 * Module dependencies.
 */

const { wrap: async } = require('co');
const only = require('only');
const { respond } = require('../utils');
const stormpath = require('express-stormpath')
const assign = Object.assign;


/**
 * Load Current User
 */
exports.loadCurrentUser = function (req, res, next) {
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
exports.load = async(function* (req, res, next, id) {
  try {
    req.profile = yield User.load(id);
    if (!req.profile) return next(new Error('User not found'));
  } catch (err) {
    return next(err);
  }
  next();
});

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

  exports.index = async(function* (req, res) {
    const page = (req.query.page > 0 ? req.query.page : 1) - 1;
    const limit = 30;
    const criteria = req.query.q;
    const options = {
      limit: limit,
      page: page,
      criteria: criteria
    };
    winston.debug({options: options});
    try {
      const users = yield User.list(options);
      const count = yield User.find(criteria).count();
      respond(res, {
        count: count,
        page: page + 1,
        pages: Math.ceil(count / limit),
        users: users
      });
    } catch (err) {
      winston.error(err);
      respond(res, {errors: [err.toString()]}, 500);
    }
  });

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
 * Follow
 */
 exports.follow = async(function* (req, res) {
   winston.info("Creating follow relationship for %s", req.profile.id);
   try {
     var alreadyFollowing = yield req.mongooseUser.isFollowing(req.profile);
     if (alreadyFollowing) {
       respond(res, {error: 'User is already following target'}, 422);
     } else {
       var follow = new Follow({user: req.mongooseUser._id, target: req.profile._id});
       winston.debug("Follow created: ", {follow: follow.toString()});
       yield follow.save();
       yield req.mongooseUser.incrementFollowing();
       yield req.profile.incrementFollowers();
       respond(res, follow);
     }
   } catch (err) {
     winston.error(err);
     respond(res, {errors: [err.toString()]}, 500)
   }
 });

 /**
  * Unfollow
  */
exports.unfollow = async(function* (req, res) {
  winston.debug("Unfollow ", {user: req.mongooseUser.id, target: req.profile.id});
  try {
    var follow = yield Follow.findOne({user: req.mongooseUser, target: req.profile});
    if (follow) {
      winston.info("Removing follow: %s", follow.toString());
      yield follow.remove;
      yield req.mongooseUser.decrementFollowing();
      yield req.profile.decrementFollowers();
      respond(res, {
        type: 'info',
        text: 'Unfollowed successfully'
      }, 200);
    } else {
      respond(res, {error: 'User is not following target'}, 422);
    }
  } catch (err) {
    winston.error(err.toString());
    respond(res, {errors: [err.toString()]}, 500)
  }
});

/**
 * Followers
 */
 exports.followers = async(function* (req, res) {
   const page = (req.query.page > 0 ? req.query.page : 1) - 1;
   const limit = 30;
   const criteria = {target: req.profile._id}
   const populate = 'user'
   const options = {
     limit: limit,
     page: page,
     criteria: criteria,
     populate: populate
   };

   const followers = yield Follow.list(options);
   const count = yield Follow.find(criteria).count();

   respond(res, {
     followers: followers,
     page: page + 1,
     count: count,
     pages: Math.ceil(count / limit)
   });
 });

 /**
  * Following
  */
  //TODO: DRY this up
  exports.following = async(function* (req, res) {
    const page = (req.query.page > 0 ? req.query.page : 1) - 1;
    const limit = 30;
    const criteria = {user: req.profile._id}
    const populate = 'target'
    const options = {
      limit: limit,
      page: page,
      criteria: criteria,
      populate: populate
    };

    const following = yield Follow.list(options);
    const count = yield Follow.find(criteria).count();

    respond(res, {
      following: following,
      page: page + 1,
      count: count,
      pages: Math.ceil(count / limit)
    });
  });

/**
 * Feed
 */

exports.feed = async(function*(req, res){
  var criteria = {user: req.mongooseUser};
  try {
    const posts = yield Post.find(criteria)
                            .sort('-createdAt')
                            .populate('article')
                            .populate({ path: 'children',
                                        populate: {
                                          path: 'user',
                                          select: 'givenName surname _id'
                                        }
                                      });
    posts.map
    const count = yield Post.find(criteria).count();
    //TODO: Paginate results
    respond(res, {
      count: count,
      // page: page + 1,
      // pages: Math.ceil(count / limit),
      posts: posts
    });
  } catch (err) {
    winston.error(err);
    respond(res, {errors: [err.toString()]}, 500);
  }
  // var flatFeed = stream.FeedManager.getUserFeed(req.mongooseUser._id);
  // flatFeed.get({})
  //       .then(function (body) {
  //           console.log(body);
  //           var activities = body.results;
  //           return StreamBackend.enrichActivities(activities);
  //       })
  //       .then(function (enrichedActivities) {
  //           console.log(enrichedActivities);
  //           respond(res, {location: 'feed', user: req.user, activities: enrichedActivities, path: req.url});
  //       })
  //       .catch(function (err) {
  //         console.log(err);
  //       });
});

/******************
  Aggregated Feed
******************/

var enrichAggregatedActivities = function (body) {
    var activities = body.results;
    return StreamBackend.enrichAggregatedActivities(activities);
};

var consolidateFeed = function(feed, onlyPosts=true) {
  //Note: this strips out all activities that are not posts
  var newFeed = [];
  winston.debug("Length of feed is ", feed.length);
  for (var i = 0; i < feed.length; i++) {
    var activityGroup = feed[i];
    if (activityGroup.verb == "Post") {
      var article = activityGroup.activities[0].target;
      var posts = [];
      for (var j = 0; j < activityGroup.activities.length; j++) {
        var activity = activityGroup.activities[j];
        var post = {
          caption: activity.object.caption,
          id: activity.object.id,
          created_at: activity.object.createdAt,
          user: {
            id: activity.actor.id,
            givenName: activity.actor.givenName,
            surname: activity.actor.surname
          }
        };
        posts.push(post);
      }
      var newActivityGroup = {
        activity_count: activityGroup.activity_count,
        group: activityGroup.group,
        created_at: activityGroup.created_at,
        updated_at: activityGroup.updated_at,
        article: article,
        verb: activityGroup.verb,
        id: activityGroup.id,
        posts: posts
      };
      newFeed.push(newActivityGroup);
    } else if (activityGroup.verb == "Follow") {
      var follows = [];
      for (var j = 0; j < activityGroup.activities.length; j++) {
        var activity = activityGroup.activities[j];
        var follow = {
          user: {
            id: activity.actor.id,
            givenName: activity.actor.givenName,
            surname: activity.actor.surname
          }
        };
        follows.push(follow);
      }
      var newActivityGroup = {
        activity_count: activityGroup.activity_count,
        group: activityGroup.group,
        created_at: activityGroup.created_at,
        updated_at: activityGroup.updated_at,
        verb: activityGroup.verb,
        id: activityGroup.id,
        follows: follows
      };
      newFeed.push(newActivityGroup);
    }
  }
  return newFeed;
};

exports.timeline_feed = function(req, res) {
    var aggregatedFeed = FeedManager.getNewsFeeds(req.mongooseUser._id)['timeline'];
    var limit = (typeof req.query.limit !== "undefined" && req.query.limit !== null) ? req.query.limit : 10;
    aggregatedFeed.get({limit: limit, id_lt: req.query.id_lt})
        .then(enrichAggregatedActivities)
        .then(function(enrichedActivities) {
          var feed = consolidateFeed(enrichedActivities);
          respond(res, {feed: feed, path: req.url});
        })
        .catch(function (err) {
          winston.error(err);
          respond(res, err, 500);
        });
};

/**
 * Notification Feed
 */

 exports.notification_feed = function(req, res) {
   winston.debug("Getting notifications for User:%s", req.mongooseUser.id);
   var aggregatedFeed = FeedManager.getNotificationFeed(req.mongooseUser._id);
   var limit = (typeof req.query.limit !== "undefined" && req.query.limit !== null) ? req.query.limit : 10;
   aggregatedFeed.get({limit: limit, id_lt: req.query.id_lt})
       .then(enrichAggregatedActivities)
       .then(function(enrichedActivities) {
          var feed = consolidateFeed(enrichedActivities, false);
          respond(res, {feed: feed, enriched: enrichedActivities});
       })
       .catch(function (err) {
         console.log(err);
         respond(res, err, 500);
       });
 };
