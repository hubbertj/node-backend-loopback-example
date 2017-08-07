'use strict';

module.exports = function (Operationhopeuser) {

    // Returns if the user has watched a video
    Operationhopeuser.hasWatchedVideo = function (id, videoId, cb) {
        Operationhopeuser.findById(id)
            .then(User => {
                User.userVideosWatched.findOne({
                    where: {
                        videoId: videoId
                    }
                }, cb);
            })
            .catch(error => {
                cb(error);
            });
    };

    Operationhopeuser.remoteMethod('hasWatchedVideo', {
        description: "Gets if the user has watched a video",
        http: {
            path: '/:id/hasWatchedVideo/:videoId',
            verb: 'get',
            status: 200,
            errorStatus: 422
        },
        accepts: [{
            arg: 'id',
            type: 'number',
            required: true
        }, {
            arg: 'videoId',
            type: 'string',
            required: true
        }],
        returns: [{
            type: 'UserVideoWatched',
            root: true
        }]
    });
}
