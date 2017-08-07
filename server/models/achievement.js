'use strict';
const Enum = require('enum');
module.exports = function(Achievement) {

    Achievement.TYPE = new Enum({
        'CHAPTER': 1,
        'LESSON': 2,
        'ACTIVITY': 3
    }, { ignoreCase: true });

    /**
     * returns a list of all the Achievement types.
     * @param  {obj}        req The request object
     * @param  {Function}   cb  
     * @return {obj}        A enum of the achievement types we support.
     */
    Achievement.getTypes = function(req, cb) {
        if (Achievement.TYPE) {
            cb(null, Achievement.TYPE);
            return;
        }
        cb("Failed to get status");
    };

    /**
     * Uploads content and sets contentUri for a achievement
     * @param  {int}     id      achievement identifier
     * @param  {TYPE}    type     What type of achivment your uploading
     * @param  {obj}     req     req The request object
     * @param  {obj}     res     res The request object
     * @param  {Function}   cb      The callback
     * @return {url}        fileUrl The file url of the uploaded content
     */
    Achievement.uploadContent = function(id, type, req, res, cb) {
        var achievementType = Achievement.TYPE.get(type);
        if (!achievementType) {
            cb('Bad type provided.');
        }

        var Models = Achievement.app.models;
        var achievement = null;
        var fileUrl = null;

        Achievement.findById(id)
            .then(function(aachievement) {
                achievement = aachievement;
                if (Achievement.TYPE.CHAPTER.is(achievementType)) {
                    return Models.Chapter.findById(aachievement.chapterId);
                } else if (Achievement.TYPE.LESSON.is(achievementType)) {
                    return Models.Lesson.findById(aachievement.lessonId);
                } else if (Achievement.TYPE.ACTIVITY.is(achievementType)) {
                    return Models.activity.findById(aachievement.activityId);
                } else {
                    return new Promise(function(resolve, reject) {
                        return reject("Achivement type not found");
                    });
                }
            }).then(function(model) {
                if (Achievement.TYPE.CHAPTER.is(achievementType)) {
                    return Models.Upload.simpleFileUpload("chapters/" + model.id + "/achievements", req, res);
                } else if (Achievement.TYPE.LESSON.is(achievementType)) {
                    return Models.Upload.simpleFileUpload("lessons/" + model.id + "/achievements", req, res);
                } else if (Achievement.TYPE.ACTIVITY.is(achievementType)) {
                    return Models.Upload.simpleFileUpload("activities/" + model.id + "/achievements", req, res);
                }
            }).then(function(fileUrls) {
                if (fileUrls.length > 0) {
                    fileUrl = fileUrls[0];
                }
                achievement.contentUri = fileUrl;
                return achievement.save();
            }).then(function(savedAchievement) {
                cb(null, fileUrl);
            }).catch(function(error) {
                cb(error);
            });
    };

    Achievement.remoteMethod('uploadContent', {
        description: "Uploads content and sets contentUri for a achievement",
        http: {
            path: '/:id/uploadContent/:type',
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
        returns: [{ arg: 'fileUrl', type: 'string' }]
    });

    Achievement.remoteMethod('getTypes', {
        description: "returns a list of all the Achievement types.",
        http: {
            path: '/types',
            verb: 'get',
            status: 200,
            errorStatus: 422
        },
        accepts: [{ arg: 'req', type: 'object', 'http': { source: 'req' } }],
        returns: [{ arg: 'types', type: 'json' }]
    });
};
