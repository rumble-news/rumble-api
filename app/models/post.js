'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const stream = require('getstream-node');
const FeedManager = stream.FeedManager;
const StreamMongoose = stream.mongoose;

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
  createdAt: { type : Date, default : Date.now }
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
      console.log("IN CREATE ACTIVITY");
      console.log(activity);
      return activity;
  }

// PostSchema.methods.activityActorProp = function() {
//  return 'user';
// }

// PostSchema.methods.activityForeignId = function() {
//   return this.username + ':' + this.item._id;
// };

mongoose.model('Post', PostSchema);

// stream.mongoose.setupMongoose(mongoose);
