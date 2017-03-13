'use strict';

////////////////////////////////////////////////////////////////////////////////
// Dependencies
//
var util        = require('util');
var config      = require('konfig')().service;
var MongoClient = require('mongodb').MongoClient;

// constants
const dbAddress = util.format("mongodb://%s:%s/%s", config.MONGODB_HOST,
                                                    config.MONGODB_PORT,
                                                    config.MONGODB_NAME);

function initialise(cb) {
  // Connect to the db
  MongoClient.connect(dbAddress, function(err, db) {
    if (err) return cb(err);
    // create collection with
    db.createCollection(config.MONGODB_COL_NAME, {}, cb);
  });
}

function insert(doc, cb) {
  MongoClient.connect(dbAddress, function(err, db) {
    if (err) return cb(err);
    var collection = db.collection(config.MONGODB_COL_NAME);
    // Insert a document
    doc = (doc instanceof Array) ? doc : [doc];
    collection.insertMany(doc, {}, function(err, result) {
      if (err) return cb(err);
      cb(null, result);
    });
  });
}

/**
 * DB Clean up util function
 */
function deleteDocs(query, cb) {
  MongoClient.connect(dbAddress, function(err, db) {
    if (err) return cb(err);
    var collection = db.collection(config.MONGODB_COL_NAME);

    collection.deleteMany(query, function (err, result) {
      if (err) return cb(err);
      cb(null, result);
    })
  });
}

module.exports = {
  initialise: initialise,
  insert: insert,
  deleteDocs: deleteDocs
};
