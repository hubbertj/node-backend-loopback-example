'use strict';

/**
 * @author Loopback
 *
 * @file Stores the current user object per-request to LoopbackContext.
 * This allows you to call ctx.get('currentUser') in remote methods,
 * hook, and operation hooks. Assuming you required 'loopback-context'
 * module and assigned LoopbackContext.getCurrentContext() to
 * a variable ctx; The variable must be assigned in the request,
 * not at the root of the file.
*/

/**
 * @description Models for operationHope
 *
 * @type {Object}
*/
const Models = require('../server').models;

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
 * @returns {Namespace | null} The context object or null.
 */
const LoopBackContext = require('loopback-context');

module.exports = function (options) {
    return function storeCurrentUser(req, res, next) {
        if (!req.accessToken) {
            return next();
        }

        Models.OperationHopeUser.findById(req.accessToken.userId, function(err, user) {
            if (err) {
                return next(err);
            }

            if (!user) {
                return next(new Error('No user with this access token was found.'));
            }

            var ctx = LoopBackContext.getCurrentContext();

            if (ctx) {
                ctx.set('currentUser', user);
            }

            next();
        });
    };
};
