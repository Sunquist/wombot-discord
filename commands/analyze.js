const { SlashCommandBuilder } = require('@discordjs/builders');

const commandConfig = {
  command: "analyze",
  commandAlts: [ "a" ],
  description: "Analyze a given players match.",
  help: "analyze :nickname",
}

const getMessage = async (client, nickname, matches) => {
  try {
    const playerId = await client.Faceit.GetUserId(nickname);
    const currentMatch = await client.Faceit.GetCurrentMatch(playerId);

    if(!currentMatch)
      throw({status: 200, code: "NO_MATCH_FOUND", message: "Player has no ongoing matches"})

    if(!currentMatch.teams || !currentMatch.teams.faction1)
      throw({status: 200, code: "MATCH_CONFIGURING", message: "Match room still configuring rosters."})

    return {
      content: `Gameroom: <https://www.faceit.com/en/csgo/room/${currentMatch.id}>`,
      files: [`https://test.wombot.fi/methods/analyze/${nickname}/png/analyze_${currentMatch.id}.png${(matches)? `?matches=${matches}` : ``}`]
    }
  }catch(Ex){
    console.log(Ex);

    client.error(`(COMMAND_STATS): ${Ex.message || "Unknown exception"}`)

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

    const sent = await message.reply("<a:loadinglg:941119183800901673>");
    const nickname = messageParts[2];

    const matchProp = messageParts.map(prop => prop.toLowerCase()).indexOf(":matches")
    const matches = (matchProp != -1)? messageParts[matchProp + 1] : null;

    return await sent.edit(await getMessage(client, nickname, matches));
  },
	data: new SlashCommandBuilder()
		.setName(commandConfig.command)
		.setDescription(commandConfig.description)
    .addStringOption(option =>
  		option.setName('nickname')
  			.setDescription('Faceit nickname')
  			.setRequired(true))
  ,async execute(client, interaction) {
    await interaction.deferReply();

    const analyzeMessage = await getMessage(client, interaction.options.get("nickname").value)

    return await interaction.editReply(analyzeMessage);
	},
};
