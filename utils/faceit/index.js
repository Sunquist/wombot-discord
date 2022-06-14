const FaceitClient = require('./client');
const Methods = require('./methods');

class Faceit {
  constructor (options) {
    this.database = options.database || null;
    this.cache = options.cache || null;
    this.client = new FaceitClient();
    this.options = options;

    this.Methods = new Methods(this);
  }

  async GetUserId (nickname) {
    try {
      const user =
      (this.cache && this.cache.get)? await this.cache.get(`user_${nickname}`)
      : (this.database && this.database.get)? await this.database.get({
        db: "faceit",
        collection: "user",
        filter: { nickname }
      })
      : await this.GetUser(nickname);

      return user.id
    }catch(ex){
      console.log(ex);

      if(ex.response.status === 404)
        throw({
          status: 404,
          code: "USER_NOT_FOUND",
          message: `Player '${nickname}' not found. Note: nicknames are case sensitive.`
        })

      throw({
        status: 500,
        code: "UNEXPECTED_ERROR",
        message: ex.message
      })
    }
  }

  async GetUser (nickname) {
    try {
      const req = await this.client.request({
        url: `/users/v1/nicknames/${nickname}`,
      });

      if(this.database && this.database.save)
        this.database.save({
          db: "faceit",
          collection: "user",
          doc: req.payload
        })

      return req.payload
    }catch(ex){
      console.log(ex);

      if(ex.response.status === 404)
        throw({ status: 404, code: "USER_NOT_FOUND", message: `Player '${nickname}' not found. Note: nicknames are case sensitive.`, ...ex})

      throw({ status: 500, code: "UNEXPECTED_ERROR", message: ex.message, ...ex })
    }
  }

  async GetStats (userId) {
    try {
      const req = await this.client.request({
        url: `stats/v1/stats/users/${userId}/games/csgo`,
      });

      return req
    }catch(ex){
      console.log(ex);

      if(ex.response.status === 404)
        throw({ status: 404, code: "USER_NOT_FOUND", message: `User could not be found.`, ...ex})

      throw({ status: 500, code: "UNEXPECTED_ERROR", message: ex.message, ...ex })
    }
  }

  async GetMatch (matchId) {
    try {
      const req = await this.client.request({
        url: `match/v2/match/${matchId}`,
      });

      return req.payload
    }catch(ex){
      console.log(ex);

      if(ex.response.status === 404)
        throw({ status: 404, code: "MATCH_NOT_FOUND", message: `Match could not be found.`, ...ex})

      throw({ status: 500, code: "UNEXPECTED_ERROR", message: ex.message, ...ex })
    }
  }

  async GetCurrentMatch (userId) {
    try {
      const req = await this.client.request({
        url: `match/v1/matches/groupByState?userId=${userId}`,
      });

      return (req && Object.keys(req.payload).length > 0)? req.payload[Object.keys(req.payload)[0]][0] : null;
    }catch(ex){
      console.log(ex);

      if(ex.response.status === 404)
        throw({ status: 404, code: "USER_NOT_FOUND", message: `User could not be found.`, ...ex})

      throw({ status: 500, code: "UNEXPECTED_ERROR", message: ex.message, ...ex })
    }
  }

  async GetLatestMatches (userId, limit, page) {
    try {
      const req = await this.client.request({
        url: `stats/v1/stats/time/users/${userId}/games/csgo?page=${page}&size=${(limit > 2000)? 2000 : limit}`,
      });

      if(limit <= 2000)
        return req;

      let results = (req.data)? req.data : req;
      let response = (req.data)? req.data : req;

      while ( response && response.length > 0 ){
        page++;

        const fetchMore = await this.client.request({
          url: `stats/v1/stats/time/users/${userId}/games/csgo?page=${page}&size=${2000}`
        });

        response = (fetchMore.data)? fetchMore.data : fetchMore;
        results = [...results, ...response]
      }

      return results;
    }catch(ex){
      console.log(ex)

      if(ex.response && ex.response.status === 404)
        throw({ status: 404, code: "USER_NOT_FOUND", message: `User could not be found.`, ...ex})

      throw({ status: 500, code: "UNEXPECTED_ERROR", message: ex.message, ...ex })
    }
  }
}

module.exports = (options) => new Faceit(options || {});
