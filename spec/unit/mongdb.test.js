'use strict';

var chai            = require('chai');
var expect          = chai.expect;

// module-under-test
var mongodb = require('../../lib/utils/mongodb');

///////////////////////////////////////////////////////////////////////////////
// Test suite
//
describe('MongoDB helper', function() {

  it('should initialise mongodb with correct collection name', function (done) {
    mongodb.initialise(function(err, result) {
      expect(err).to.be.null;
      expect(result.collectionName).to.equal('vote');
      done();
    });
  });

  it('should be able to insert single doc into mongodb', function (done) {
    mongodb.insert({user: "test-1", candidate: 2}, function(err, result) {
      expect(err).to.be.null;
      expect(result.insertedCount).to.equal(1);
      done();
    });
  });

  it('should be able to insert multiple doc into mongodb', function (done) {
    var testDocs = [
      {user: "test-1", candidate: 5},
      {user: "test-2", candidate: 3}
    ];
    mongodb.insert(testDocs, function(err, result) {
      expect(err).to.be.null;
      expect(result.insertedCount).to.equal(2);
      done();
    });
  });

  after(function(done) {
    mongodb.deleteDocs({user: /^test-*/}, function (err) {
      done(err);
    });
  })

});