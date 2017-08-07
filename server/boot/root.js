'use strict';

module.exports = function (server) {
    // Install a `/` route that returns server status
    var router = server.loopback.Router();

    router.get('/', (req, res) => {
        res.redirect(301, '/explorer');
    });

    router.get('/api', (req, res) => {
        res.redirect(301, '/explorer');
    });

    router.get('/status', server.loopback.status());
    server.use(router);
};
