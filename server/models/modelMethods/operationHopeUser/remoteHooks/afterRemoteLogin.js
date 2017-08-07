'use strict';

module.exports = function (Operationhopeuser) {
    Operationhopeuser.afterRemote('login', function (context, respond, next) {
        var Models = Operationhopeuser.app.models;
        var result = context.result;

        Models.ThrEntityUserAdmins.find({
            where: {
                operationHopeUserId: result.userId
            }
        }).then(function (results) {
            var entitys = [];
            if (results && results.length > 0) {
                var orQuery = [];
                for (var i in results) {
                    orQuery.push({
                        id: results[i].entityId
                    });
                }
                return Models.Entity.find({
                    where: {
                        or: orQuery
                    }
                });
            } else {
                return new Promise(function (reslove, reject) {
                    return reslove(entitys);
                })
            }

        }).then(function (results) {
            context.result.entitys = results;
            next();
        });
    });
};
