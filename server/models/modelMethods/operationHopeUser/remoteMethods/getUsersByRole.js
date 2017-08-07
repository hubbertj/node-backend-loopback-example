'use strict';

module.exports = function (Operationhopeuser) {

    Operationhopeuser.getUsersByRole = function (role, req, cb) {
        new Promise(function (reslove, reject) {
            Operationhopeuser.app.models.RoleMapping.usersIDByRole(role, function (err, users) {

                if (err || !users) {
                    return reject(err);
                }

                return reslove(users);
            });
        }).then(function (users) {
            if (users && users.length > 0) {
                return Operationhopeuser.find({
                    where: {
                        id: {
                            inq: users
                        }
                    }
                });
            } else {
                return new Promise(function (reslove, reject) {
                    return reslove(users);
                });
            }
        }).then(function (operationhopeusers) {
            cb(null, operationhopeusers);
        }).catch(function (err) {
            cb(err);
        });

    };

    Operationhopeuser.remoteMethod('getUsersByRole', {
        description: "Gets users by roles",
        http: {
            path: '/getUsersByRole',
            verb: 'get',
            status: 200,
            errorStatus: 422
        },
        accepts: [{
            arg: 'role',
            type: 'string',
            required: true
        },
            {
                arg: 'req',
                type: 'object',
                'http': {
                    source: 'req'
                }
            }
        ],
        returns: [{
            type: 'array',
            root: true
        }]
    });


}
