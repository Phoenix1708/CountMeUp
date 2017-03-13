'use strict';

////////////////////////////////////////////////////////////////////////////////
// Dependencies
//
var util        = require('util');
var config      = require('konfig')().service;
var MongoClient = require('mongodb').MongoClient;
var async       = require('async');

// constants
const dbAddress = util.format("mongodb://%s:%s/%s", config.MONGODB_HOST,
                                                    config.MONGODB_PORT,
                                                    config.MONGODB_NAME);

function initialise(cb) {
  // Connect to the db
  MongoClient.connect(dbAddress, function(err, db) {
    if (err) return cb(err);
    // create collection with
    db.createCollection(config.MONGODB_COL_NAME, {}).then(
      () => db.createCollection(config.MONGODB_USER_COL_NAME, {}, cb));
  });
}

/**
 * Update a single document
 * @param doc
 * @param cb
 */
// TODO: refactor to be more generic
function update(doc, cb) {
  MongoClient.connect(dbAddress, function(err, db) {
    if (err) return cb(err);

    var collection = db.collection(config.MONGODB_USER_COL_NAME);
    // update the vote count of the given single user or create vote count records for him
    collection.update({user: doc.user},
                      {$set: {user: doc.user}, $inc: {vote_count: 1}},
                      {upsert: true},
      function (err, results) {
        if (err) return cb(err);
        cb(null, results);
    });
  });
}

/**
 * Insert a single or an array of documents
 * @param docs - an array of documents
 * @param cb
 */
function insert(docs, cb) {
  MongoClient.connect(dbAddress, function(err, db) {
    if (err) return cb(err);
    var collection = db.collection(config.MONGODB_COL_NAME);

    collection.insertMany(docs, {}, function(err, result) {
      if (err) return cb(err);
      cb(null, result);
    });

  });
}

function storeVotes(votes, cb) {
  votes = (votes instanceof Array) ? votes : [votes];

  // insert into vote collection
  insert(votes, function (err) {
    if (err) return cb(err);

    // also update user collection for all votes
    var tasks = [];
    for (var i = 0; i < votes.length; ++i) {
      // create user collection update tasks
      tasks.push(async.apply(update, votes[i]));
    }

    async.series(tasks, function (err, results) {
      if (err) return cb(err);
      cb(null, results);
    });
  })
}

/**
 * DB Clean up util function
 */
function deleteDocs(colName, query, cb) {
  MongoClient.connect(dbAddress, function(err, db) {
    if (err) return cb(err);
    var collection = db.collection(colName);

    collection.deleteMany(query, function (err, result) {
      if (err) return cb(err);
      cb(null, result);
    })
  });
}

module.exports = {
  initialise: initialise,
  storeVotes: storeVotes,
  deleteDocs: deleteDocs
};
