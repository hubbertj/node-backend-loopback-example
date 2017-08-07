'use strict';

module.exports = function(Chapter) {

    /**
     *  After the creation we add default stuff to the chapter
     *  We create a default achievement
     * 
     * @param  {obj}   ctx  The content of the call.
     * @param  {Function}  Class the next process in the call chain.
     * @return {void}      Returns nothing.
     */
    Chapter.observe('after save', function(ctx, next) {
        var Models = Chapter.app.models;
        var mo = ctx.instance;
        if (typeof ctx.isNewInstance !== 'undefined' && ctx.isNewInstance === true) {

            Models.Upload.initFolder(Chapter.definition.name, mo.id)
                .then(function(contentFolder) {
                    var savedChapter = null;
                    Chapter.findById(mo.id)
                        .then((achapter) => {
                            savedChapter = achapter;
                            achapter.headerImageURI = contentFolder + '/covers/cover_default.jpg';
                            achapter.headerImageUriLarge = contentFolder + '/covers/cover_default_lg.jpg';
                            return achapter.save();
                        }).then(function(saved) {
                            return Models.Curriculum.findById(savedChapter.curriculumId);
                        }).then(function(curriculum) {
                            var nameObj = {};
                            curriculum.enabledLanguages.forEach(function(languageCode) {
                                nameObj[languageCode] = 'Trophy';
                            });
                            return Models.Achievement.create({
                                name: nameObj,
                                contentUri: contentFolder + '/achievements/trophy_default.png',
                                type: Models.Achievement.TYPE.get('chapter'),
                                chapterId: savedChapter.id
                            });
                        });
                }).catch(function(err) {
                    console.log("Error: " + err);
                });

        }
        next();
    });

    /**
     * URL for uploading cover images for this chapter.
     * @param  {int}   chapterId    The id of the chapter.
     * @param  {string}   type      size of the file sm, mb,  or lg
     * @param  {object}   req       The request object
     * @param  {object}   res       The respond object
     * @param  {Function} cb        The callback
     * @return {url}    dir           This returns the directory url of the file we just uploaded.
     */
    Chapter.uploadCover = function(chapterId, type, req, res, cb) {
        var dirLocation = "chapters/" + chapterId + "/covers";
        var Models = Chapter.app.models;
        var chapter = null;
        var fileUrl = null;

        Chapter.findById(chapterId)
            .then(function(achapter) {
                chapter = achapter;
                return Models.Upload.simpleFileUpload("chapters/" + achapter.id + "/covers", req, res);
            }).then(function(fileUrls) {
                if (fileUrls.length > 0) {
                    fileUrl = fileUrls[0];
                }
                if (type === 'lg') {
                    chapter.headerImageUriLarge = fileUrl;
                } else if (type === 'md') {
                    chapter.headerImageURI = fileUrl;
                } else if (type === 'sm') {
                    chapter.headerImageURI = fileUrl;
                } else {
                    chapter.headerImageURI = fileUrl;
                }
                return chapter.save();
            }).then(function(savedChapter) {
                cb(null, fileUrl);
            }).catch(function(error) {
                cb(error);
            });
    };

    // returns the first video marked as isIntro true
    Chapter.introVideo = function(id, language, cb) {
        Chapter.findById(id)
            .then(ChapterObj => {
                ChapterObj.videos.findOne({
                    where: {
                        and: [{
                            isIntro: true
                        }, {
                            isEnabled: true
                        }]
                    }
                }, cb);
            })
            .catch(error => {
                cb(error);
            });
    };

    Chapter.remoteMethod('uploadCover', {
        description: "Adds cover files to the chapter content folder",
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

    Chapter.remoteMethod('introVideo', {
        description: "Gets the chapters intro video if it has one",
        http: {
            path: '/:id/introVideo',
            verb: 'get',
            status: 200,
            errorStatus: 422
        },
        accepts: [{
            arg: 'id',
            type: 'number',
            required: true
        }, {
            arg: 'language',
            type: 'string',
            required: false,
            default: 'en'
        }],
        returns: [{
            type: 'Video',
            root: true
        }]
    });
};
