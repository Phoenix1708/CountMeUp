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
 * @param vote - a single vote data e.g. {user: 2, candidate: 3}
 * @param cb
 */
// TODO: refactor to be more generic
function update(vote, cb) {
  MongoClient.connect(dbAddress, function(err, db) {
    if (err) return cb(err);

    var collection = db.collection(config.MONGODB_USER_COL_NAME);
    // update the vote count of the given single user or create vote count records for him
    collection.updateOne({user: vote.user},
                         {$set: {user: vote.user}, $inc: {vote_count: 1}},
                         {upsert: true},
      function (err, results) {
        if (err) return cb(err);
        cb(null, results);
    });
  });
}

function updateUsrVotes(vote, cb) {
  // check how many vote this user got left
  queryDocs(config.MONGODB_USER_COL_NAME, {user: vote.user}, function (err, result) {
    // store the vote if either new this is a user or it still has vote left
    if (!result.length || (result.length == 1 && result[0].vote_count < 3)) {
      _storeVote(vote, cb)
    } else {
      cb();
    }
  });
}

/**
 * Insert a single or an array of documents
 * @param vote - a single vote data e.g. {user: 2, candidate: 3}
 * @param cb
 */
function insert(vote, cb) {
  MongoClient.connect(dbAddress, function(err, db) {
    if (err) return cb(err);
    var collection = db.collection(config.MONGODB_COL_NAME);

    collection.insertOne(vote, {}, function(err, result) {
      if (err) return cb(err);
      cb(null, result);
    });

  });
}


function _storeVote(vote, cb) {
  // update user vote count first
  update(vote, function (err, count) {
    if (err) return cb(err);
    // only insert this vote if user
    // has votes left
    if (count) {
      insert(vote, function (err, results) {
        if (err) return cb(err);
        cb(null, results);
      })
    }
  })
}

/**
 * Store votes data and filtering out vote from user exceeding max vote
 * @param votes
 * @param cb
 */
function storeVotes(votes, cb) {
  votes = (votes instanceof Array) ? votes : [votes];

  // preparing multiple votes update execution
  var tasks = [];
  for (var i = 0; i < votes.length; ++i) {
    // create user collection update tasks
    tasks.push(async.apply(updateUsrVotes, votes[i]));
  }

  async.series(tasks, function (err, results) {
    if (err) return cb(err);
    cb(null, results);
  });
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

function queryDocs(colName, query, cb) {
  MongoClient.connect(dbAddress, function(err, db) {
    if (err) return cb(err);
    var collection = db.collection(colName);

    collection.find(query).toArray(function (err, result) {
      if (err) return cb(err);
      cb(null, result);
    })
  });
}

/**
 * Count votes for each candidate
 * @param cb - callback
 */
function countVotes(cb) {
  MongoClient.connect(dbAddress, function (err, db) {
    if (err) return cb(err);
    var collection = db.collection(config.MONGODB_COL_NAME);

    collection.aggregate([
        {
          $group: {
            _id: '$candidate',
            count: {$sum: 1}
          }
        },
        {
          $project: {
            _id: 0,
            candidate: '$_id',
            count: 1
          }
        }
      ],
      function (err, result) {
        if (err) return cb(err);
        cb(null, result);
      })
  });
}

module.exports = {
  initialise: initialise,
  storeVotes: storeVotes,
  deleteDocs: deleteDocs,
  queryDocs: queryDocs,
  countVotes: countVotes
};
