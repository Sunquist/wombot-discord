const { MongoClient } = require('mongodb');

const connections = {}

exports.getDatabase = async (database) => {
    const connectionList = (process.env.NODE_ENV === "production")? connections : global.connections;

    if(connectionList && connectionList[database]){
        return connectionList[database]
    }

    const client = await MongoClient.connect(process.env[`MONGODB_URI`] || '');
    const db = await client.db(database);

    if(process.env.NODE_ENV === "production")
        connectionList[database] = db;
    else
        global.connections = {
            ...(global.connections || {}),
            [database]: db
        }

    return db
};