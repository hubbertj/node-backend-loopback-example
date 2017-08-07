'use strict';
var _ = require('lodash');

module.exports = function (Operationhopeuser) {

    // returns if the user has watched a video
    Operationhopeuser.completedStartAssessment = function (id, chapterId, cb) {

        const Models = Operationhopeuser.app.models;
        const promiseArr = [];

        // find user by Id
        promiseArr.push(Operationhopeuser.findById(id, {
            fields: ['id']
        }));

        promiseArr.push(Models.Assessment.findOne({
            where: {
                'chapterId': chapterId
            },
            fields: ['id', 'chapterId']
        }));

        var user = undefined;
        var assessment = undefined;

        // find Chapters Lessons
        Promise.all(promiseArr)
            .then(result => {

                user = result[0];
                assessment = result[1];

                // TODO: user not found error
                if (!user || !assessment) {
                    return Promise.resolve();
                } else {
                    return Models.AssessmentScore.findOne({
                        where: {
                            and: [{
                                operationHopeUserId: id
                            }, {
                                assessmentId: assessment.id
                            }, {
                                scoreType: 'Start'
                            }]
                        }
                    });

                }

            }).then(result => {
            cb(null, {status: result ? true : false});
        }).catch(error => {
            cb(error);
        });
    };

    Operationhopeuser.remoteMethod('completedStartAssessment', {
        description: "Returns if the user has completed there start assessment for this chapter",
        http: {
            path: '/:id/completedStartAssessment/:chapterId',
            verb: 'get',
            status: 200,
            errorStatus: 422
        },
        accepts: [{
            arg: 'id',
            type: 'number',
            required: true
        },
        {
            arg: 'chapterId',
            type: 'string',
            required: true
        }],
        returns: [{
            type: {
                status: 'boolean'
            },
            root: true
        }]
    });

}
