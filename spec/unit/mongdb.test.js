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

  after(function(done) {
    mongodb.deleteDocs(config.MONGODB_COL_NAME, {user: /^test-*/}, function () {
      mongodb.deleteDocs(config.MONGODB_USER_COL_NAME, {user: /^test-*/}, done);
    });
  })
});
