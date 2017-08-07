'use strict';

var randomstring = require("randomstring");

module.exports = function (Operationhopeuser) {

    Operationhopeuser.createAdmin = function (email, username, firstName, lastName, gender, zipCode, birthDate, credentials, challenges, req, cb) {

        //Generate random password
        var password = randomstring.generate({
            length: 12,
            charset: 'alphabetic'
        });

        var user = {
            email: email,
            username: username,
            firstName: firstName,
            lastName: lastName,
            gender: gender,
            zipCode: zipCode,
            birthDate: new Date() || birthDate,
            credentials: credentials,
            challenges: challenges,
            password: password
        }

        Operationhopeuser.create(user)
            .then(function (operationhopeUser) {

                Operationhopeuser.resetPassword({
                    email: operationhopeUser.email
                }, function () {
                    console.log('sending forgot password to: ' + operationhopeUser.email);
                });

                cb(null, {
                    operationhopeUser
                });
            }).catch(function (err) {
            cb(err);
        });
    };

    Operationhopeuser.afterRemote('createAdmin', function (context, respond, next) {
        var user = respond.operationhopeUser;

        // Add admin permission;
        global.Role.Admin.principals.create({
            principalType: global.Role.RoleMapping.USER,
            principalId: user.id
        }, function (err, principal) {
            if (err) console.error('Failed to add permission ' + err);
            next();
        });
    });

    Operationhopeuser.remoteMethod('createAdmin', {
        description: "Creates a admin, can only be called by a admin.",
        http: {
            path: '/admin',
            verb: 'post',
            status: 200,
            errorStatus: 422
        },
        accepts: [{
            arg: 'email',
            type: 'string',
            required: true
        }, {
            arg: 'username',
            type: 'string',
            required: true
        }, {
            arg: 'firstName',
            type: 'string'
        }, {
            arg: 'lastName',
            type: 'string'
        }, {
            arg: 'gender',
            type: 'string'
        }, {
            arg: 'zipCode',
            type: 'string'
        }, {
            arg: 'birthDate',
            type: 'date'
        }, {
            arg: 'credentials',
            type: 'object'
        }, {
            arg: 'challenges',
            type: 'object'
        }, {
            arg: 'req',
            type: 'object',
            'http': {
                source: 'req'
            }
        }],
        returns: [{
            type: 'OperationHopeUser',
            root: true
        }]
    });
}
