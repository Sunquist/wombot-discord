const { SlashCommandBuilder } = require('@discordjs/builders');
const { playerImage } = require('../utils/aiutils');

const commandConfig = {
  command: "vision",
  commandAlts: [ "v" ],
  description: "Displays how wombot envisions given player.",
  help: "vision :nickname*",
}  

const getRandomPrompt = (prompts) => {
  return prompts[Math.floor(Math.random() * (prompts.length - 1))]
}

const getDogPrompt = () => {
  return getRandomPrompt([
      "chihuahua with glasses",
      "sad dog at computer",
      "sad dog",
      "wombat playing on computer",
      "happy playstation player"
  ])
}

const getSemiDogPrompt = () => {
  return getRandomPrompt([
      "gamer grandma",
      "sad gamer",
      "sad kid gamer",
      "gamer girl",
      "nerd sitting by pc"
  ])
}

const getOkPrompt = () => {
  return getRandomPrompt([
      "testo gamer",
      "obese gamer playing pc",
      "happy pcplayer",
      "photo of wombat playing on pc"
  ])
}

const getGoodPrompt = () => {
  return getRandomPrompt([
      "muscular gamer",
      "muscular dude playing pc",
  ])
}

const getGodPrompt = () => {
  return getRandomPrompt([
    "photo of nerd sitting by pc"
  ])
}

const getMessage = async (client, nickname) => {
  try {
    const playerId = await client.Faceit.GetUserId(nickname);
    const matches = await client.Faceit.GetLatestMatches(playerId, 200, 0);
    const stats = await client.Faceit.Methods.MapStats(matches);
    const kr = parseFloat(`${stats.kr}`);
    const prompt = 
    (kr < 0.5)? getDogPrompt() : 
    (kr < 0.65)? getSemiDogPrompt() : 
    (kr < 0.75)? getOkPrompt() : 
    (kr < 0.95)? getGoodPrompt() :
    getGodPrompt()

    const image = await playerImage(nickname, prompt, {
      kr,prompt,playerId,nickname
    })

    return {
      content: `This is how I envision ${nickname} : <${`https://www.faceit.com/en/players/${nickname}`}>`,
      files: [
        image
      ]
    }
  }catch(Ex){
    console.log(Ex);

    client.error(`(COMMAND_ELO): ${Ex.message || "Unknown exception"}`)

    if(Ex.message)
      return Ex.message

    return "Unknown exception"
  }
}

module.exports = {
  commandConfig,
  chat: async (client, message) => {
    const messageParts = message.content.split(" ");

    if(messageParts.length < 3)
      return await message.reply("Missing required argument :nickname");

    const nickname = messageParts[2];
    return await message.reply(await getMessage(client, nickname));
  },
	data: new SlashCommandBuilder()
		.setName(commandConfig.command)
		.setDescription(commandConfig.description)
    .addStringOption(option =>
  		option.setName('nickname')
  			.setDescription('Faceit nickname')
  			.setRequired(true))
  ,async execute(client, interaction) {
        const nickname = interaction.options.get("nickname");

        await interaction.deferReply();

        const message = await getMessage(client, nickname.value)

		    return await interaction.editReply(message);
	},
};
