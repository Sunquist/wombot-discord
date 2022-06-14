const { SlashCommandBuilder } = require('@discordjs/builders');

const commandConfig = {
  command: "peak",
  commandAlts: [],
  description: "Fetches given players peak elo and date.",
  help: "peak :nickname*",
}

const getMessage = async (client, nickname) => {
  try {
    const user = await client.Faceit.GetUser(nickname);
    const latestMatches = await client.Faceit.GetLatestMatches(user.id, 15000, 0);
    const elo = (user && user.games && user.games.csgo)? user.games.csgo.faceit_elo : 0;

    const peakElo = {
      elo: parseInt(elo) || 0,
      date: Date.now()
    }

    latestMatches.forEach((match) => {
      if(match.elo && match.elo > peakElo.elo){
        peakElo.elo = parseInt(match.elo);
        peakElo.date = match.date;
        peakElo.match = match;
      }
    })

    const date = new Date(peakElo.date);
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();

    if(parseInt(elo) == peakElo.elo){
      return `Player ${nickname} is currently in their peak elo (${peakElo.elo})!`
    }

    return `Player ${nickname}'s peak elo is ${peakElo.elo}, recorded on: ${(day < 10)? `0${day}` : day}.${(month < 9)? `0${month + 1}`: month + 1}.${year} in game: <https://www.faceit.com/en/csgo/room/${peakElo.match.matchId}>`;
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
		return await interaction.reply(await getMessage(client, nickname.value));
	},
};
