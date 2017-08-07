'use strict';

const Config = require('../config.json');
const clientIdentifier = Config.vimeo.clientIdentifier;
const clientSecret = Config.vimeo.clientSecret;
const accessToken = Config.vimeo.accessToken;
const Vimeo = require('vimeo').Vimeo;
const VimeoLib = new Vimeo(clientIdentifier, clientSecret, accessToken);
const _ = require('lodash');

/**
 * @todo Need to document these functions - JLC
*/
module.exports = function (Vimeo) {

    Vimeo.verify = function (cb) {
        VimeoLib.request({
            method: 'GET',
            path: '/oauth/verify',
            query: {},
        }, function (err, res) {
            if (err) {
                cb({valid: false});
                return;
            }

            cb(null, {valid: true});
        });
    };

    Vimeo.remoteMethod('verify', {
        description: "Verify that personal access token is valid. You shouldn't need this.",
        http: {
            path: '/verify',
            verb: 'get',
            status: 200,
            errorStatus: 422
        },
        accepts: [],
        returns: [{
            type: {
                valid: 'boolean'
            },
            root: true
        }]
    });

    Vimeo.accessToken = function (cb) {
        VimeoLib.generateClientCredentials(['public'], function (err, access_token) {
            if (err) {
                throw err;
            }

            var token = access_token.access_token;

            // Other useful information is included alongside the access token
            // We include the final scopes granted to the token. This is important because the user (or api) might revoke scopes during the authentication process
            var scopes = access_token.scope;

            cb(null, {access_token: access_token.access_token});
        });
    };

    Vimeo.remoteMethod('accessToken', {
        description: "Returns Vimeo access token",
        http: {
            path: '/accessToken',
            verb: 'get',
            status: 200,
            errorStatus: 422
        },
        accepts: [],
        returns: [{
            type: {
                access_token: 'string'
            },
            root: true
        }]
    });

    Vimeo.upload = function (awsUrl, cb) {
        var awsUrlReg = /(ht{2}ps?:\/{2}s3-us-west-([12]{1}).amazonaws.com\/{1}.+)/;

        if (!awsUrlReg.test(awsUrl)) {
            var err = new Error('Not a valid AWS URL');
            err.name = 'Invalid URL';
            err.status = 402;
            err.stack = 'No error stack.';
            cb(err);
        }

        VimeoLib.request({
            method: 'POST',
            path: '/me/videos',
            query: {
                type: 'pull',
                link: awsUrl,
            },
        }, function (err, body, status_code, headers) {
            if (err) {
                cb(err);
            }

            cb(null, body);
        });
    };

    Vimeo.remoteMethod('upload', {
        description: "Uploads video to Vimeo from an AWS URL",
        http: {
            path: '/upload/:awsUrl',
            verb: 'POST',
            status: 200,
            errorStatus: 422
        },
        accepts: [
            {
                arg: 'awsUrl',
                type: 'string',
                required: true,
                description: 'The AWS url of the video asset',
                http: {
                    source: 'path'
                }
            }
        ],
        returns: [
            {
                type: 'object',
                root: true
            }
        ]
    });

    Vimeo.pendingUploads = function (cb) {

        VimeoLib.request({
            method: 'GET',
            path: '/me/videos',
        }, function (err, res) {
            if (err) {
                cb(err);
            }

            var data = [];

            _.forEach(res.data, function (obj, n) {
                try {
                    if (~['uploading', 'uploading_error'].indexOf(obj.status)) {
                        data.push(obj);
                    }
                } catch (err) {
                    console.log(err);
                }
            });

            res.data = data;

            cb(null, res);
        });
    };

    Vimeo.remoteMethod('pendingUploads', {
        description: "Uploads video to Vimeo from an AWS URL",
        http: {
            path: '/videos/pending',
            verb: 'GET',
            status: 200,
            errorStatus: 422
        },
        accepts: [],
        returns: [
            {
                type: 'object',
                root: true
            }
        ]
    });
};
