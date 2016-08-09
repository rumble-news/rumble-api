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

exports.create = function (req, res) {
  console.log("Creating follow relationship");
  console.log(req.body.target);
  User.findOne({_id: req.body.target}, function(err, target) {
      console.log(err);
      console.log(target);
      if (target) {
          debugger;
          var followData = {user: req.userId, target: req.body.target};
          var follow = new Follow(followData);
          console.log(followData);
          follow.save(function(err) {
              if (err) {
                console.log(err);
                respond(res, err, 500);
              }
              res.set('Content-Type', 'application/json');
              return res.send({'follow': {'id': req.body.target}});
          });
      } else {
          res.status(404).send('Not found');
      }
  });
  // User.findOne({_id: req.body.target}, function(err, target) {
  //     console.log(err);
  //     console.log(target);
  //     if (target) {
  //         var followData = {user: req.user.id, target: req.body.target};
  //         var follow = new Follow(followData);
  //         follow.save(function(err) {
  //             if (err) next(err);
  //             res.set('Content-Type', 'application/json');
  //             return res.send({'follow': {'id': req.body.target}});
  //         });
  //     } else {
  //         res.status(404).send('Not found');
  //     }
  // });
};

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
