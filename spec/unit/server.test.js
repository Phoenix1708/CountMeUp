'use strict';

///////////////////////////////////////////////////////////////////////////////
// Dependencies
//
// 3rd-party
var expect    = require('chai').expect;
var httpMocks = require('node-mocks-http');
var rewire    = require('rewire');
var sinon     = require('sinon');

// Extend chai expectations vocabulary
require('chai').use(require('sinon-chai'));

// Module-under-test
var server    = rewire('../../lib/index.js');

///////////////////////////////////////////////////////////////////////////////
// Test suite
//
describe('server', function() {
    var mockConfig;
    var mockParams;
    var mockLog;
    var mockServer;

    before(function() {
        mockConfig = {
            VERSION: '1.2.3',
            OWNER: 'hyde@gmail.com',
            PORT: 1234,
            LOGLEVEL: 'debug'
        };

        mockLog = {
            debug: sinon.spy(),
            error: sinon.spy(),
            fatal: sinon.spy(),
            info: sinon.spy()
        };

        mockParams = {
            config: mockConfig
        };

        mockServer = {
            acceptable: ['application/json'],
            get: sinon.spy(),
            head: sinon.spy(),
            listen: sinon.spy(),
            on: sinon.spy(),
            pre: sinon.spy(),
            use: sinon.spy()
        };
    });

    describe('exception handling', function() {
        describe('for an uncaught exception in a restify handler', function() {
            describe('the handler', function() {
                before(function() {
                    // prepare test request and response
                    var badRequest = httpMocks.createRequest({
                        method: 'GET',
                        url: '/donkey',
                        _currentHandler: 'someCowboy'
                    });
                    var badResponse = httpMocks.createResponse();

                    // use stub() to spy on its registration,
                    // as well as invoke the behaviour defined in the module-under-test
                    mockServer.on = sinon.stub().yields(badRequest, badResponse, {}, new Error('Oops!'));

                    // mock server state
                    server.__set__('restifyServer', mockServer);
                    server.__set__('log', mockLog);

                    // unit under test
                    server.__get__('setupRestifyExceptionHandling').call(null);

                    // Check that a handler is registered no matter what
                    expect(mockServer.on).to.be.calledWith('uncaughtException');
                });

                it('logs the err and its originating handler', function() {
                    var msg = 'Uncaught exception: Error: Oops!';
                    var origin = 'Occurred in [GET] of path [/donkey] handled by [someCowboy]';
                    expect(mockLog.fatal.withArgs(msg)).to.be.calledOnce;
                    expect(mockLog.fatal.withArgs(origin)).to.be.calledOnce;
                });
            });
        });

        describe('for an uncaught node.js process exception', function() {
            describe('the handler', function() {
                it('logs the err', function(done) {
                    // remove interference
                    process.removeAllListeners('uncaughtException');

                    // unit under test
                    server.__get__('setupProcessExceptionHandling').call(null);

                    process.nextTick(function() {
                        throw(new Error('Argh!'));
                    });

                    process.nextTick(function() {
                        var msg = 'Uncaught exception: Error: Argh!';
                        expect(mockLog.fatal.withArgs(msg)).to.be.calledOnce;
                        done();
                    });
                });
            });
        });
    });

    describe('route setup', function() {
        before(function() {
            server.__set__('log', mockLog);
        });

        describe('/info', function() {
            var infoRequest;
            var infoResponse;
            var infoBody;
            var infoStatus;

            before(function() {
                // test data
                infoRequest = httpMocks.createRequest({
                    method: 'GET',
                    path: '/info'
                });
                infoResponse = httpMocks.createResponse();
                var mockNext = sinon.stub();
                // mock server with test data
                mockServer.get = sinon.stub().yields(infoRequest, infoResponse, mockNext);
                server.__set__('restifyServer', mockServer);

                // unit under test
                server.__get__('setupBuiltInRoutes').call(null, mockParams);
                expect(mockServer.get).to.be.calledWith('/info');
                expect(mockNext).to.be.calledOnce;

                infoBody = infoResponse._getData();
                infoStatus = infoResponse._getStatusCode();
            });

            it('should return 200', function () {
                expect(infoStatus).to.equal(200);
            });

            it('provides version information', function() {
                expect(infoBody.version).to.equal(mockParams.config.VERSION);
            });

            it('provides owner information', function() {
                expect(infoBody.owner).to.equal(mockParams.config.OWNER);
            });
        });
    });
});
