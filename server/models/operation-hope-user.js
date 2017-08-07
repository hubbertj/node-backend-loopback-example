'use strict';

// =========================================================================================================
// Remote Methods
// =========================================================================================================
const chapterProgress = require('./modelMethods/operationHopeUser/remoteMethods/chapterProgress.js');
const completedStartAssessment = require('./modelMethods/operationHopeUser/remoteMethods/completedStartAssessment.js');
const completedExitAssessment = require('./modelMethods/operationHopeUser/remoteMethods/completedExitAssessment.js');
const createAdmin = require('./modelMethods/operationHopeUser/remoteMethods/createAdmin.js');
const getUsersByRole = require('./modelMethods/operationHopeUser/remoteMethods/getUsersByRole.js');
const hasWatchedVideo = require('./modelMethods/operationHopeUser/remoteMethods/hasWatchedVideo.js');
const ohAdminEvents = require('./modelMethods/operationHopeUser/remoteMethods/ohAdminEvents.js');

// =========================================================================================================
// Remote Hooks
// =========================================================================================================
const beforeRemoteLogin = require('./modelMethods/operationHopeUser/remoteHooks/beforeRemoteLogin.js');
const afterRemoteLogin = require('./modelMethods/operationHopeUser/remoteHooks/afterRemoteLogin.js');
const afterRemoteCreate = require('./modelMethods/operationHopeUser/remoteHooks/afterRemoteCreate.js');

module.exports = function (Operationhopeuser) {

    // =========================================================================================================
    // Remote Hooks
    // =========================================================================================================
    beforeRemoteLogin(Operationhopeuser);
    afterRemoteLogin(Operationhopeuser);
    afterRemoteCreate(Operationhopeuser);

    // =========================================================================================================
    // Remote Methods
    // =========================================================================================================

    // Adds createAdmin remoteMethod to Operationhopeuser
    createAdmin(Operationhopeuser);

    // Adds chapterProgress remoteMethod to Operationhopeuser
    chapterProgress(Operationhopeuser);

    // Adds completedStartAssessment remoteMethod to Operationhopeuser
    completedStartAssessment(Operationhopeuser);

    // Adds getUsersByRole remoteMethod to Operationhopeuser
    getUsersByRole(Operationhopeuser);

    // Adds hasWatchedVideo remoteMethod to Operationhopeuser
    hasWatchedVideo(Operationhopeuser);

    // Adds completedExitAssessment remoteMethod to Operationhopeuser
    completedExitAssessment(Operationhopeuser);

    // Manages all events for this model;
    ohAdminEvents(Operationhopeuser);
};
