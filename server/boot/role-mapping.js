'use strict';

module.exports = function (app) {
    var RoleMapping = app.models.RoleMapping;
    /**
     * Get user ID's by role name
     * @param role
     * @param callback
     */
    RoleMapping.usersIDByRole = function (role, callback) {
        RoleMapping.app.models.Role.byName(role, function (err, role) {

            if (err || !role) return callback(err);

            RoleMapping.find({
                where: {
                    roleId: role.id,
                    principalType: RoleMapping.USER
                }
            }, function (err, mappings) {

                if (err) return callback(err);

                var users = mappings.map(function (m) {
                    return m.principalId;
                });

                callback(null, users);
            });

        });
    }
};
