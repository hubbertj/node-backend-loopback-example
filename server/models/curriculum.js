'use strict';

/**
 * @todo Document these functions
*/

const _ = require('lodash');
const Models = require('../server').models;

module.exports = function (Curriculum) {

    Curriculum.lessonCount = function (curriculumId, cb) {
        var Models = Curriculum.app.models;
        var chapters = [];

        Models.Chapter.find({
            where: {
                curriculumId: curriculumId
            }
        }).then(function (results) {
            var chapterIdArr = [];
            chapters = results;

            for (var x in chapters) {
                chapterIdArr.push({chapterId: chapters[x].id});
            }

            if (chapterIdArr.length === 0) {
                return new Promise(function (reslove) {
                    return reslove(chapterIdArr);
                })
            }

            return Models.Lesson.find({
                where: {or: chapterIdArr}
            });

        }).then(function (results) {
            cb(null, results.length);
        }).catch(function (err) {
            cb(error);
        });
    };

    //TODO: Add User count information per curriculum to this.
    Curriculum.adminDashboard = function (req, cb) {
        var Models = Curriculum.app.models;
        var collection = [];

        Curriculum.find({
            where: {}
        }).then(function (curriculums) {
            var promiseArr = [];

            collection = collection.concat(curriculums);
            collection.forEach(function (value) {
                promiseArr.push(new Promise(function (reslove, reject) {
                    Curriculum.lessonCount(value.id, function (err, count) {
                        if (err) return reject(err);
                        return reslove({id: value.id, lessonCount: count});
                    });
                }));
            });

            return Promise.all(promiseArr);

        }).then(function (results) {
            var promiseArr = [];

            results.forEach(function (value) {
                var curriculum = _.find(collection, function (curriculum) {
                    return curriculum.id === value.id
                });
                if (curriculum) {
                    curriculum.lessonCount = value.lessonCount;
                }
            });

            collection.forEach(function (curriculum) {
                promiseArr.push(
                    Models.Chapter.count({curriculumId: curriculum.id})
                        .then(function (count) {
                            return new Promise(function (resolve, reject) {
                                return resolve({id: curriculum.id, chapterCount: count});
                            });
                        })
                );
            });

            return Promise.all(promiseArr);
        }).then(function (results) {

            results.forEach(function (value) {
                var curriculum = _.find(collection, function (curriculum) {
                    return curriculum.id === value.id
                });
                if (curriculum) {
                    curriculum.chapterCount = value.chapterCount;
                }
            });

            cb(null, collection);
        }).catch(function (err) {
            cb(err);
        });
    };

    Curriculum.hasEnrollmentQuestions = function (id, cb) {

        Models.EnrollmentQuestion.findOne({
            where: {
                curriculumId: id
            }
        }).then(function (res) {
            if (res === null) cb(null, {exists: false});

            cb(null, {exists: true});
        }).catch(function (err) {
            cb(null, {exists: false});
        });
    };

    Curriculum.remoteMethod('hasEnrollmentQuestions', {
        description: "Returns and object with a property exists, that has a boolean if questions have been created",
        http: {
            path: '/hasEnrollmentQuestions',
            verb: 'get',
            status: 200,
            errorStatus: 422
        },
        accepts: [
            {
                arg: 'id',
                type: 'number',
                required: true
            }
        ],
        returns: [
            {
                type: {
                    exists: 'boolean'
                },
                root: true
            }
        ]
    });

    Curriculum.userTakenEnrollment = function (id, userId, cb) {

        Models.Enrollment.findOne({
            where: {
                and: [
                    {
                        curriculumId: id,
                        userId: userId
                    }
                ]
            }
        }).then(function (res) {
            if (res === null) cb(null, {exists: false});

            cb(null, {exists: true});
        }).catch(function (err) {
            cb(null, {exists: false});
        });
    };

    Curriculum.remoteMethod('userTakenEnrollment', {
        description: "Returns and object with a property exists, that has a boolean if questions have been created",
        http: {
            path: '/userTakenEnrollment',
            verb: 'get',
            status: 200,
            errorStatus: 422
        },
        accepts: [
            {
                arg: 'id',
                type: 'number',
                description: 'Curriculum ID',
                required: true
            },
            {
                arg: 'userId',
                type: 'number',
                description: 'User ID',
                required: true
            }
        ],
        returns: [
            {
                type: {
                    exists: 'boolean'
                },
                root: true
            }
        ]
    });

    Curriculum.remoteMethod('adminDashboard', {
        description: "Returns all system curriculums with additional data for admin dashboard.",
        http: {
            path: '/adminDashboard',
            verb: 'get',
            status: 200,
            errorStatus: 422
        },

        accepts: [{arg: 'req', type: 'object', 'http': {source: 'req'}}],
        returns: [{type: 'array', root: true}]
    });


    Curriculum.remoteMethod('lessonCount', {
        description: "returns a count of all lesson within Curriculum.",
        http: {
            path: '/lessonCount',
            verb: 'get',
            status: 200,
            errorStatus: 422
        },
        accepts: [{arg: 'id', type: 'number', required: true}],
        returns: [{arg: 'count', type: 'number'}]
    });
};
