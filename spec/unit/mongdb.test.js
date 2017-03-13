'use strict';

///////////////////////////////////////////////////////////////////////////////
// Dependencies
//
var chai   = require('chai');
var expect = chai.expect;
var config = require('konfig')().service;

// module-under-test
var mongodb = require('../../lib/utils/mongodb');

///////////////////////////////////////////////////////////////////////////////
// Test suite
//
describe('MongoDB helper', function() {

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
    })
  });

  after(function(done) {
    mongodb.deleteDocs(config.MONGODB_COL_NAME, {user: /^test-*/}, function () {
      mongodb.deleteDocs(config.MONGODB_USER_COL_NAME, {user: /^test-*/}, done);
    });
  })
});
