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
 * Article Schema
 */

var ArticleSchema = new Schema({
  title: { type : String, default : '', trim : true },
  url: { type : String, default : '', trim : true, required: true},
  thumbnail: { type : String,  default : ''},
  description: { type : String,  default : ''},
  createdAt: { type : Date, default : Date.now }
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

    /*
    if (images && !images.length) return this.save();
    const imager = new Imager(imagerConfig, 'S3');

    imager.upload(images, function (err, cdnUri, files) {
      if (err) return cb(err);
      if (files.length) {
        self.image = { cdnUri : cdnUri, files : files };
      }
      self.save(cb);
    }, 'article');
    */
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
    console.log("Loading article");
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
