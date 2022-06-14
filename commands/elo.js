const { SlashCommandBuilder } = require('@discordjs/builders');

const commandConfig = {
  command: "elo",
  commandAlts: [ "e" ],
  description: "Fetches given players faceit elo.",
  help: "elo :nickname* :days",
}

const getMessage = async (client, nickname, depth) => {
  try {
    const eloChange = await client.Faceit.Methods.EloChange(nickname, depth);

    if(depth && typeof depth === "string")
      depth = parseInt(depth);

    return (depth)?
      `Player ${nickname}'s current elo is ${eloChange.elo}, change in past ${depth} days: ${eloChange.eloChangeString}`
      : `Player ${nickname}'s current elo is ${eloChange.elo}, change today: ${eloChange.eloChangeString}`;
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
    const depth = (messageParts.length > 3)? messageParts[3].replace("d", "") : null;
    return await message.reply(await getMessage(client, nickname, depth));
  },
	data: new SlashCommandBuilder()
		.setName(commandConfig.command)
		.setDescription(commandConfig.description)
    .addStringOption(option =>
  		option.setName('nickname')
  			.setDescription('Faceit nickname')
  			.setRequired(true))
    .addStringOption(option =>
  		option.setName('days')
  			.setDescription('Days')
  			.setRequired(false))
  ,async execute(client, interaction) {
    const nickname = interaction.options.get("nickname");
    const days = interaction.options.get("days");
		return await interaction.reply(await getMessage(client, nickname.value, (days)? days.value : null));
	},
};
