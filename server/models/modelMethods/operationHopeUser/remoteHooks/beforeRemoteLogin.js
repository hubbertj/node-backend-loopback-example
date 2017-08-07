'use strict';

module.exports = function (Operationhopeuser) {
    // Support for username login;
    Operationhopeuser.beforeRemote('login', function (context, respond, next) {
        if (context.args.hasOwnProperty('username')) {
            Operationhopeuser.findOne({
                where: {
                    username: context.args.username
                }
            })
                .then(function (operationhopeuser) {
                    context.args.email = operationhopeuser.email;
                    next();
                })
                .catch(function (err) {
                    console.error(err);
                    next();
                })
        } else {
            next();
        }
    });
};
