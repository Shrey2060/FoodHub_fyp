const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',  // Your MySQL password if you have set one
    database: 'foodhub',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

module.exports = dbConfig;
