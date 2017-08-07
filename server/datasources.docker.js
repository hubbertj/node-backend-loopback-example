module.exports = {
    db: {
        name: 'db',
        connector: 'memory',
    },
    mysqlDs: {
        name: 'mysqlDs',
        connector: 'mysql',
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        database: process.env.DB_NAME || 'operationhope',
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || 'root',
        acquireTimeout: 30000
    }
};
