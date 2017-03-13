'use strict';

///////////////////////////////////////////////////////////////////////////////
// Dependencies
//
var config  = require('konfig')().service;
var async   = require('async');
var request = require('supertest');

///////////////////////////////////////////////////////////////////////////////
// Constant/s
//
var TCP_CONNECTION_REFUSED_ERROR = 'ECONNREFUSED';


exports.waitForServer = function(server, baseUrl) {
  return function(done) {
    // start the server
    server.run({ config: config });
    // Wait until service becomes active
    var startingUp = true;
    async.doWhilst(
      function(cb) {
        request(baseUrl)
          .get('/info')
          .end(function(err, res) {
            if (err) {
              // Tolerate connection refused (race condition)
              if (err.code !== TCP_CONNECTION_REFUSED_ERROR) {
                done(err);
              }
              return;
            }
            var info = res.body;
            // if it has version info then it's running
            if (info.version) {
              startingUp = false;
            }
          });
        setTimeout(cb, 500);
      },
      function() {
        return startingUp;
      },
      function(err) {
        // Like a catch + finally block
        if (err) {
          return done(err);
        }
        return done();
      });
  };
};
