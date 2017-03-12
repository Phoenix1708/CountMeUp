'use strict';

///////////////////////////////////////////////////////////////////////////////
// Dependencies
//
var util    = require('util');
// 3rd-party
var config  = require('konfig')().service;
var restify = require('restify');
// Internal
var logger  = require('./utils/logger');
var log     = logger(config.LOGLEVEL);

///////////////////////////////////////////////////////////////////////////////
// Module-specific state
//
var restifyServer;

///////////////////////////////////////////////////////////////////////////////
// Helpers
//
function setupBuiltInPreprocessing() {
    log.info('Setting up [restify] built-in pre-processing');
    restifyServer.pre(restify.pre.sanitizePath());
    restifyServer.use(restify.acceptParser(restifyServer.acceptable));
    restifyServer.use(restify.queryParser());
    restifyServer.use(restify.bodyParser());
}

function setupProcessExceptionHandling() {
    log.info('Setting up [process] exception handling');

    process.on('uncaughtException', function(err) {
        log.fatal('Uncaught exception: ' + err);
        if (err instanceof Error) {
            log.fatal('Stack: ' + err.stack);
        }
    });
}

function setupRestifyExceptionHandling() {
    log.info('Setting up [restify] exception handling');

    restifyServer.on('uncaughtException', function(req, res, route, err) {
        log.fatal('Uncaught exception: ' + err);
        log.fatal(util.format('Occurred in [%s] of path [%s] handled by [%s]',
            req.method, req.url, req._currentHandler));

        if (err instanceof Error) {
            log.fatal('Stack: ' + err.stack);
        }

        res.send(500, {
            code: 500,
            message: 'Internal error occurred'
        });
    });
}

function setupBuiltInRoutes(params) {
    log.info('Setting up [restify] built-in routes');

    // health route
    restifyServer.get('/info', function get(req, res, next) {

        var info = {
            version: params.config.VERSION,
            owner: params.config.OWNER
        };

        res.setHeader('content-type', 'application/json');
        res.send(200, info);
        return next();
    });
}

function run(params) {
    restifyServer = restify.createServer();

    // Configure server
    setupBuiltInPreprocessing();
    // Exception handling
    setupRestifyExceptionHandling();
    setupProcessExceptionHandling();
    // Setup routes
    setupBuiltInRoutes(params);

    restifyServer.listen(config.PORT);
    log.info(util.format('Server is running at %s:%s ...', config.HOST, config.PORT));
}

///////////////////////////////////////////////////////////////////////////////
// Entry point
//
run({
    config: config
});
