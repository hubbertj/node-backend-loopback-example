'use strict';

// ===============================================================
// Requires
// ===============================================================
const CronJob = require('cron').CronJob;
const Moment = require('moment');
const Models = require('../server').models;
const _ = require('lodash');
const App = require('../server');
const ENV = App.get('env');

// ===============================================================
//  _____ ______ _____ _   _   _____ ___   _____ _   __ _____
// /  __ \| ___ \  _  | \ | | |_   _/ _ \ /  ___| | / //  ___|
// | /  \/| |_/ / | | |  \| |   | |/ /_\ \\ `--.| |/ / \ `--.
// | |    |    /| | | | . ` |   | ||  _  | `--. \    \  `--. \
// | \__/\| |\ \\ \_/ / |\  |   | || | | |/\__/ / |\  \/\__/ /
//  \____/\_| \_|\___/\_| \_/   \_/\_| |_/\____/\_| \_/\____/
// ===============================================================

// ===============================================================
// Functions
// ===============================================================
const updateVideoStatus = function () {
    /**
     * Regex that returns the 1234567 from -> '/videos/123456/'
     */
    let vimeoVideoIdReg = /\/\w{6}\//;
    let methodsToRun = [];
    let awaitingIds = [];
    let completedIds = [];
    let errorIds = [];

    /**
     * @description Uses regex to return the ID of a video from Vimeo url
     *
     * @author jaredcowan
     *
     * @param {string} text - Vimeo video uri parameter
     *
     * @returns {string}
     */
    let getVideoId = function (text) {
        return text.split(vimeoVideoIdReg)[1];
    };

    let updateVideosModel = function (status, variableName) {
        let idsArray = eval(variableName);

        if (!idsArray || idsArray.length < 1 || !variableName) {
            return false;
        }

        var updateObj = {
            internal_status: status
        };

        switch (status) {
            case 'error':
                updateObj = Object.assign(updateObj, {status: 'error'});
                break;
            case 'completed':
                updateObj = Object.assign(updateObj, {status: 'complete'});
                break;
        }

        Models.Video.updateAll({
            id: {
                inq: eval(variableName)
            }
        }, updateObj, function (err, res) {
            if (err) console.log(err);

            console.log(`Updated res.count records in cron`);
        });
    };

    Models.Video.find({
        filter: {
            where: {
                internal_status: 'indeterminate'
            }
        }
    }, function (videosErr, videosRes) {

        Models.Vimeo.pendingUploads(function (vimeoErr, vimeoRes) {
            _.forEach(videosRes, function (videosObj, videosIndex) {
                _.forEach(vimeoRes.data, function (vimeoObj, vimeoIndex) {
                    if (getVideoId(vimeoObj.uri) === videosObj.vimeoId) {

                        switch (vimeoObj.status) {
                            case 'uploading':
                                if (!~methodsToRun.indexOf('awaiting') && videosObj.internal_status !== 'awaiting') methodsToRun.push('awaiting');
                                if (videosObj.internal_status !== 'awaiting') awaitingIds.push(parseInt(videosObj.id));
                                break;
                            case 'uploading_error':
                                if (!~methodsToRun.indexOf('error') && videosObj.internal_status !== 'error') methodsToRun.push('error');
                                if (videosObj.internal_status !== 'completed') errorIds.push(parseInt(videosObj.id));
                                break;
                            case 'available':
                                if (!~methodsToRun.indexOf('completed') && videosObj.internal_status !== 'completed') methodsToRun.push('completed');
                                if (videosObj.internal_status !== 'completed') completedIds.push(parseInt(videosObj.id));
                                break;
                        } // END switch

                        _.forEach(methodsToRun, function (name) {
                            let variableName = name + 'Ids';
                            updateVideosModel(name, variableName);
                        });
                    } // END if
                });
            });
        });
    });
};

// ===============================================================
// Get Video status
// ===============================================================
const devCron = new CronJob('* * 01 * * *', updateVideoStatus, null, false, 'UTC');

const prodCron = new CronJob('* 59 23 * * *', updateVideoStatus, null, false, 'UTC');

// if (~['prod', 'production'].indexOf(ENV.toLowerCase())) {
//     prodCron.start();
// } else {
//     devCron.start();
// }
