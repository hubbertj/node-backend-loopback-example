'use strict';

module.exports = function(Lesson) {

    /**
     * Adds language files to the correct content bucket
     * 
     * @param {int}   lessonId the ID of the lesson.
     * @param {obj}   formData The files 
     * @param {obj}   req   The requies object
     * @param {Function} cb       callback function
     */
    Lesson.uploadLanguageFiles = function(lessonId, req, res, cb) {
        var Models = Lesson.app.models;
        Models.Upload.uploadLanguageFiles(Lesson.definition.name, lessonId, req, res)
            .then(function(fileDirs) {
                cb(null, fileDirs);
            }).catch(function(error) {
                cb(error);
            });
    };

    /**
     * Removes a specfic file from our content folder.
     * @param  {int}   lessonId   The lesson id 
     * @param  {string}   key       The AWS key for the file.
     * @param  {object}   req       The request object.
     * @param  {object}   res       The respond object.
     * @param  {Function} cb        callback function.
     * @return {int}                count of the number of files removed.
     */
    Lesson.removeContentFile = function(lessonId, key, req, res, cb) {
        var Models = Lesson.app.models;
        Models.Upload.removeFileByKey(Lesson.definition.name, key)
            .then(function(result) {
                cb(null, {
                    count: 1,
                    fileName: key.split('/').pop()
                });
            }).catch(function(err) {
                console.log(err);
                cb(err);
            });
    };

    /**
     * URL for uploading cover images for this lesson.
     * @param  {int}   lessonId    The id of the lesson.
     * @param  {string}   type      size of the file sm, mb,  or lg
     * @param  {object}   req       The request object
     * @param  {object}   res       The respond object
     * @param  {Function} cb        The callback
     * @return {url}    dir           This returns the directory url of the file we just uploaded.
     */
    Lesson.uploadIcon = function(lessonId, type, req, res, cb) {

        var Models = Lesson.app.models;
        var lesson = null;
        var fileUrl = null;

        Lesson.findById(lessonId)
            .then(function(alesson) {
                lesson = alesson;
                return Models.Upload.simpleFileUpload("lessons/" + alesson.id + "/covers", req, res);
            }).then(function(fileUrls) {

                if (fileUrls.length > 0) {
                    fileUrl = fileUrls[0];
                }
                if (type === 'lg') {
                    lesson.iconUri = fileUrl;
                } else if (type === 'md') {
                    lesson.iconUri = fileUrl;
                } else if (type === 'sm') {
                    lesson.iconUri = fileUrl;
                } else {
                    lesson.iconUri = fileUrl;
                }
                return lesson.save();
            }).then(function(savedLesson) {
                cb(null, fileUrl);
            }).catch(function(error) {
                cb(error);
            });
    };

    /**
     * post runnning of lesson after a save
     *  - Pushes the index.html into the correct directory and updates database.
     *  - Creates a default achievement for the lesson.
     *  
     * @param  {obj}   ctx   The context.
     * @param  {Function} next) The funciton you call for the call to continue.
     * @return {void}        
     */
    Lesson.observe('after save', function(ctx, next) {
        var Models = Lesson.app.models;
        var mo = ctx.instance;
        var lesson = null;
        if (typeof ctx.isNewInstance !== 'undefined' && ctx.isNewInstance === true) {
            var contentFolder = null;
            Models.Upload.initFolder(Lesson.definition.name, mo.id)
                .then(function(acontentFolder) {
                    contentFolder = acontentFolder;
                    return Lesson.findById(mo.id);
                }).then(function(alesson) {
                    alesson.contentUri = contentFolder + '/index.html';
                    alesson.iconUri = contentFolder + '/icons/icon_default.jpg';
                    return alesson.save();
                }).then(function(savedLesson) {
                    lesson = savedLesson;
                    return Models.Chapter.findById(savedLesson.chapterId);
                }).then(function(chapter) {
                    return Models.Curriculum.findById(chapter.curriculumId);
                }).then(function(curriculum) {
                    var nameObj = {};
                    curriculum.enabledLanguages.forEach(function(languageCode) {
                        nameObj[languageCode] = 'Trophy';
                    });
                    return Models.Achievement.create({
                        name: nameObj,
                        contentUri: contentFolder + '/achievements/trophy_default.png',
                        type: Models.Achievement.TYPE.get('LESSON'),
                        lessonId: mo.id
                    });
                }).catch(function(err) {
                    console.log("Error: " + err);
                });
        }
        next();
    });

    Lesson.uploadPost = function(lessonId, req, cb) {
        var Models = Lesson.app.models;
        var accessToken = req.accessToken || null;
        var userId = accessToken.userId;

        Models.Upload.generateHash(userId, lessonId)
            .then(function(hash) {
                cb(null, hash);
            }).catch(function(error) {
                cb({ error: { message: error } });
            });
    };

    Lesson.uploadPut = function(lessonId, hash, req, cb) {
        var Models = Lesson.app.models;
        var accessToken = req.accessToken || null;
        var userId = accessToken.userId;

        Models.Upload.afterUpload(hash, this.definition.name)
            .then(function(hash) {
                cb(null, hash);
            }).catch(function(error) {
                cb({ error: { message: error } });
            });
    };

    Lesson.folder = function(lessonId, action, dir, req, cb) {
        var Models = Lesson.app.models;
        var accessToken = req.accessToken || null;
        var userId = accessToken.userId;
        var promiseArr = [];

        switch (action) {
            case 'createFolder':
                promiseArr.push(Models.Upload.createFolder(lessonId, dir, this.definition.name));
                break;
            case 'remove':
                promiseArr.push(Models.Upload.deleteFolder(lessonId, dir, this.definition.name));
                break;
            default:
                cb("Error: Bab action provided!");
        }

        Promise.all(promiseArr)
            .then(function(result) {
                cb(null, result);
            }).catch(function(error) {
                cb({ error: { message: error } });
            });
    };

    Lesson.remoteMethod('uploadIcon', {
        description: "Adds icon files to the lesson content folder",
        http: {
            path: '/:id/upload/icon/:type',
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

    Lesson.remoteMethod('removeContentFile', {
        description: "Removes a specfic file from our content folder",
        http: {
            path: '/:id/removeFile',
            verb: 'put',
            status: 200,
            errorStatus: 422
        },
        accepts: [{ arg: 'id', type: 'number', required: true },
            { arg: 'key', type: 'string', required: true },
            { arg: 'req', type: 'object', 'http': { source: 'req' } },
            { arg: 'res', type: 'object', 'http': { source: 'res' } }
        ],

        returns: [{ type: { count: 'int', fileName: 'string' }, root: true }]
    });

    Lesson.remoteMethod('uploadLanguageFiles', {
        description: "Adds lesson files to the lesson",
        http: {
            path: '/:id/uploadLanguageFiles',
            verb: 'put',
            parse: 'form',
            status: 200,
            errorStatus: 422
        },
        accepts: [{ arg: 'id', type: 'number', required: true },
            { arg: 'req', type: 'object', 'http': { source: 'req' } },
            { arg: 'res', type: 'object', 'http': { source: 'res' } }
        ],
        returns: [{ arg: 'fileDirs', type: 'array' }]
    });

    Lesson.remoteMethod('folder', {
        description: "Manpulate the folder using a action",
        http: {
            path: '/:id/folder',
            verb: 'put',
            status: 200,
            errorStatus: 422
        },
        accepts: [{ arg: 'id', type: 'number', required: true },
            { arg: 'action', type: 'string', required: true },
            { arg: 'path', type: 'string', required: true },
            { arg: 'req', type: 'object', 'http': { source: 'req' } }
        ],
        returns: [{ arg: 'ETag', type: 'string' }]
    });

    Lesson.remoteMethod('uploadPost', {
        description: "Creates a hash for uploading a files to the correct lesson.",
        http: {
            path: '/:id/upload',
            verb: 'post',
            status: 200,
            errorStatus: 422
        },
        accepts: [{ arg: 'id', type: 'number', required: true },
            { arg: 'req', type: 'object', 'http': { source: 'req' } }
        ],
        returns: [{ arg: 'hash', type: 'string' }]

    });

    Lesson.remoteMethod('uploadPut', {
        description: "Moves the lesson files to the correct folder using the provided hash.",
        http: {
            path: '/:id/upload',
            verb: 'put',
            status: 200,
            errorStatus: 422
        },
        accepts: [{ arg: 'id', type: 'number', required: true },
            { arg: 'hash', type: 'string' },
            { arg: 'req', type: 'object', 'http': { source: 'req' } }
        ],
        returns: [{ arg: 'hash', type: 'string' }]
    });
};
