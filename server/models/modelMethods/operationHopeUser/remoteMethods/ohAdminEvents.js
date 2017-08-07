/*
 * @Author: Jerum Hubbert
 * @Date:   2017-04-04 14:50:22
 * @Last Modified by:   Jerum Hubbert
 * @Last Modified time: 2017-04-06 10:54:07
 */
'use strict';
var EmailFactory = require('../../../../common/email-factory');

module.exports = function (Operationhopeuser) {

    /*
     * manages the password reset event; sends a email to a Operationhopeuser
     */
    Operationhopeuser.on('resetPasswordRequest', function (data) {
        var emailFactory = new EmailFactory();
        emailFactory.resetPassword(data);
    });

    Operationhopeuser.on('welcomeUserRequest', function (data) {
        var emailFactory = new EmailFactory();
        emailFactory.userRegistration(data);
    });
}
