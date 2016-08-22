'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const stream = require('getstream-node');
const FeedManager = stream.FeedManager;
const StreamMongoose = stream.mongoose;
const promisify = require("promisify-node");
const embedly = require('embedly');
const util = require('util');
const config = require('../../config');
const only = require('only');
const urlTrim = require('url-trim');
const winston = require('winston');

//TODO: Add URLs that require query params here
var specialUrls = ['https://www.youtube.com/*']

// const Imager = require('imager');
// const config = require('../../config');
// const imagerConfig = require(config.root + '/config/imager.js');

const Schema = mongoose.Schema;

/**
 * Article Schema
 */

var ArticleSchema = new Schema({
  title: { type : String, default : '', trim : true },
  author_name: { type : String, default : '', trim : true },
  url: { type : String, default : '', trim : true, required: true},
  provider_url: { type : String, default : '', trim : true, required: true},
  thumbnail_url: { type : String,  default : ''},
  thumbnail_with: {type: Number},
  thumbnail_height: {type: Number},
  description: { type : String,  default : ''},
  createdAt: { type : Date, default : Date.now },
  provider_name: {type : String, detault: ''}
});


/**
 * Validations
 */

// ArticleSchema.path('title').required(true, 'Article title cannot be blank');
ArticleSchema.path('url').required(true, 'Article url cannot be blank');

/**
 * Pre-remove hook
 */

ArticleSchema.pre('remove', function (next) {
  // const imager = new Imager(imagerConfig, 'S3');
  // const files = this.image.files;

  // if there are files associated with the item, remove from the cloud too
  // imager.remove(files, function (err) {
  //   if (err) return next(err);
  // }, 'article');

  next();
});

/**
 * Methods
 */

ArticleSchema.methods = {

  /**
   * Save article and upload image
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

ArticleSchema.statics = {

  /**
   * Find article by id
   *
   * @param {ObjectId} id
   * @api private
   */

  load: function (_id) {
    return this.findOne({ _id })
      .exec();
  },

  /**
   * List articles
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

  findOrCreate: function(url) {
    var re = new RegExp(specialUrls.join("|"), "i");
    var self = this;
    winston.debug("Original url: %s", url);
    if (url.match(re) == null) {
      url = urlTrim(url);
      winston.debug("Trimmed url: %s", url);
    }
    this.findOne({url: url}).exec().then(function(article) {
      if (typeof article !== "undefined" && article !== null) {
        return new Promise(function(resolve, reject) {
          winston.debug("Article found: ", article);
          return resolve(article);
        });
      } else {
        return self.parseArticle.then(function(article) {
          var article = new ArticleSchema(objs[0]);
          winston.debug("Article created: ", article);
          return article.uploadAndSave();
        }).catch(function(err) {
            return new Promise(function(err) {return reject(err);});
        });
      }
    }).catch(function(err) {
        return new Promise(function(err) {return reject(err);});
    });
  },

  trimUrl: function(url) {
    var re = new RegExp(specialUrls.join("|"), "i");
    winston.debug("Original url: %s", url);
    if (url.match(re) == null) {
      url = urlTrim(url);
      winston.debug("Trimmed url: %s", url);
    }
    return url;
  },

  parseArticle: function(url) {
    const api = new embedly({key: config.embedly.apiKey});
    return new Promise(function(resolve, reject) {
      api.oembed({url: url}, function(err, objs) {
        if (!!err) {
          winston.error("Article parse error:", {error: err});
          return reject(err);
        } else {
          winston.debug("Article parse success!", objs[0]);
          if (objs[0].type == 'error') return reject(objs[0].error_message);
          resolve(objs);
        }
      });
    });
  }
};

// ArticleSchema.plugin(StreamMongoose.activity);

// ArticleSchema.methods.activityActorProp = function() {
//  return 'user';
// }

// ArticleSchema.methods.activityForeignId = function() {
//   return this.username + ':' + this.item._id;
// };

mongoose.model('Article', ArticleSchema);

// stream.mongoose.setupMongoose(mongoose);
