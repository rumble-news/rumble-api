'use strict';

/**
 * Module dependencies.
 */

require('./models.js').initialize()

const mongoose = require('mongoose');
const stream = require('getstream-node');
const FeedManager = stream.FeedManager;
const StreamMongoose = stream.mongoose;
const Follow = mongoose.model('Follow');
const Promise = require("bluebird");
const winston = require('winston');
const User = mongoose.model('User');





// const Imager = require('imager');
// const config = require('../../config');
// const imagerConfig = require(config.root + '/config/imager.js');

const Schema = mongoose.Schema;

/**
 * Post Schema
 */

var PostSchema = new Schema({
  article: { type : Schema.ObjectId, ref : 'Article', required: true },
  user: { type : Schema.ObjectId, ref : 'User', required: true },
  caption: { type : String, default : '' },
  createdAt: { type : Date, default : Date.now },
  // Note: parents refers to the parents of this post, i.e. all posts by people
  // this user is following that came happened before this post and reference
  // the same article
  parents: {type: [Schema.ObjectId]},
  parentUsers: {type: [Schema.ObjectId]},
  // Note: parents refers to the children of this post, i.e. all posts by people
  // who follow this user that happened after this post and reference
  // the same article
  children: {type: [Schema.ObjectId]}
});


/**
 * Methods
 */

PostSchema.methods = {

  /**
   * Save post and upload image
   *
   * @param {Object} images
   * @api private
   */

  uploadAndSave: function () {
    const err = this.validateSync();
    if (err && err.toString()) throw new Error(err.toString());
    return this.save();
  }
};

/**
 * Statics
 */

PostSchema.statics = {

  /**
   * Find post by id
   *
   * @param {ObjectId} id
   * @api private
   */

  load: function (_id) {
    winston.debug("Loading post");
    return this.findOne({ _id })
      .exec();
  },

  /**
   * List posts
   *
   * @param {Object} options
   * @api private
   */

  list: function (options) {
    const criteria = options.criteria || {};
    const page = options.page || 0;
    const limit = options.limit || 30;
    return this.find(criteria)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(limit * page)
      .exec();
  },
  getParents: function(user, article) {
    var self = this;
    var getFollowing = Follow.find({user: user}).exec();
    return getFollowing.then(function(following) {
      winston.debug("Get following success");
      return Promise.map(following, function(follow) {
        return follow.target;
      })
    })
    .then(function(followingUsers) {
      return self.find().and([{article: article}, {user: {$in: followingUsers}}]).populate('user').exec();
    });
  }

};

PostSchema.plugin(StreamMongoose.activity);

PostSchema.methods.createActivity = function() {
      var activity = {};
      var extra_data = this.activityExtraData();
      for (var key in extra_data) {
          activity[key] = extra_data[key];
      }
      activity.to = (this.activityNotify() || []).map(function(x){return x.id});
      activity.actor = this.activityActor();
      activity.verb = this.activityVerb();
      activity.object = this.activityObject();
      activity.foreign_id = this.activityForeignId();
      activity.target = this.article;
      if (this.activityTime()) {
          activity.time = this.activityTime();
      }
      return activity;
  }

  PostSchema.methods.activityNotify = function() {
    winston.debug("In activityNotify", {parents: this.parents});
    if (this.parents && this.parents.length > 0) {
      return this.parentUsers.map(function(user) {
        return FeedManager.getNotificationFeed(user);
      });
    } else {
      return [];
    }
};

// PostSchema.methods.activityActorProp = function() {
//  return 'user';
// }

// PostSchema.methods.activityForeignId = function() {
//   return this.username + ':' + this.item._id;
// };

mongoose.model('Post', PostSchema);

// stream.mongoose.setupMongoose(mongoose);
