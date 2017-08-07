'use strict';

/**
 * @description Get the current context object. The context is preserved
 * across async calls, it behaves like a thread-local storage.
 *
 * @param {Object[]} options
 *
 * @property {Boolean} bind Bind get/set/bind methods of the context to the
 * context that's current at the time getCurrentContext() is invoked. This
 * can be used to work around 3rd party code breaking CLS context propagation.
 *
 * @return {Namespace} The context object or null.
 */
const LoopBackContext = require('loopback-context');

module.exports = function(Enrollment) {

    Enrollment.afterRemote('fake', function (context, respond, next) {
        /**
         * @description Assign instance of current context
         *
         * @type {Object}
         *
         * @example
         * ctx.get('currentUser'); -> {Object}
         *
         * @returns {Object}
        */
        var ctx = LoopBackContext.getCurrentContext();

        next();
    });

    Enrollment.fake = function (cb) {
        cb(null, {})
    };

    Enrollment.remoteMethod('fake', {
        description: "Gets the progress of this user on a chapter",
        http: {
            path: '/fake',
            verb: 'get',
            status: 200,
            errorStatus: 422
        },
        accepts: [],
        returns: [{
            type: "Object",
            root: true
        }]
    });
};
