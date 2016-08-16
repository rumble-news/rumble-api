'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const { wrap: async } = require('co');
const only = require('only');
const { respond } = require('../utils');
const Follow = mongoose.model('Follow');
const User = mongoose.model('User');
const assign = Object.assign;
const winston = require('winston');
var promisify = require("promisify-node");

/**
 * Load
 */
exports.load = function (req, res, next) {
  User.findOrCreate({href: req.user.href}, {givenName: req.user.givenName, surname: req.user.surname}, function(err, user, created) {
    if (err) {
      console.log(err);
      next(new Error('User not found'));
    } else {
      req.userId = user._id;
      next();
    }
  });
};

exports.create = async(function* (req, res) {
  winston.info("Creating follow relationship for ", {target: req.body.target});
  try {
    var target = yield User.findOne({_id: req.body.target});
    if (!target) {
      respond(res, {error: 'Target user not found', target: req.body.target}, 404);
    }
    var alreadyFollowing = yield req.mongooseUser.isFollowing(target);
    if (alreadyFollowing) {
      respond(res, {error: 'User is already following target'}, 422);
    } else {
      var follow = new Follow({user: req.mongooseUser, target: target});
      yield follow.save();
      yield req.mongooseUser.incrementFollowing();
      yield target.incrementFollowers();
      respond(res, follow);
    }
  } catch (err) {
    winston.error(err.toString());
    respond(res, {errors: [err.toString()]}, 500)
  }
});
exports.destroy = async(function* (req, res) {
  winston.info("Destroying follow relationship for ", {target: req.body.target});
  try {
    var target = yield User.findOne({_id: req.body.target});
    if (!target) {
      respond(res, {error: 'Target user not found', target: req.body.target}, 404);
    }
    var follow = yield Follow.findOne({user: req.mongooseUser, target: target});
    if (follow) {
      winston.info("Removing %j", follow);
      yield follow.remove;
      respond(res, {
        type: 'info',
        text: 'Deleted successfully'
      }, 200);
    } else {
      respond(res, {error: 'User is not following target'}, 422);
    }
  } catch (err) {
    winston.error(err.toString());
    respond(res, {errors: [err.toString()]}, 500)
  }
});

// router.delete('/follow', ensureAuthenticated, function(req, res) {
//     Follow.findOne({user: req.user.id, target: req.body.target}, function(err, follow) {
//         if (follow) {
//             follow.remove(function(err) {
//                 if (err) next(err);
//                 res.set('Content-Type', 'application/json');
//                 return res.send({'follow': {'id': req.body.target}});
//             });
//         } else {
//             res.status(404).send('Not found');
//         }
//     });
// });
