'use strict';

///////////////////////////////////////////////////////////////////////////////
// Dependencies
//
var request     = require('supertest');
var config      = require('konfig')().service;
var testHelpers = require('../test_helper');

// Extend chai expectations vocabulary
require('chai').use(require('sinon-chai'));

// Module-under-test
var server  = require('../../lib/index');

var baseUrl = 'http://' + config.HOST + ':' + config.PORT;

///////////////////////////////////////////////////////////////////////////////
// Test suite
//
describe('server integration test', function() {
  before(testHelpers.waitForServer(server, baseUrl));

  var testVotes = [
    {user: "test-1", candidate: 1},
    {user: "test-1", candidate: 2},
    {user: "test-1", candidate: 3},
    {user: "test-1", candidate: 4},
    {user: "test-2", candidate: 5},
    {user: "test-2", candidate: 6}
  ];

  it('should accept vote data', function(done) {
    request(baseUrl)
      .post('/ingest')
      .send(testVotes)
      .expect(200)
      .end(done);
  });
});