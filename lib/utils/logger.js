'use strict';

////////////////////////////////////////////////////////////////////////////////
// Dependencies
//
// 3rd-party
var pino = require('pino');

var DEFAULT_LOG_LEVEL = 'debug';

////////////////////////////////////////////////////////////////////////////////
// Logging related
//
function _isDevelopment() {
    return process.env.NODE_ENV === 'development'
        || process.env.NODE_ENV === 'test';
}

function _isPretty() {
    // This is only called once
    if (_isDevelopment()) {
        var pretty = pino.pretty({
            levelFirst: true
        });
        pretty.pipe(process.stdout);
        return pretty;
    }
}

////////////////////////////////////////////////////////////////////////////////
// Exports
//
var Logger = module.exports = (function (logLevel) {
        var pretty = _isPretty();
        Logger.parent = pino({
            slowtime: true, // ISO timestamps
            level: logLevel || DEFAULT_LOG_LEVEL
        }, pretty);

        return Logger.parent;
    });
