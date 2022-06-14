module.exports = {
  discord: {
    refreshCommands: false,
  },
  mongo: {
    url: process.env.MONGO_URL,
    database: process.env.MONGO_DB
  }
}
