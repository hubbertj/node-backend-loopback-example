'use strict';

module.exports = function (app) {
    var Role = app.models.Role;
    /**
     * Get a role by name
     * @param name
     */
    Role.byName = function (name, callback) {
        Role.findOne({where: {name: name}}, callback);
    }
}
