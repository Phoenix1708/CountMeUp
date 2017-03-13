'use strict';

////////////////////////////////////////////////////////////////////////////////
// Dependencies
//
var config  = require('konfig')().service;
var mongodb = require('../utils/mongodb');
var log     = require('../utils/logger')(config.LOGLEVEL);


///////////////////////////////////////////////////////////////////////////////
// Route Handlers / Exports
//
module.exports = (function() {

  return {
    count: function (req, res, next) {
      mongodb.countVotes(function(err, result) {
        if (err) {
          log.error(err);
          res.send(500, "Internal server error.");
        } else {
          res.send(200, JSON.stringify(result));
        }
        return next();
      });
    }
  };
})();