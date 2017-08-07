// Invoke strict mode
'use strict';

module.exports = function migrations(app, cb) {

    // Variable declarations
    const dataSources = app.dataSources;
    const mysqlDs = dataSources.mysqlDs;

    console.log('===================================');
    console.log('=              BOOT               =');
    console.log('===================================');
    console.log('NODE_ENV: ', process.env.NODE_ENV);
    console.log('mysqlDs: ', mysqlDs.connector.settings);

    // Create base models
    mysqlDs.autoupdate([
        'ACL',
        'Role',
        'RoleMapping',
        'AccessToken',
    ], (errorBaseTables) => {

        // Check for errors
        if (errorBaseTables) {
            throw errorBaseTables;
        }

        // Output
        console.log('> base model tables created sucessfully');

        // Create app tables
        mysqlDs.autoupdate([
            'Achievement',
            'Activity',
            'ActivityProgress',
            'Assessment',
            'AssessmentScore',
            'Chapter',
            'Curriculum',
            'Deliverable',
            'Entity',
            'HeroImage',
            'Lesson',
            'LessonProgress',
            'OperationHopeUser',
            'UserNote',
            'UserRecord',
            'UserVideoWatched',
            'Video',
            'WorkerQueue',
            'Enrollment',
            'EnrollmentQuestion'

        ], (errorAppTables) => {

            // Catch errors
            if (errorAppTables) {
                throw errorAppTables;
            }

            // Create app tables
            mysqlDs.autoupdate([
                'ThrEntityUsers',
                'ThrEntityUserAdmins',
                'ThrUserCompletedAchievemnt',
            ], (errorAppTables) => {

                // Catch errors
                if (errorAppTables) {
                    throw errorAppTables;
                }

                // Output
                console.error('> app tables created sucessfully');

                // Remove all roles
                app.models.Role.destroyAll(null, (errorDestroyAllRoles) => {
                    global.Role = {};
                    // Catch errors
                    if (errorDestroyAllRoles) {
                        throw errorDestroyAllRoles;
                    }

                    console.log('creating roles');
                    app.models.Role.create({
                        id: 1,
                        name: 'user',
                        description: 'A user with rights for creating and deleting.'
                    }).then(function (role) {
                        global.Role.User = role;
                        return app.models.Role.create({
                            id: 2,
                            name: 'admin',
                            description: 'A user with no rights.'
                        });
                    }).then(function (role) {
                        global.Role.Admin = role;
                        global.Role.RoleMapping = app.models.RoleMapping;
                        // continue to next boot script
                        cb();
                    }).catch(function (err) {
                        console.error(err);
                        //will error if there already in the db;
                        cb();
                    });

                });

            });

        }); // mysqlDs.autoupdate([

    }); // mysqlDs.autoupdate([

};
