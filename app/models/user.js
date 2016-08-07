const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const findOrCreate = require('mongoose-findorcreate')


/**
 * User Schema
 */

const UserSchema = new Schema({
  href: { type: String, default: '' },
  givenName: { type: String, default: '' },
  surname: { type: String, default: '' }
});



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

mongoose.model('User', UserSchema);
