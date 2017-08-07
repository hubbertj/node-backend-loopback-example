'use strict';
var _ = require('lodash');

module.exports = function (Operationhopeuser) {

    // returns if the user has watched a video
    Operationhopeuser.chapterProgress = function (id, chapterId, cb) {

        const Models = Operationhopeuser.app.models;
        const promiseArr = [];

        // find user by Id
        promiseArr.push(Operationhopeuser.findById(id, {
            fields: ['id']
        }));

        // find Chapters Lessons
        promiseArr.push(Models.Lesson.find({
            where: {
                chapterId: chapterId
            },
            fields: ['id', 'estimatedTime']
        }));

        // find Chapters Activities
        promiseArr.push(Models.Activity.find({
            where: {
                chapterId: chapterId
            },
            fields: ['id', 'estimatedTime']
        }));

        var user = undefined;
        var lessons = undefined;
        var activities = undefined;
        var lessonsProgress = undefined;
        var activityProgress = undefined;

        Promise.all(promiseArr)
            .then(result => {

                user = result[0];
                lessons = result[1];
                activities = result[2];

                // TODO: user not found error
                if (!user) {
                    const error = new Error('User not found.');
                    error.statusCode = error.status = 404;
                    error.code = 'MODEL_NOT_FOUND';
                    return cb(error);
                }

                const promiseArr = [];

                // grab just the id's as an array
                var lessonsIds = lessons.map(l => {
                    return l.id
                });

                // grab just the id's as an array
                var activityIds = lessons.map(l => {
                    return l.id
                });

                // find this Users LessonsProgresses Activities
                promiseArr.push(user.lessonsProgress({
                    where: {
                        lessonId: {
                            inq: lessonsIds
                        }
                    }
                }));

                // find this Users LessonsProgresses Activities
                promiseArr.push(user.activitiesProgress({
                    where: {
                        activityId: {
                            inq: activityIds
                        }
                    }
                }));

                return Promise.all(promiseArr);
            })
            .then(result => {

                // Users individual Lesson and Activity progresses
                lessonsProgress = result[0];
                activityProgress = result[1];

                // Accumulated Lessons LessonProgress progress
                const lessonTimeCompletedAccumulated = lessons.reduce((acc, l) => {

                    // hold the total lesson time as completed time
                    var completedTime = l.estimatedTime;

                    // find a progress for this user and lesson
                    var progress = _.find(lessonsProgress, ['lessonId', l.id]);
                    if (!progress) progress = 0; // no progress found
                    else progress = progress.progress; // progress !

                    // adjust completed time by progress ratio;
                    completedTime *= progress;

                    return acc + completedTime;
                }, 0);

                // Accumulated Activities ActivityProgress progress
                const activityTimeCompletedAccumulated = activities.reduce((acc, a) => {

                    // hold the total activity time as completed time
                    var completedTime = a.estimatedTime;

                    // find a progress for this user and activity
                    var progress = _.find(activityProgress, ['activityId', a.id]);
                    if (!progress) progress = 0; // no progress found
                    else progress = progress.progress; // progress !

                    // adjust completed time by progress ratio;
                    completedTime *= progress;

                    return acc + completedTime;
                }, 0);

                // Total  Lessons times accumulated and adjusted
                const lessonTimeAccumulated = lessons.reduce((estimatedTime, l) => {
                    return estimatedTime + l.estimatedTime
                }, 0);

                // Total  Activity times accumulated
                const activityTimeAccumulated = activities.reduce((estimatedTime, a) => {
                    return estimatedTime + a.estimatedTime
                }, 0);

                const chapterTotalTime = lessonTimeAccumulated + activityTimeAccumulated;
                const chapterTimeCompleted = lessonTimeCompletedAccumulated + activityTimeCompletedAccumulated;
                const chapterProgress = (chapterTimeCompleted / chapterTotalTime) || 0; //make sure we return 0 if null

                cb(null, {
                    chapterTotalTime,
                    chapterTimeCompleted,
                    chapterProgress,
                });

            })
            .catch(error => {
                cb(error);
            });
    };

    Operationhopeuser.remoteMethod('chapterProgress', {
        description: "Gets the progress of this user on a chapter",
        http: {
            path: '/:id/chapterProgress/:chapterId',
            verb: 'get',
            status: 200,
            errorStatus: 422
        },
        accepts: [{
            arg: 'id',
            type: 'number',
            required: true
        }, {
            arg: 'chapterId',
            type: 'string',
            required: true
        }],
        returns: [{
            //type: '{"chapterTotalTime": "number",\n"chapterTimeCompleted": "number",\n"chapterProgress": "number"}',
            type: {
                chapterTotalTime: 'number',
                chapterTimeCompleted: 'number',
                chapterProgress: 'number'
            },
            root: true
        }]
    });
}
