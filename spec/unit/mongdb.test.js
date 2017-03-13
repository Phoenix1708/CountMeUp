'use strict';

///////////////////////////////////////////////////////////////////////////////
// Dependencies
//
var chai   = require('chai');
var expect = chai.expect;
var config = require('konfig')().service;
var async  = require('async');

// module-under-test
var mongodb = require('../../lib/utils/mongodb');

///////////////////////////////////////////////////////////////////////////////
// Helper
//
/**
 * get random user ID between 1 - 20 for testing purpose
 * @returns {string}
 */
function getUserID () {
  return "test-" + Math.floor(Math.random() * (20 - 1) + 1);
}

/**
 * Generate given number of vote message for given candidate
 * @param numOfVotes
 * @param canId
 */
function generateVotes(numOfVotes, canId) {
  var votes = [];
  for (var i = 0; i < numOfVotes; ++i) {
    votes[i] = {user: getUserID(), candidate: canId}
  }
  return votes;
}

///////////////////////////////////////////////////////////////////////////////
// Test suite
//
describe('MongoDB helper', function() {

  describe('basic operations test', function () {

    it('should initialise mongodb with correct collection name', function (done) {
      mongodb.initialise(function(err, result) {
        expect(err).to.be.null;
        // if other collection creation has error the result collection
        // name won't be user
        expect(result.collectionName).to.equal('user');
        done();
      });
    });

    it('should be able to insert single doc into mongodb', function (done) {
      mongodb.storeVotes({user: "test-1", candidate: 2}, function(err, result) {
        expect(err).to.be.null;
        expect(result.length).to.equal(1);
        done();
      });
    });

    it('should be able to insert multiple doc into mongodb', function (done) {
      var testDocs = [
        {user: "test-1", candidate: 5},
        {user: "test-2", candidate: 3}
      ];
      mongodb.storeVotes(testDocs, function(err, result) {
        expect(err).to.be.null;
        expect(result.length).to.equal(2);
        done();
      });
    });

    after(function(done) {
      mongodb.deleteDocs(config.MONGODB_COL_NAME, {user: /^test-*/}, function () {
        mongodb.deleteDocs(config.MONGODB_USER_COL_NAME, {user: /^test-*/}, done);
      });
    })
  });


  describe('user collection update tests', function() {
    var testVotes = [
      {user: "test-1", candidate: 1},
      {user: "test-1", candidate: 2},
      {user: "test-1", candidate: 3},
      {user: "test-1", candidate: 4},
      {user: "test-2", candidate: 5},
      {user: "test-2", candidate: 6}
    ];

    it('should not store vote from user who voted 3 times already', function (done) {
      mongodb.storeVotes(testVotes, function (err) {
        if (err) return done(err);
        // check only 3 test-1 vote stored
        mongodb.queryDocs(config.MONGODB_COL_NAME, {user: "test-1"}, function (err, result) {
          if (err) return done(err);
          expect(result.length).to.equal(3);

          // check only 3 test-1 vote stored
          mongodb.queryDocs(config.MONGODB_USER_COL_NAME, {user: "test-1"}, function (err, usrCount) {
            if (err) return done(err);
            expect(usrCount.length).to.equal(1);
            expect(usrCount[0].vote_count).to.equal(3);
            done();
          })
        })
      })
    });

    after(function(done) {
      mongodb.deleteDocs(config.MONGODB_COL_NAME, {user: /^test-*/}, function () {
        mongodb.deleteDocs(config.MONGODB_USER_COL_NAME, {user: /^test-*/}, done);
      });
    })
  });

  describe('aggregation test', function() {
    before(function (done) {
      // generate given percentage/num of votes for each candidate from random users
      // such that candidate one has 1 vote, candidate 4 has 5 votes etc.
      var votes = [
        generateVotes(1, 1),
        generateVotes(2, 2),
        generateVotes(4, 3),
        generateVotes(5, 4),
        generateVotes(8, 5),
        generateVotes(1, 1)
      ];

      // make sure all inserts complete before proceed
      var tasks = [];
      for (var i = 0; i < votes.length; ++i) {
        tasks[i] = async.apply(mongodb.storeVotes, votes[i]);
      }
      async.series(tasks, done);
    });

    it('should be able to return votes count for each candidates', function(done) {
      mongodb.countVotes(function (err, result) {
        if (err) return done(err);
        expect(result.length).to.equal(5);
        done();
      })
    });

    after(function(done) {
      mongodb.deleteDocs(config.MONGODB_COL_NAME, {user: /^test-*/}, function () {
        mongodb.deleteDocs(config.MONGODB_USER_COL_NAME, {user: /^test-*/}, done);
      });
    });
  });

});
