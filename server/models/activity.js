'use strict';

module.exports = function (Activity) {


    /**
     * post runnning of Activity after a save
     *  - Pushes the index.html into the correct directory and updates database.
     *  
     * @param  {obj}   ctx   The context.
     * @param  {Function} next) The funciton you call for the call to continue.
     * @return {void}        
     */
    Activity.observe('after save', function(ctx, next) {
        var Models = Activity.app.models;
        var mo = ctx.instance;
        if (typeof ctx.isNewInstance !== 'undefined' && ctx.isNewInstance === true) {
            Models.Upload.initFolder(Activity.definition.name, mo.id)
                .then(function(contentFolder) {
                    Activity.findById(mo.id).then((aModel) => {
                        aModel.contentUri = contentFolder + '/index.html';
                        aModel.contentUri = contentFolder + '/covers/cover_default.jpg';
                        return aModel.save();
                    });
                }).catch(function(err) {
                    console.log("Error: " + err);
                });
        }
        next();
    });

    /**
     * URL for uploading cover images for this Activity.
     * @param  {int}   activityId    The id of the activity.
     * @param  {string}   type      size of the file sm, mb,  or lg
     * @param  {object}   req       The request object
     * @param  {object}   res       The respond object
     * @param  {Function} cb        The callback
     * @return {url}    dir           This returns the directory url of the file we just uploaded.
     */
    Activity.uploadCover = function(activityId, type, req, res, cb) {

        var Models = Activity.app.models;
        var activity = null;
        var fileUrl = null;

        Activity.findById(activityId)
            .then(function(aActivity) {
                activity = aActivity;
                return Models.Upload.simpleFileUpload("activities/" + aActivity.id + "/covers", req, res);
            }).then(function(fileUrls) {

                if (fileUrls.length > 0) {
                    fileUrl = fileUrls[0];
                }
                if (type === 'lg') {
                    activity.thumbnailUri = fileUrl;
                } else if (type === 'md') {
                    activity.thumbnailUri = fileUrl;
                } else if (type === 'sm') {
                    activity.thumbnailUri = fileUrl;
                } else {
                    activity.thumbnailUri = fileUrl;
                }
                return activity.save();
            }).then(function(savedActivity) {
                cb(null, fileUrl);
            }).catch(function(error) {
                cb(error);
            });
    };

    Activity.uploadPost = function (activityId, req, cb) {
        var Models = Activity.app.models;
        var accessToken = req.accessToken || null;
        var userId = accessToken.userId;

        Models.Upload.generateHash(userId, activityId)
            .then(function (hash) {
                cb(null, hash);
            }).catch(function (error) {
            cb({error: {message: error}});
        });
    }

    Activity.uploadPut = function (activityId, hash, req, cb) {
        var Models = Activity.app.models;
        var accessToken = req.accessToken || null;
        var userId = accessToken.userId;

        Models.Upload.afterUpload(hash, this.definition.name)
            .then(function (hash) {
                cb(null, hash);
            }).catch(function (error) {
            cb({error: {message: error}});
        });
    }

    Activity.folder = function (activityId, action, dir, req, cb) {
        var Models = Activity.app.models;
        var accessToken = req.accessToken || null;
        var userId = accessToken.userId;
        var promiseArr = [];

        switch (action) {
            case 'createFolder':
                promiseArr.push(Models.Upload.createFolder(activityId, dir, this.definition.name));
                break;
            case 'remove':
                promiseArr.push(Models.Upload.deleteFolder(activityId, dir, this.definition.name));
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
    };

    Activity.remoteMethod('uploadCover', {
        description: "Adds icon files to the activity content folder",
        http: {
            path: '/:id/upload/cover/:type',
            verb: 'put',
            parse: 'form',
            status: 200,
            errorStatus: 422
        },
        accepts: [{ arg: 'id', type: 'number', required: true },
            { arg: 'type', type: 'string', required: true },
            { arg: 'req', type: 'object', 'http': { source: 'req' } },
            { arg: 'res', type: 'object', 'http': { source: 'res' } }
        ],
        returns: [{ arg: 'fileDir', type: 'string' }]
    });

    Activity.remoteMethod('folder', {
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

    Activity.remoteMethod('uploadPost', {
        description: "Creates a hash for uploading a files to the correct activity.",
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

    Activity.remoteMethod('uploadPut', {
        description: "Moves the activity files to the correct folder using the provided hash.",
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
