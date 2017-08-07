'use strict';

module.exports = function (Assessment) {


     /**
     * post runnning of Activity after a save
     *  - Pushes the index.html into the correct directory and updates database.
     *  
     * @param  {obj}   ctx   The context.
     * @param  {Function} next) The funciton you call for the call to continue.
     * @return {void}        
     */
    Assessment.observe('after save', function(ctx, next) {
        var Models = Assessment.app.models;
        var mo = ctx.instance;
        if (typeof ctx.isNewInstance !== 'undefined' && ctx.isNewInstance === true) {
            Models.Upload.initFolder(Assessment.definition.name, mo.id)
                .then(function(contentFolder) {
                    Assessment.findById(mo.id).then((aModel) => {
                        aModel.contentUri = contentFolder + '/index.html';
                        return aModel.save();
                    });
                }).then(function(saved){
                    // console.log(saved);
                }).catch(function(err) {
                    console.log("Error: " + err);
                });
        }
        next();
    });

    Assessment.uploadPost = function (assessmentId, req, cb) {
        var Models = Assessment.app.models;
        var accessToken = req.accessToken || null;
        var userId = accessToken.userId;

        Models.Upload.generateHash(userId, assessmentId)
            .then(function (hash) {
                cb(null, hash);
            }).catch(function (error) {
            cb({error: {message: error}});
        });
    }

    Assessment.uploadPut = function (assessmentId, hash, req, cb) {
        var Models = Assessment.app.models;
        var accessToken = req.accessToken || null;
        var userId = accessToken.userId;

        Models.Upload.afterUpload(hash, this.definition.name)
            .then(function (hash) {
                cb(null, hash);
            }).catch(function (error) {
            cb({error: {message: error}});
        });
    }

    Assessment.folder = function (assessmentId, action, dir, req, cb) {
        var Models = Assessment.app.models;
        var accessToken = req.accessToken || null;
        var userId = accessToken.userId;
        var promiseArr = [];

        switch (action) {
            case 'createFolder':
                promiseArr.push(Models.Upload.createFolder(assessmentId, dir, this.definition.name));
                break;
            case 'remove':
                promiseArr.push(Models.Upload.deleteFolder(assessmentId, dir, this.definition.name));
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

    Assessment.remoteMethod('folder', {
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

    Assessment.remoteMethod('uploadPost', {
        description: "Creates a hash for uploading a files to the correct assessment.",
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

    Assessment.remoteMethod('uploadPut', {
        description: "Moves the assessment files to the correct folder using the provided hash.",
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
