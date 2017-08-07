'use strict';

module.exports = function (Video) {


    Video.uploadPost = function (videoId, req, cb) {
        var Models = Video.app.models;
        var accessToken = req.accessToken || null;
        var userId = accessToken.userId;

        Models.Upload.generateHash(userId, videoId)
            .then(function (hash) {
                cb(null, hash);
            }).catch(function (error) {
            cb({error: {message: error}});
        });
    }

    Video.uploadPut = function (videoId, hash, req, cb) {
        var Models = Video.app.models;
        var accessToken = req.accessToken || null;
        var userId = accessToken.userId;

        Models.Upload.afterUpload(hash, this.definition.name)
            .then(function (hash) {
                cb(null, hash);
            }).catch(function (error) {
            cb({error: {message: error}});
        });
    }

    Video.folder = function (videoId, action, dir, req, cb) {
        var Models = Video.app.models;
        var accessToken = req.accessToken || null;
        var userId = accessToken.userId;
        var promiseArr = [];

        switch (action) {
            case 'createFolder':
                promiseArr.push(Models.Upload.createFolder(videoId, dir, this.definition.name));
                break;
            case 'remove':
                promiseArr.push(Models.Upload.deleteFolder(videoId, dir, this.definition.name));
                break;
            default:
                cb("Error: Bab action provided!");
        }

        Promise.all(promiseArr)
            .then(function (result) {
                cb(null, result);
            }).catch(function (error) {
            cb({error: {message: error}});
        });
    }

    Video.remoteMethod('folder', {
        description: "Manpulate the folder using a action",
        http: {
            path: '/:id/folder',
            verb: 'put',
            status: 200,
            errorStatus: 422
        },
        accepts: [{arg: 'id', type: 'number', required: true},
            {arg: 'action', type: 'string', required: true},
            {arg: 'path', type: 'string', required: true},
            {arg: 'req', type: 'object', 'http': {source: 'req'}}
        ],
        returns: [{arg: 'ETag', type: 'string'}]
    });

    Video.remoteMethod('uploadPost', {
        description: "Creates a hash for uploading a files to the correct video.",
        http: {
            path: '/:id/upload',
            verb: 'post',
            status: 200,
            errorStatus: 422
        },
        accepts: [{arg: 'id', type: 'number', required: true},
            {arg: 'req', type: 'object', 'http': {source: 'req'}}
        ],
        returns: [{arg: 'hash', type: 'string'}]

    });

    Video.remoteMethod('uploadPut', {
        description: "Moves the video files to the correct folder using the provided hash.",
        http: {
            path: '/:id/upload',
            verb: 'put',
            status: 200,
            errorStatus: 422
        },
        accepts: [{arg: 'id', type: 'number', required: true},
            {arg: 'hash', type: 'string'},
            {arg: 'req', type: 'object', 'http': {source: 'req'}}
        ],
        returns: [{arg: 'hash', type: 'string'}]
    });

};
