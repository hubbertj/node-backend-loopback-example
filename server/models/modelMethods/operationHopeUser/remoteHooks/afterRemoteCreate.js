'use strict';

module.exports = function (Operationhopeuser) {
    // Add User role to new users
    Operationhopeuser.afterRemote('create', function (context, respond, next) {
        // Add user permission;
        global.Role.User.principals.create({
            principalType: global.Role.RoleMapping.USER,
            principalId: respond.id
        }, function (err, principal) {
            if (err) console.error('Failed to add permission ' + err);
            next();
        });
    });
};
