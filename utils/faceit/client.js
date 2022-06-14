const axios = require('axios');

module.exports = class FaceitApiClient {
  constructor() {
    this.baseUrl = 'https://api.faceit.com/';
  }

  async request(props) {
    const req = await axios({
      baseURL: this.baseUrl,
      ...props,
    });
    if (!req.data || (req.data.result && req.data.result !== 'OK'))
      throw new Error(`Unexpected error: ${req.data}`);
    return req.data;
  }
}
