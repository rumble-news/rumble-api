const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Follow = mongoose.model('Follow');
const findOrCreate = require('mongoose-findorcreate')


/**
 * User Schema
 */

const UserSchema = new Schema({
  href: { type: String, default: '' },
  givenName: { type: String, default: '' },
  surname: { type: String, default: '' }
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
  }
};


// const promisify = require("promisify-node");
// const Promise = require("bluebird");

// exports.findUserByHref = function(href, client) {
//   // Promise.promisify(client.getAccount);
//   client.getAccount(href).then(function(account) {
//     console.log(account);
//     if (err != "undefined" && err != null) {
//       return account
//     } else {
//       return 'unknown'
//     }
//   });
// };

UserSchema.plugin(findOrCreate);

// UserSchema.methods.findFromHref = function(req) {
//   User.findOrCreate({href: req.user.href}, {givenName: req.user.givenName, surname: req.user.surname}, function(err, user, created) {
// };

mongoose.model('User', UserSchema);
