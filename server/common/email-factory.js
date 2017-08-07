/*
 * @Author: Jamie Medina
 * @Date:   2017-04-04 15:39:07
 * @Last Modified by:   Jerum Hubbert
 * @Last Modified time: 2017-04-06 11:00:53
 *
 *   Returns a EmailFactory used for sending emails
 *   EmailFactory should be the only object which fetchs email templates.
 */

'use strict';

// Requires
const _ = require('lodash');
const path = require('path');
const Mandrill = require('mandrill-api/mandrill').Mandrill;
const ejs = require('ejs');
const app = require('../server');

// Set mandrill instance
const mandrillSettings = app.get('mandrill');
var mandrill = new Mandrill(mandrillSettings.apiKey);


/**
 * Private
 * Sends a message over mandrill
 *
 * @param  {object} message
 * @return {void}
 */
function send(template, templateVars, emailHeaders, cb) {
    const templatePath = path.resolve(__dirname, template);

    ejs.renderFile(templatePath, templateVars, (err, html) => {
        emailHeaders.html = html;
        emailHeaders.from_name = mandrillSettings.from.name;
        emailHeaders.from_email = mandrillSettings.from.email;

        mandrill.messages.send({
            message: emailHeaders,
            async: true,
        }, (result) => {
            console.log(result);
            cb();
        }, (e) => {
            console.log('mandrill error', e.name, e.message);
            cb('mandrill error');
        });
    });
};

/**
 * Returns a email object for sending emails
 * @param {obj} options passed in configs
 *  mandrill - settings for mandrill
 */
function EmailFactory(options) {

    if (options && options.hasOwnProperty('mandrill')) {
        _.extend(mandrill, options.mandrill);
    }

    /**
     * Public
     * Emails password reset to user
     *
     * @param  {object} userInfo  The user data object
     * @return {void}
     */
    this.resetPassword = function (user) {
        const resetPasswordTemplate = '../view/email/reset-password.ejs';

        // Send seller email
        send(resetPasswordTemplate, {accessToken: user.accessToken.id, user: user, resetUrl: 'http://'}, {
            subject: 'Operation Hope Password Reset Request',
            to: [{
                type: 'to',
                email: user.email,
            },],
        }, () => {
            console.log('passwordReset email', user.email);
        });
    };


    /**
     * Public
     * User registers
     *
     * @param  {userObj}
     * @return {void}
     */
    this.userRegistration = function (userObj) {
        const buyerTemplate = './view/email/registration.ejs';

        // Send seller email
        send(buyerTemplate, {}, {
            subject: 'Welcome to Operation Hope !',
            to: [{
                type: 'to',
                email: userObj.email,
            },],
        }, () => {
            console.log('userRegistration email', userObj.email);
        });
    };
}

// Exports
module.exports = EmailFactory;
