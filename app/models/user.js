const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Follow = mongoose.model('Follow');
const winston = require('winston');
const findOrCreate = require('mongoose-findorcreate')


/**
 * User Schema
 */

const UserSchema = new Schema({
  href: { type: String, default: '' },
  givenName: { type: String, default: '' },
  surname: { type: String, default: '' },
  bio: { type: String, default: '' },
  rumbleScore: {type: Number, default: 0},
  followers: {type: Number, default: 0},
  following: {type: Number, default: 0}
});

UserSchema.methods = {

  /**
   * Get followers
   *
   * @param {Object} images
   * @api private
   */

  getFollowers: function () {
    return Follow.find({target: this._id}).populate('user').execPopulate();
  },

  incrementRumbleScore: function(event, amount = 1) {
    winston.info("Incrementing rumble score for user " + this.givenName + " " + this.surname);
    this.rumbleScore += amount;
    // this.scoreHistory.push({event, amount});
    return this.save();
  },
  incrementFollowers: function() {
    this.followers += 1;
    winston.debug("Incrementing followers for %s", this.id);
    return this.save();
  },
  incrementFollowing: function() {
    this.following += 1;
    winston.debug("Incrementing following for %s", this.id);
    return this.save();
  },
  decrementFollowers: function() {
    this.followers -= 1;
    winston.debug("Decrementing followers for %s", this.id);
    return this.save();
  },
  decrementFollowing: function() {
    this.following -= 1;
    winston.debug("Decrementing following for %s", this.id);
    return this.save();
  },
  isFollowing: function (target) {
    winston.debug("In isFollowing");
    var userId = this._id
    winston.debug("Checking for follow relationship", {user: this.id, target: target.id});
    return Follow.findOne({user: userId, target: target}).exec().then(function(follow) {
      if (!!follow) winston.debug("Already following");
      return new Promise(function(resolve, reject) {
        return resolve(!!follow);
      });
    });
  }
};

/**
 * Statics
 */

UserSchema.statics = {

  /**
   * Find post by id
   *
   * @param {ObjectId} id
   * @api private
   */

  load: function (_id) {
    winston.info("Loading user",{user: _id});
    return this.findOne({ _id }).exec();
  },

  /**
   * List posts
   *
   * @param {Object} options
   * @api private
   */

  list: function (options) {
    winston.debug("In User.List", {options: options});
    const criteria = options.criteria || {};
    const page = options.page || 0;
    const limit = options.limit || 30;
    return this.find(criteria)
      .sort({ lastName: -1 })
      .limit(limit)
      .skip(limit * page)
      .exec();
  },
  findByHref: function(href, client) {
    return new Promise(function(resolve, reject) {
      client.getAccount(href, function(err, account) {
        if (err) {
          return reject(err);
        } else {
          resolve(account);
        }
      });
    });
  }

};

UserSchema.plugin(findOrCreate);

mongoose.model('User', UserSchema);
