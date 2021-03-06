/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const stream = require('getstream-node');
const FeedManager = stream.FeedManager;
const StreamMongoose = stream.mongoose;
const winston = require('winston');

const Schema = mongoose.Schema;

/**
 * Article Schema
 */

var FollowSchema = new Schema({
    user: {type: Schema.Types.ObjectId, required: true, ref: 'User'},
    target: {type: Schema.Types.ObjectId, required: true, ref: 'User'},
  });

FollowSchema.methods = {

};

FollowSchema.statics = {

  /**
   * List followers of target
   */

  list: function (options) {
    winston.debug("Follow.list query: ", options);
    const criteria = options.criteria || {};
    const page = options.page || 0;
    const limit = options.limit || 30;
    return this.find(criteria)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(limit * page)
      .populate(options.populate)
      .exec();
  }
}

FollowSchema.plugin(StreamMongoose.activity);

FollowSchema.methods.activityNotify = function() {
  target_feed = FeedManager.getNotificationFeed(this.target._id);
  return [target_feed];
};

FollowSchema.methods.activityForeignId = function() {
  return this.user._id + ':' + this.target._id;
};

FollowSchema.statics.pathsToPopulate = function(){
  return ['user', 'target'];
};

FollowSchema.post('save', function(doc) {
  if (doc.wasNew) {
    var userId = doc.user._id || doc.user;
    var targetId = doc.target._id || doc.target;
    FeedManager.followUser(userId, targetId);
  }
});

FollowSchema.post('remove', function(doc) {
  FeedManager.unfollowUser(doc.user, doc.target);
});

mongoose.model('Follow', FollowSchema);
