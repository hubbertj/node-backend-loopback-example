'use strict';
var _ = require('lodash');

module.exports = function (Thrusercompletedachievemnt) {

    const Self = Thrusercompletedachievemnt;

    Self.observe('after save', function (ctx, next) {
        if (ctx.instance && ctx.isNewInstance) {
            // Check if the chapter was completed and award the chapter trophy
            checkForChapterComplete(ctx.instance, next);
        } else {
            next();
        }

    });

    function checkForChapterComplete(ThrUserCompletedAchievemnt, next) {
        //ThrUserCompletedAchievemnt = { operationHopeUserId: 19, achievementId: 1, id: 4 }

        const Models = Self.app.models;
        var achievement = undefined;
        var chapterAchievements = undefined
        var usersAchievements = undefined

        // Find the achievement that we awarded
        Models.Achievement.findById(ThrUserCompletedAchievemnt.achievementId)
            .then(result => {
                achievement = result;
                // achievement = { name:
                //  { en: 'Lesson 1',
                //    xh: 'string',
                //    yi: 'string',
                //    yo: 'string',
                //    za: 'string' },
                // contentUri: 'string',
                // id: 2,
                // chapterId: null,
                // lessonId: 1,
                // activityId: null }

                if (achievement) {
                    // Find all the chapter achievements and the users achievements awarded
                    return Promise.all([

                        Models.Achievement.find({
                            where: {
                                chapterId: achievement.chapterId
                            },
                            fields: ['id', 'type']
                        }),

                        Models.ThrUserCompletedAchievemnt.find({
                            where: {
                                operationHopeUserId: ThrUserCompletedAchievemnt.operationHopeUserId
                            }
                        })

                    ]);

                } else {
                    // No result, do nothing and move on
                    return Promise.resolve();
                }
            })
            .then(result => {

                // No result, do nothing and move on
                if (!result)
                    return Promise.resolve();

                chapterAchievements = result[0];
                usersAchievements = result[1];

                var hasAllChapterAchievements = true;
                var hasChapterAchievement = false;
                var thisChapterAchievement = undefined;

                _.forEach(chapterAchievements, ca => {

                    // If this Chapter Achievement is of type Chapter
                    if (ca.type === 'Chapter') {

                        // Find out if the user hasChapterAchievement
                        if (_.find(usersAchievements, ['achievementId', ca.id])) {
                            hasChapterAchievement = true;
                        }

                        // Keep track of this chapters achievement
                        thisChapterAchievement = ca;

                    } else { // Else this is a Lesson or Activity achievement

                        // Test that the user has all chapter achievements by seeing if any id's are missing from usersAchievements
                        if (!_.find(usersAchievements, ['achievementId', ca.id])) {
                            hasAllChapterAchievements = false;
                        }

                    }
                });

                // Already has the chapter achievement or doesn't have all the achievement or this chapter has no achievement
                if (hasChapterAchievement || !hasAllChapterAchievements || !thisChapterAchievement)
                    return Promise.resolve();

                // Award this Chapter achievement
                return Thrusercompletedachievemnt.create({
                    operationHopeUserId: ThrUserCompletedAchievemnt.operationHopeUserId,
                    achievementId: thisChapterAchievement.id
                });

            })
            .then(result => {
                // Done
                next();
            })
            .catch(error => {
                next(error);
            })
    }

};
