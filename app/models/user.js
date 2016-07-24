
// const promisify = require("promisify-node");
// const Promise = require("bluebird");

exports.findUserByHref = function(href, client) {
  // Promise.promisify(client.getAccount);
  client.getAccount(href).then(function(account) {
    console.log(account);
    if (err != "undefined" && err != null) {
      return account
    } else {
      return 'unknown'
    }
  });
};
