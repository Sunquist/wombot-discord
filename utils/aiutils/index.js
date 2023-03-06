const { Configuration, OpenAIApi } = require("openai");
const { getDatabase } = require("./database/client");
const fs = require('fs');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

exports.playerImage = async (entity, prompt, props) => {
    const database = await getDatabase('openai');
    const image = await database.collection('player_image').findOne({
        entity
    })

    if(image){
        console.log("Returning a cached image for", entity)
        return Buffer.from(image.content, "base64")
    }

    const response = await openai.createImage({
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        response_format: "b64_json"
      });

    database.collection('player_image').insertOne({
        entity,
        prompt,
        props,
        content: response.data.data[0].b64_json,
        created: Date.now()
    })
    
    const content = Buffer.from(response.data.data[0].b64_json, "base64");
    return content;
};